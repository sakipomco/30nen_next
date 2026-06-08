// 左コラム（module01）の中身: ロゴ → リードテキスト → instagram｜x → 「三十年商店とは？」ボタン。
// 仕様書 §14-D〜G。リードテキストはサイト設定（管理画面で編集）の値を受け取って表示。

import Image from 'next/image';
import Link from 'next/link';
import { SOCIAL_LINKS } from './nav-links';
import { renderHiraTight } from './hira-tight';
import { ContactFormSlot } from './contact-form-slot';
import type { ContactRecipient } from './contact-form';

export function SidebarLeft({
  leadText,
  recipients,
}: {
  leadText: string;
  recipients: ContactRecipient[];
}) {
  return (
    <div className="flex flex-col items-center text-center">
      {/* ロゴ（暖簾ロゴ画像・クリックでトップへ）。
          PC（lg以上）では上の余白だけ打ち消して上端ぴったりに（左右は中央のまま）。
          スマホは中央・大きめのまま。 */}
      <Link href="/" className="-mt-10 block w-full max-w-[260px] lg:-mt-12">
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
        {renderHiraTight(leadText)}
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
        className="serif mt-6 hidden w-36 items-center justify-center rounded-full bg-[#eeeeee] py-0.5 text-xs leading-tight text-[#333] transition-colors hover:bg-[#150c0c] hover:text-white lg:flex"
      >
        三十年商店とは？
      </Link>

      {/* お便りフォーム（左コラム）。トップページ以外でのみ表示（ContactFormSlot が出し分け）。
          宛先プルダウンに並べる連載一覧を渡す。 */}
      <ContactFormSlot recipients={recipients} />
    </div>
  );
}
