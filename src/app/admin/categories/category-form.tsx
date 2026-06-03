'use client';
// 連載(カテゴリ)の入力フォーム（新規作成・編集で使い回す）。
// 欄：連載名（必須）／親連載（任意・トップ階層なら「なし」）／並び順／URL名札(slug・任意)。

import { useActionState } from 'react';
import type { CategoryFormState } from '@/app/actions/categories';

type CategoryAction = (
  prevState: CategoryFormState,
  formData: FormData,
) => Promise<CategoryFormState>;

// 親連載の選択肢（字下げ表示のため depth 付き）。
export type ParentOption = { id: number; name: string; depth: number };

type Props = {
  action: CategoryAction;
  parentOptions: ParentOption[]; // 親に選べる連載の一覧
  // 編集のときだけ渡す初期値
  initial?: {
    id: number;
    name: string;
    slug: string | null;
    parentId: number | null;
    sortOrder: number;
  };
  submitLabel?: string; // ボタンの文言（既定: 保存）
};

export function CategoryForm({
  action,
  parentOptions,
  initial,
  submitLabel = '保存',
}: Props) {
  const [state, formAction, pending] = useActionState<
    CategoryFormState,
    FormData
  >(action, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {initial && <input type="hidden" name="id" value={initial.id} />}

      <label className="flex flex-col gap-1 text-sm">
        連載名
        <input
          type="text"
          name="name"
          required
          defaultValue={initial?.name ?? ''}
          className="rounded-md border border-zinc-300 px-3 py-2 text-base outline-none focus:border-zinc-500"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        親連載（入れ子にするとき選ぶ・無ければ「なし」）
        <select
          name="parentId"
          defaultValue={initial?.parentId != null ? String(initial.parentId) : ''}
          className="w-fit rounded-md border border-zinc-300 px-3 py-2 text-base outline-none focus:border-zinc-500"
        >
          <option value="">（なし＝トップ階層）</option>
          {parentOptions.map((p) => (
            <option key={p.id} value={p.id}>
              {'　'.repeat(p.depth) + p.name}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        並び順（小さいほど上に出ます・既定 0）
        <input
          type="number"
          name="sortOrder"
          defaultValue={initial?.sortOrder ?? 0}
          className="w-32 rounded-md border border-zinc-300 px-3 py-2 text-base outline-none focus:border-zinc-500"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        URL名札（slug・任意・半角英数字とハイフン）
        <input
          type="text"
          name="slug"
          defaultValue={initial?.slug ?? ''}
          placeholder="例: tabitabi-no-tabi"
          className="rounded-md border border-zinc-300 px-3 py-2 text-base outline-none focus:border-zinc-500"
        />
        <span className="text-xs text-zinc-500">
          公開ページのURLに使う名札です。空欄でもかまいません（あとで設定できます）。
        </span>
      </label>

      {state?.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}

      <div className="mt-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-zinc-900 px-4 py-2 text-base font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-60"
        >
          {pending ? '保存中…' : submitLabel}
        </button>
      </div>
    </form>
  );
}
