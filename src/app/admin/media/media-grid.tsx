'use client';
// 画像フォルダ一覧の見た目（クライアント側）。
//  ・サムネイルを並べる
//  ・クリックで大きく拡大（黒い画面に全体表示・もう一度クリックで閉じる）
//  ・削除できる写真にだけ「削除」ボタン（押すと確認ダイアログ）

import { useState } from 'react';
import Image from 'next/image';
import { deleteUploadAction } from '@/app/actions/media';

type Item = {
  url: string;
  canDelete: boolean; // 自分の写真 or 管理者なら true
};

export function MediaGrid({ items }: { items: Item[] }) {
  const [zoom, setZoom] = useState<string | null>(null);

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center text-zinc-500">
        まだ写真がありません。日記に写真を入れると、ここに集まります。
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {items.map((it) => (
          <div key={it.url} className="group relative">
            {/* サムネイル（押すと拡大） */}
            <button
              type="button"
              onClick={() => setZoom(it.url)}
              className="relative block aspect-square w-full overflow-hidden rounded-md border border-zinc-200 bg-zinc-100"
            >
              <Image
                src={it.url}
                alt=""
                fill
                sizes="(min-width:1024px) 16vw, (min-width:640px) 25vw, 50vw"
                className="object-cover transition group-hover:opacity-90"
              />
            </button>

            {/* 削除（自分の写真 or 管理者だけに出る） */}
            {it.canDelete && (
              <form
                action={deleteUploadAction}
                onSubmit={(e) => {
                  if (
                    !window.confirm(
                      'この写真を削除しますか？元に戻せません。\n（記事で使っている写真を消すと、その記事から写真が消えます）',
                    )
                  ) {
                    e.preventDefault();
                  }
                }}
                className="absolute right-1 top-1"
              >
                <input type="hidden" name="path" value={it.url} />
                <button
                  type="submit"
                  className="rounded bg-black/60 px-2 py-1 text-xs text-white opacity-0 transition hover:bg-red-600 group-hover:opacity-100"
                >
                  削除
                </button>
              </form>
            )}
          </div>
        ))}
      </div>

      {/* 拡大表示（クリックで閉じる） */}
      {zoom && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setZoom(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
        >
          <div className="relative h-full w-full">
            <Image src={zoom} alt="" fill sizes="100vw" className="object-contain" />
          </div>
        </div>
      )}
    </>
  );
}
