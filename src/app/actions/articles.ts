'use server';
// 記事の保存・更新・削除を行う Server Action（サーバー側で動く処理）。
// 投稿フォームから呼ぶ。⚠ どれも先頭で requireUser() を呼び、ログイン中の人だけが実行できるようにする。

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireUser } from '@/auth/session';
import { createArticle, updateArticle, deleteArticle } from '@/db/articles';
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

  await createArticle({
    title,
    content,
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
  await requireUser();

  const id = Number(formData.get('id'));
  const title = String(formData.get('title') ?? '').trim();
  const content = String(formData.get('content') ?? '');
  if (!Number.isInteger(id) || id <= 0) {
    return { error: '記事が見つかりませんでした。' };
  }
  if (!title) {
    return { error: 'タイトルを入力してください。' };
  }

  const updated = await updateArticle(id, {
    title,
    content,
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
