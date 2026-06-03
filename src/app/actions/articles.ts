'use server';
// 記事の保存・更新・削除を行う Server Action（サーバー側で動く処理）。
// 投稿フォームから呼ぶ。⚠ どれも先頭で requireUser() を呼び、ログイン中の人だけが実行できるようにする。

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireUser } from '@/auth/session';
import type { PublicUser } from '@/db/users';
import { createArticle, updateArticle, deleteArticle } from '@/db/articles';
import {
  getCategoryById,
  getCategoriesForUser,
  setUserCategory,
} from '@/db/categories';
import { jstInputToUtc } from '@/lib/datetime';

// useActionState に渡すための状態の形（エラー文言を画面に返す）。
export type ArticleFormState = { error?: string } | undefined;

// フォームの送信ボタンの種類（intent）→ 公開状態に変換する。
// 「下書き保存」= draft、「投稿する」= published。
function statusFromIntent(formData: FormData): 'draft' | 'published' {
  return formData.get('intent') === 'publish' ? 'published' : 'draft';
}

// フォームの「公開日時」欄を読む。
//  - 空欄          → undefined（＝即時投稿。公開時はサーバー側で「今」を補う）
//  - 日時を指定済み → その日時（日本時間）をUTCに直して返す（さかのぼり等）
function publishedAtFromForm(formData: FormData): string | undefined {
  const input = String(formData.get('publishedAt') ?? '').trim();
  return input ? jstInputToUtc(input) : undefined;
}

// アイキャッチ画像のパスを読む。空欄（未設定・削除）は null として保存する。
function featuredImageFromForm(formData: FormData): string | null {
  const input = String(formData.get('featuredImage') ?? '').trim();
  return input ? input : null;
}

// 連載(カテゴリ)を読み、検証し、担当ルールを適用する。
//  - 連載は必須（未分類を作らない）。
//  - 投稿者(author)で担当が未登録なら、選んだ連載を担当として記録（次回から自動）。
//  - 投稿者で担当が登録済みなら、その範囲内からしか選べない。
//  - 管理者(admin)は全連載から自由に選べる（担当としては記録しない）。
// 成功なら { categoryId }、失敗なら { error } を返す。
async function resolveCategory(
  user: PublicUser,
  formData: FormData,
): Promise<{ categoryId: number } | { error: string }> {
  const categoryId = Number(formData.get('categoryId'));
  if (!Number.isInteger(categoryId) || categoryId <= 0) {
    return { error: '連載を選んでください。' };
  }
  const category = await getCategoryById(categoryId);
  if (!category) {
    return { error: '選んだ連載が見つかりませんでした。' };
  }

  if (user.role === 'author') {
    const assigned = await getCategoriesForUser(user.id);
    if (assigned.length === 0) {
      // 担当未登録 → 選んだ連載を担当として記録（A案：選んでからだけ投稿可）
      await setUserCategory(user.id, categoryId);
    } else if (!assigned.some((c) => c.id === categoryId)) {
      return { error: '担当の連載の中から選んでください。' };
    }
  }

  return { categoryId };
}

// ── 新規作成 ─────────────────────────────────────────────
export async function createArticleAction(
  _prevState: ArticleFormState,
  formData: FormData,
): Promise<ArticleFormState> {
  const user = await requireUser();

  const title = String(formData.get('title') ?? '').trim();
  const content = String(formData.get('content') ?? '');
  if (!title) {
    return { error: 'タイトルを入力してください。' };
  }

  const category = await resolveCategory(user, formData);
  if ('error' in category) return { error: category.error };

  await createArticle({
    title,
    content,
    categoryId: category.categoryId,
    featuredImagePath: featuredImageFromForm(formData),
    status: statusFromIntent(formData),
    publishedAt: publishedAtFromForm(formData), // 未指定なら公開時に「今」を自動補完
    authorId: user.id, // 書いた人＝今ログイン中の人
  });

  revalidatePath('/admin'); // 一覧の表示を最新に
  redirect('/admin');
}

// ── 更新（編集）──────────────────────────────────────────
export async function updateArticleAction(
  _prevState: ArticleFormState,
  formData: FormData,
): Promise<ArticleFormState> {
  const user = await requireUser();

  const id = Number(formData.get('id'));
  const title = String(formData.get('title') ?? '').trim();
  const content = String(formData.get('content') ?? '');
  if (!Number.isInteger(id) || id <= 0) {
    return { error: '記事が見つかりませんでした。' };
  }
  if (!title) {
    return { error: 'タイトルを入力してください。' };
  }

  const category = await resolveCategory(user, formData);
  if ('error' in category) return { error: category.error };

  const updated = await updateArticle(id, {
    title,
    content,
    categoryId: category.categoryId,
    featuredImagePath: featuredImageFromForm(formData),
    status: statusFromIntent(formData),
    publishedAt: publishedAtFromForm(formData), // 未指定なら既存の公開日時を維持
  });
  if (!updated) {
    return { error: '記事が見つかりませんでした。' };
  }

  revalidatePath('/admin');
  redirect('/admin');
}

// ── 削除 ─────────────────────────────────────────────────
// 一覧の各記事に置く小さなフォームから呼ぶ（formData の id を消す）。
export async function deleteArticleAction(formData: FormData): Promise<void> {
  await requireUser();

  const id = Number(formData.get('id'));
  if (Number.isInteger(id) && id > 0) {
    await deleteArticle(id);
    revalidatePath('/admin');
  }
}
