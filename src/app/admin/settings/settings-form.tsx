'use client';
// サイト設定の入力フォーム（クライアント部品）。
// useActionState で「保存中…」表示・保存後のメッセージ・エラー表示を出す。

import { useActionState } from 'react';
import {
  updateLeadTextAction,
  type SettingsFormState,
} from '@/app/actions/settings';

export function LeadTextForm({ initialValue }: { initialValue: string }) {
  const [state, formAction, pending] = useActionState<
    SettingsFormState,
    FormData
  >(updateLeadTextAction, undefined);

  return (
    <form action={formAction} className="space-y-3">
      <label
        htmlFor="leadText"
        className="block text-sm font-medium text-zinc-700"
      >
        リードテキスト（トップページのロゴ下に出る紹介文）
      </label>
      <textarea
        id="leadText"
        name="leadText"
        rows={8}
        defaultValue={initialValue}
        className="w-full rounded-md border border-zinc-300 p-3 text-sm leading-relaxed text-zinc-900 focus:border-zinc-500 focus:outline-none"
      />

      {state?.error && (
        <p className="text-sm text-red-600">{state.error}</p>
      )}
      {state?.ok && (
        <p className="text-sm text-green-700">保存しました。</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50"
      >
        {pending ? '保存中…' : '保存する'}
      </button>
    </form>
  );
}
