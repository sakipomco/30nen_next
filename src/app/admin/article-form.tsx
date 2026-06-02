'use client';
// 記事の入力フォーム（新規作成・編集で使い回す）。
// 本文は今は普通のテキスト入力欄（textarea）。あとで TipTap（リッチエディタ）に差し替える予定。
// ボタンは「下書き保存」「投稿する」の2つ。どちらを押したかは name="intent" の値でサーバーに伝わる。

import { useActionState } from 'react';
import type { ArticleFormState } from '@/app/actions/articles';

type ArticleAction = (
  prevState: ArticleFormState,
  formData: FormData,
) => Promise<ArticleFormState>;

type Props = {
  action: ArticleAction;
  // 編集のときだけ渡す初期値（新規作成のときは undefined）
  initial?: {
    id: number;
    title: string;
    content: string;
  };
};

export function ArticleForm({ action, initial }: Props) {
  const [state, formAction, pending] = useActionState<
    ArticleFormState,
    FormData
  >(action, undefined);

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

      <label className="flex flex-col gap-1 text-sm">
        本文
        <textarea
          name="content"
          rows={12}
          defaultValue={initial?.content ?? ''}
          className="rounded-md border border-zinc-300 px-3 py-2 text-base leading-7 outline-none focus:border-zinc-500"
        />
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
          className="rounded-md bg-zinc-900 px-4 py-2 text-base font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-60"
        >
          {pending ? '送信中…' : '投稿する'}
        </button>
      </div>
    </form>
  );
}
