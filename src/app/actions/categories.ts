'use server';
// 連載(カテゴリ)の作成・更新・削除を行う Server Action（サーバー側で動く処理）。
// 連載の管理は管理者だけ → どれも先頭で requireAdmin() を呼ぶ。

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/auth/session';
import {
  createCategory,
  updateCategory,
  deleteCategory,
} from '@/db/categories';

// useActionState に渡す状態の形（エラー文言を画面に返す）。
export type CategoryFormState = { error?: string } | undefined;

// フォームの各欄を読み取って整える。
function readForm(formData: FormData): {
  name: string;
  slug: string | null;
  parentId: number | null;
  sortOrder: number;
  imagePath: string | null;
} {
  const name = String(formData.get('name') ?? '').trim();
  const slugRaw = String(formData.get('slug') ?? '').trim();
  const parentRaw = String(formData.get('parentId') ?? '').trim();
  const sortRaw = String(formData.get('sortOrder') ?? '').trim();
  const imageRaw = String(formData.get('imagePath') ?? '').trim();
  return {
    name,
    slug: slugRaw || null,        // 空欄は null（URL名札なし）
    parentId: parentRaw ? Number(parentRaw) : null, // 空欄＝トップ階層
    sortOrder: sortRaw ? Number(sortRaw) : 0,
    imagePath: imageRaw || null,  // 空欄は null（画像なし）
  };
}

// ── 新規作成 ─────────────────────────────────────────────
export async function createCategoryAction(
  _prevState: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  await requireAdmin();

  const { name, slug, parentId, sortOrder, imagePath } = readForm(formData);
  if (!name) return { error: '連載名を入力してください。' };

  try {
    await createCategory({ name, slug, parentId, sortOrder, imagePath });
  } catch (e) {
    // slug の重複（unique制約）など
    return { error: slugErrorMessage(e) };
  }

  revalidatePath('/admin/categories');
  redirect('/admin/categories');
}

// ── 更新（編集）──────────────────────────────────────────
export async function updateCategoryAction(
  _prevState: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  await requireAdmin();

  const id = Number(formData.get('id'));
  if (!Number.isInteger(id) || id <= 0) {
    return { error: '連載が見つかりませんでした。' };
  }
  const { name, slug, parentId, sortOrder, imagePath } = readForm(formData);
  if (!name) return { error: '連載名を入力してください。' };
  if (parentId === id) {
    return { error: '自分自身を親に設定することはできません。' };
  }

  try {
    const updated = await updateCategory(id, { name, slug, parentId, sortOrder, imagePath });
    if (!updated) return { error: '連載が見つかりませんでした。' };
  } catch (e) {
    return { error: slugErrorMessage(e) };
  }

  revalidatePath('/admin/categories');
  redirect('/admin/categories');
}

// ── 削除 ─────────────────────────────────────────────────
// 一覧の各行に置く小さなフォームから呼ぶ。子連載や記事があれば消さない（データ層が判定）。
export async function deleteCategoryAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = Number(formData.get('id'));
  if (Number.isInteger(id) && id > 0) {
    await deleteCategory(id); // 消せない場合は何もしない（ガードはデータ層側）
    revalidatePath('/admin/categories');
  }
}

// slug 重複などの保存エラーを、利用者に分かる日本語にする。
function slugErrorMessage(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  if (msg.includes('UNIQUE') && msg.includes('slug')) {
    return 'そのURL名札(slug)は既に使われています。別の名札にしてください。';
  }
  return '保存に失敗しました。入力内容を確認してください。';
}
