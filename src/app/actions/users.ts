'use server';
// 投稿者(ユーザー)の作成・更新・削除を行う Server Action。
// ユーザー管理は管理者だけ → どれも先頭で requireAdmin() を呼ぶ。
// 「担当連載」もここで一緒に設定する（担当名簿 category_authors への登録・1人1連載）。

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/auth/session';
import {
  createUser,
  updateUser,
  deleteUser,
  countAdmins,
  getUserById,
} from '@/db/users';
import { setUserCategory } from '@/db/categories';

export type UserFormState = { error?: string } | undefined;

// フォームの共通項目を読み取る。
function readForm(formData: FormData) {
  return {
    name: String(formData.get('name') ?? '').trim(),
    email: String(formData.get('email') ?? '').trim(),
    password: String(formData.get('password') ?? ''), // 編集では空欄＝据え置き
    role: formData.get('role') === 'admin' ? ('admin' as const) : ('author' as const),
    bio: String(formData.get('bio') ?? '').trim() || null,
    categoryId: String(formData.get('categoryId') ?? '').trim()
      ? Number(formData.get('categoryId'))
      : null, // 担当連載（空欄＝担当なし）
  };
}

// メール重複(unique制約)などの保存エラーを日本語にする。
function saveErrorMessage(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  if (msg.includes('UNIQUE') && msg.includes('email')) {
    return 'そのメールアドレスは既に使われています。別のアドレスにしてください。';
  }
  return '保存に失敗しました。入力内容を確認してください。';
}

// ── 新規作成 ─────────────────────────────────────────────
export async function createUserAction(
  _prevState: UserFormState,
  formData: FormData,
): Promise<UserFormState> {
  await requireAdmin();

  const { name, email, password, role, bio, categoryId } = readForm(formData);
  if (!name) return { error: '名前を入力してください。' };
  if (!email) return { error: 'メールアドレスを入力してください。' };
  if (!password) return { error: 'パスワードを入力してください。' };

  try {
    const created = await createUser({ name, email, password, role, bio });
    await setUserCategory(created.id, categoryId); // 担当連載を登録（なしも可）
  } catch (e) {
    return { error: saveErrorMessage(e) };
  }

  revalidatePath('/admin/users');
  redirect('/admin/users');
}

// ── 更新（編集）──────────────────────────────────────────
export async function updateUserAction(
  _prevState: UserFormState,
  formData: FormData,
): Promise<UserFormState> {
  const admin = await requireAdmin();

  const id = Number(formData.get('id'));
  if (!Number.isInteger(id) || id <= 0) {
    return { error: '投稿者が見つかりませんでした。' };
  }
  const { name, email, password, role, bio, categoryId } = readForm(formData);
  if (!name) return { error: '名前を入力してください。' };
  if (!email) return { error: 'メールアドレスを入力してください。' };

  // 自分自身を管理者→投稿者に降格できないようにする（自分で締め出すのを防ぐ）。
  const target = await getUserById(id);
  if (!target) return { error: '投稿者が見つかりませんでした。' };
  if (id === admin.id && role !== 'admin') {
    return { error: '自分自身の権限（管理者）は変更できません。' };
  }
  // 最後の管理者を投稿者へ降格させない。
  if (target.role === 'admin' && role !== 'admin' && (await countAdmins()) <= 1) {
    return { error: '管理者が0人になってしまうため、この人を降格できません。' };
  }

  try {
    // password は空欄なら据え置き（updateUser 側で判定）。
    await updateUser(id, { name, email, role, bio, password: password || undefined });
    await setUserCategory(id, categoryId);
  } catch (e) {
    return { error: saveErrorMessage(e) };
  }

  revalidatePath('/admin/users');
  redirect('/admin/users');
}

// ── 削除 ─────────────────────────────────────────────────
// 自分自身は消せない。最後の管理者も消せない。記事を持つ人も消せない（データ層が判定）。
export async function deleteUserAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();

  const id = Number(formData.get('id'));
  if (!Number.isInteger(id) || id <= 0) return;
  if (id === admin.id) return; // 自分自身は消さない

  const target = await getUserById(id);
  if (!target) return;
  if (target.role === 'admin' && (await countAdmins()) <= 1) return; // 最後の管理者は守る

  await deleteUser(id); // 記事を持つ人は消えない（ガードはデータ層側）
  revalidatePath('/admin/users');
}
