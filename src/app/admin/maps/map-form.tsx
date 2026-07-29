'use client';
// 旅の行程マップ（地図の棚）の入力フォーム（新規登録・編集で使い回す）。
// 欄：地図の名前（必須・本文の [MAP:名前] と揃える）／地図の画像（必須）。

import { useActionState } from 'react';
import type { MapFormState } from '@/app/actions/maps';
import { FeaturedImage } from '@/app/admin/featured-image';

type MapAction = (
  prevState: MapFormState,
  formData: FormData,
) => Promise<MapFormState>;

type Props = {
  action: MapAction;
  // 編集のときだけ渡す初期値
  initial?: {
    id: number;
    name: string;
    imagePath: string;
  };
  submitLabel?: string; // ボタンの文言（既定: 保存）
};

export function MapForm({ action, initial, submitLabel = '保存' }: Props) {
  const [state, formAction, pending] = useActionState<MapFormState, FormData>(
    action,
    undefined,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {initial && <input type="hidden" name="id" value={initial.id} />}

      <label className="flex flex-col gap-1 text-sm">
        地図の名前
        <input
          type="text"
          name="name"
          required
          maxLength={30}
          defaultValue={initial?.name ?? ''}
          placeholder="例: 2025欧州"
          className="rounded-md border border-zinc-300 px-3 py-2 text-base outline-none focus:border-zinc-500"
        />
        <span className="text-xs text-zinc-500">
          記事の本文に書く名札です。書き手さんが手で打つので、
          <strong>年＋地域</strong>のように短くしてください（例: 2025欧州・2026山陰）。
        </span>
      </label>

      {/* 地図の画像：折りたたみを開いたときに表示される */}
      <div className="flex flex-col gap-1 text-sm">
        <span>地図の画像</span>
        <FeaturedImage name="imagePath" initialPath={initial?.imagePath ?? null} />
        <span className="text-xs text-zinc-500">
          あとからここを差し替えると、
          <strong>この名前を使っている記事すべての地図が一斉に新しくなります</strong>。
        </span>
      </div>

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
