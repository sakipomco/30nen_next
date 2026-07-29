// 旅の行程マップ（地図の棚）の管理画面（/admin/maps）。管理者だけが見られる。
// 棚に置いた地図の一覧＋「新規登録」フォーム。各地図に編集・削除。
//
// 使い方: ここで名前を付けて地図を登録し、記事の本文に [MAP:名前] と書くと、
// その場所に「MAPを見る」ボタンが出る（押すと地図が開く）。

import Link from 'next/link';
import Image from 'next/image';
import { requireAdmin } from '@/auth/session';
import { createMapAction, deleteMapAction } from '@/app/actions/maps';
import { listMaps } from '@/db/maps';
import { MapForm } from './map-form';

export const metadata = {
  title: '旅の地図｜30nen',
};

export default async function MapsAdminPage() {
  await requireAdmin();

  const maps = await listMaps();

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 px-4 py-12">
      <div className="w-full max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-zinc-900">旅の地図</h1>
          <Link href="/admin" className="text-sm text-zinc-500 hover:underline">
            ← 投稿へ戻る
          </Link>
        </div>

        {/* 使い方の説明（書き手さんに伝える内容そのまま） */}
        <div className="mb-8 rounded-lg border border-zinc-200 bg-white p-5 text-sm leading-relaxed text-zinc-700">
          <p className="mb-2 font-medium text-zinc-900">使い方</p>
          <p>
            記事の本文に{' '}
            <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-[0.85em]">
              [MAP:2025欧州]
            </code>{' '}
            と書くと、その場所に「MAPを見る」ボタンが出ます。
            押した人だけが地図を開けるので、記事が地図でうるさくなりません。
          </p>
          <p className="mt-2 text-zinc-500">
            ・その行には<strong>地図の記法だけ</strong>を書いてください（前後に文章を混ぜない）。
            <br />
            ・登録していない名前を書いた場合、読者には何も出ません。
            書き手さんの下書きプレビューにだけ注意書きが出ます。
            <br />
            ・地図は<strong>押されるまで読み込まれない</strong>ので、記事は軽いままです。
          </p>
        </div>

        {/* 地図の一覧 */}
        {maps.length === 0 ? (
          <div className="mb-8 rounded-lg border border-zinc-200 bg-white p-8 text-center text-zinc-500">
            まだ地図がありません。下のフォームから登録してください。
          </div>
        ) : (
          <ul className="mb-8 divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white">
            {maps.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-4 p-4">
                <div className="flex min-w-0 items-center gap-4">
                  <span className="relative block h-14 w-20 shrink-0 overflow-hidden rounded border border-zinc-200 bg-zinc-50">
                    <Image
                      src={m.imagePath}
                      alt={m.name}
                      fill
                      sizes="80px"
                      className="object-contain"
                    />
                  </span>
                  <div className="min-w-0">
                    <span className="font-medium text-zinc-900">{m.name}</span>
                    <p className="mt-1 text-xs text-zinc-400">
                      本文に書く記法:{' '}
                      <code className="rounded bg-zinc-100 px-1 py-0.5">
                        [MAP:{m.name}]
                      </code>
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Link
                    href={`/admin/maps/${m.id}/edit`}
                    className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 transition-colors hover:bg-zinc-100"
                  >
                    編集
                  </Link>
                  <form action={deleteMapAction}>
                    <input type="hidden" name="id" value={m.id} />
                    <button
                      type="submit"
                      className="rounded-md border border-red-200 px-3 py-1.5 text-sm text-red-600 transition-colors hover:bg-red-50"
                    >
                      削除
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* 新規登録フォーム */}
        <div className="rounded-lg border border-zinc-200 bg-white p-6">
          <h2 className="mb-4 text-base font-semibold text-zinc-900">
            地図を新規登録
          </h2>
          <MapForm action={createMapAction} submitLabel="登録する" />
        </div>
      </div>
    </div>
  );
}
