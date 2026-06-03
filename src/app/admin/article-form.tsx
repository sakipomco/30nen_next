'use client';
// 記事の入力フォーム（新規作成・編集で使い回す）。
// 本文は今は普通のテキスト入力欄（textarea）。あとで TipTap（リッチエディタ）に差し替える予定。
// ボタンは「下書き保存」「投稿する」の2つ。どちらを押したかは name="intent" の値でサーバーに伝わる。

import { useActionState } from 'react';
import type { ArticleFormState } from '@/app/actions/articles';
import { RichEditor } from './rich-editor';
import { FeaturedImage } from './featured-image';

type ArticleAction = (
  prevState: ArticleFormState,
  formData: FormData,
) => Promise<ArticleFormState>;

type Props = {
  action: ArticleAction;
  // この人が選べる連載（サーバー側でログイン中の人に合わせて用意して渡す）。
  categories: { id: number; name: string; depth: number }[];
  // 編集のときだけ渡す初期値（新規作成のときは undefined）
  initial?: {
    id: number;
    title: string;
    content: string;
    featuredImagePath?: string | null; // アイキャッチ画像の初期値（保存済みのパス）
    categoryId?: number | null; // 連載の初期値（保存済み）
    publishedAtInput?: string; // 公開日時の初期値（'YYYY-MM-DDTHH:MM'・日本時間）。未公開なら空。
  };
};

export function ArticleForm({ action, categories, initial }: Props) {
  const [state, formAction, pending] = useActionState<
    ArticleFormState,
    FormData
  >(action, undefined);

  // 連載の初期選択：編集なら保存済みの連載／選択肢が1つだけなら自動でそれ／それ以外は未選択。
  const defaultCategoryId =
    initial?.categoryId != null
      ? String(initial.categoryId)
      : categories.length === 1
        ? String(categories[0].id)
        : '';

  // 「投稿する」(公開)を押したとき、アイキャッチ画像が未設定なら確認する（A案：必須にはしない）。
  // hidden input(name="featuredImage")の値が空＝未設定。キャンセルなら送信を止める。
  // 下書き保存のときは呼ばない。
  function handlePublishClick(e: React.MouseEvent<HTMLButtonElement>) {
    const form = e.currentTarget.form;
    const featured = form?.elements.namedItem('featuredImage');
    const isSet =
      featured instanceof HTMLInputElement && featured.value.trim() !== '';
    if (!isSet) {
      const ok = window.confirm(
        'アイキャッチ画像が未設定です。このまま公開しますか？',
      );
      if (!ok) e.preventDefault(); // キャンセル → 送信中止
    }
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {/* 編集のときは対象の記事idを一緒に送る（見えない欄） */}
      {initial && <input type="hidden" name="id" value={initial.id} />}

      <label className="flex flex-col gap-1 text-sm">
        タイトル
        <input
          type="text"
          name="title"
          required
          defaultValue={initial?.title ?? ''}
          className="rounded-md border border-zinc-300 px-3 py-2 text-base outline-none focus:border-zinc-500"
        />
      </label>

      {/* 連載（カテゴリ）。未分類を作らないため必須。担当が1つだけなら自動で選ばれる。 */}
      <label className="flex flex-col gap-1 text-sm">
        連載
        {categories.length === 0 ? (
          <span className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-amber-700">
            連載がまだ登録されていません。管理者に連載の作成を依頼してください。
          </span>
        ) : (
          <select
            name="categoryId"
            required
            defaultValue={defaultCategoryId}
            className="w-fit rounded-md border border-zinc-300 px-3 py-2 text-base outline-none focus:border-zinc-500"
          >
            {/* 選択肢が1つに定まらないときだけ「選んでください」を出す */}
            {!defaultCategoryId && <option value="">連載を選んでください</option>}
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {'　'.repeat(c.depth) + c.name}
              </option>
            ))}
          </select>
        )}
      </label>

      <div className="flex flex-col gap-1 text-sm">
        本文
        <RichEditor name="content" initialHTML={initial?.content} />
      </div>

      <FeaturedImage name="featuredImage" initialPath={initial?.featuredImagePath} />

      <label className="flex flex-col gap-1 text-sm">
        公開日時
        <input
          type="datetime-local"
          name="publishedAt"
          defaultValue={initial?.publishedAtInput ?? ''}
          className="w-fit rounded-md border border-zinc-300 px-3 py-2 text-base outline-none focus:border-zinc-500"
        />
        <span className="text-xs text-zinc-500">
          空欄のまま「投稿する」を押すと今すぐ公開します。日時を選ぶと、その日時で公開します（過去の日付にも設定できます）。
        </span>
      </label>

      {state?.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}

      <div className="mt-2 flex gap-3">
        {/* 下書き保存 */}
        <button
          type="submit"
          name="intent"
          value="draft"
          disabled={pending}
          className="rounded-md border border-zinc-300 px-4 py-2 text-base text-zinc-700 transition-colors hover:bg-zinc-100 disabled:opacity-60"
        >
          {pending ? '保存中…' : '下書き保存'}
        </button>
        {/* 投稿する（公開） */}
        <button
          type="submit"
          name="intent"
          value="publish"
          disabled={pending}
          onClick={handlePublishClick}
          className="rounded-md bg-zinc-900 px-4 py-2 text-base font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-60"
        >
          {pending ? '送信中…' : '投稿する'}
        </button>
      </div>
    </form>
  );
}
