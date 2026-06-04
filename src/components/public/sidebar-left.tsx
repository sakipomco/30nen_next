// 左コラム（module01）の中身: ロゴ → リードテキスト → instagram｜x → 「三十年商店とは？」ボタン。
// 仕様書 §14-D〜G。リードテキストはサイト設定（管理画面で編集）の値を受け取って表示。

import type { ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { SOCIAL_LINKS } from './nav-links';

// リード文のうち「ひらがなの連なり」だけを <span class="hira-tight"> で包み、
// その部分の字間（letter-spacing）だけを詰める（現行サイト風の字詰め）。
// 改行(\n)はそのまま残し、表示側の whitespace-pre-line で1行ずつ表示される。
function renderLeadText(text: string): ReactNode[] {
  const isHiragana = (ch: string) => /[ぁ-ゟ]/.test(ch);
  const nodes: ReactNode[] = [];
  let buf = '';
  let bufIsHira = false;
  const flush = (key: number) => {
    if (!buf) return;
    nodes.push(
      bufIsHira ? (
        <span key={key} className="hira-tight">
          {buf}
        </span>
      ) : (
        buf
      ),
    );
    buf = '';
  };
  for (let i = 0; i < text.length; i++) {
    const hira = isHiragana(text[i]);
    if (buf && hira !== bufIsHira) flush(i);
    bufIsHira = hira;
    buf += text[i];
  }
  flush(text.length);
  return nodes;
}

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

      {/* リードテキスト（改行を活かす・少し太め・ひらがな部分だけ字間を詰める） */}
      <p className="serif mt-6 whitespace-pre-line text-sm font-medium leading-6 text-[#333]">
        {renderLeadText(leadText)}
      </p>

      {/* SNSリンク（instagram ｜ x） */}
      <div className="serif mt-3 flex items-center gap-3 text-sm">
        <a
          href={SOCIAL_LINKS.instagram}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#2563eb] transition-opacity hover:opacity-60"
        >
          instagram
        </a>
        <span className="text-[#808080]">｜</span>
        <a
          href={SOCIAL_LINKS.x}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#2563eb] transition-opacity hover:opacity-60"
        >
          x
        </a>
      </div>

      {/* 書き手募集（スマホ版のみ・SNSリンクの下）。スミケイ（黒い罫線）で囲んだリンク。 */}
      <a
        href="https://30nen.com/about/#wanted"
        className="serif mt-5 inline-block scale-[0.8] border-[0.5px] border-[#150c0c] py-0.5 pl-1.5 pr-1 text-xs text-[#333] transition-colors hover:bg-[#150c0c] hover:text-white lg:hidden"
      >
        書き手さん
        {/* 読点「、」の後ろのアキを詰める */}
        <span className="tracking-[-0.4em]">、</span>
        募集中
        {/* 「！」だけを箱で包んで20度・時計回りに傾ける */}
        <span className="inline-block rotate-[20deg]">！</span>
      </a>

      {/* 「三十年商店とは？」ボタン */}
      <Link
        href="/about"
        className="serif mt-6 hidden w-36 items-center justify-center rounded-full bg-[#eeeeee] py-1.5 text-sm text-[#333] transition-colors hover:bg-[#150c0c] hover:text-white lg:flex"
      >
        三十年商店とは？
      </Link>
    </div>
  );
}
