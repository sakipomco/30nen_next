'use client';
// スマホ用ハンバーガーメニュー（lg未満で表示）。仕様書 §14-K〜N。
// ・開くボタンは画面右下に固定（三丸アイコン 30nen_sanmaru.png）。開くと「閉」表示。
// ・全画面の白いオーバーレイで、小商店／検索／アーカイブ＋左端メニュー5項目＋「三十年商店とは？」ボタンを表示。
// ・開いている間は背景（本体ページ）のスクロールを固定する。

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { SidebarContent } from './sidebar-right';
import type { SeriesItem } from './series-list';
import { PAGE_LINKS } from './nav-links';

export function HamburgerMenu({ series }: { series: SeriesItem[] }) {
  const [open, setOpen] = useState(false);

  // 開いている間は背景のスクロールを止める。
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  // Escキーで閉じる。
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div className="lg:hidden">
      {/* 開く／閉じるボタン（右下固定） */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'メニューを閉じる' : 'メニューを開く'}
        aria-expanded={open}
        className="fixed bottom-4 right-4 z-[120] flex h-[50px] w-[50px] items-center justify-center rounded-full bg-[#150c0c] text-white shadow-lg"
      >
        {open ? (
          <span className="serif text-sm">閉</span>
        ) : (
          <Image src="/30nen_sanmaru.png" alt="" width={30} height={30} unoptimized />
        )}
      </button>

      {/* 全画面オーバーレイ */}
      {open && (
        <div className="fixed inset-0 z-[110] overflow-y-auto bg-white px-6 pb-28 pt-10">
          {/* 「三十年商店とは？」ボタン */}
          <Link
            href="/about"
            onClick={close}
            className="serif mx-auto mb-10 flex w-40 items-center justify-center rounded-full bg-[#eeeeee] py-2 text-sm text-[#333] transition-colors hover:bg-[#150c0c] hover:text-white"
          >
            三十年商店とは？
          </Link>

          {/* 小商店・検索・アーカイブ */}
          <div onClick={close}>
            <SidebarContent series={series} />
          </div>

          {/* 左端メニュー5項目 */}
          <ul className="mt-10 space-y-3 border-t border-[#150c0c]/15 pt-8">
            {PAGE_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={close}
                  className="serif block text-sm text-[#333] transition-opacity hover:opacity-60"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
