// 左コラム（module01）の中身: ロゴ → リードテキスト → instagram｜x → 「三十年商店とは？」ボタン。
// 仕様書 §14-D〜G。リードテキストはサイト設定（管理画面で編集）の値を受け取って表示。

import Image from 'next/image';
import Link from 'next/link';
import { SOCIAL_LINKS } from './nav-links';

export function SidebarLeft({ leadText }: { leadText: string }) {
  return (
    <div className="flex flex-col items-center text-center">
      {/* ロゴ（暖簾ロゴ画像・クリックでトップへ） */}
      <Link href="/" className="block w-full max-w-[260px]">
        <Image
          src="/30nen_logo_noren_plus.jpg"
          alt="三十年商店"
          width={474}
          height={362}
          priority
          className="h-auto w-full"
        />
      </Link>

      {/* リードテキスト（改行を活かして表示） */}
      <p className="serif mt-6 whitespace-pre-line text-sm leading-7 text-[#333]">
        {leadText}
      </p>

      {/* SNSリンク（instagram ｜ x） */}
      <div className="serif mt-5 flex items-center gap-3 text-sm">
        <a
          href={SOCIAL_LINKS.instagram}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#333] transition-opacity hover:opacity-60"
        >
          instagram
        </a>
        <span className="text-[#808080]">｜</span>
        <a
          href={SOCIAL_LINKS.x}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#333] transition-opacity hover:opacity-60"
        >
          x
        </a>
      </div>

      {/* 「三十年商店とは？」ボタン */}
      <Link
        href="/about"
        className="serif mt-6 flex w-44 items-center justify-center rounded-full bg-[#eeeeee] py-2 text-sm text-[#333] transition-colors hover:bg-[#150c0c] hover:text-white"
      >
        三十年商店とは？
      </Link>
    </div>
  );
}
