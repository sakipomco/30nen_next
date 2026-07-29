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
          PC（lg以上）はコラム側の上余白を外してあるのでマイナス余白なしで上端に付く
          （マイナス余白は独立スクロールの箱では上が切れるため使わない）。
          スマホは従来どおり -mt-10 でページ上部の余白を打ち消す。 */}
      <Link
        href="/"
        aria-label="三十年商店"
        className="-mt-10 block w-full max-w-[260px] lg:mt-0 lg:max-w-[247px]"
      >
        {/* 暖簾がはためく動画（音なし・自動再生・繰り返し）。
            muted＋playsInline はスマホで自動再生させるための必須条件。 */}
        <video
          src="/30nen_logo_noren_video.mp4"
          autoPlay
          loop
          muted
          playsInline
          width={1280}
          height={720}
          className="h-auto w-full"
        />
        {/* 動画のすぐ下：ロゴの下部テキスト画像（「三十年商店」の文字部分）。
            のれん動画とのあいだに mt-2（8px）のアキ（SAKIさん指定 2026-07-13） */}
        <Image
          src="/30nen_logo_moren_shitatext.png"
          alt="三十年商店"
          width={473}
          height={76}
          priority
          className="mt-2 h-auto w-full"
        />
      </Link>

      {/* リードテキスト（改行を活かす・少し太め・ひらがな部分だけ字間を詰める）
          ロゴ下のキャッチとのアキは mt-12（48px）。mt-6（24px）では近すぎたため
          広げた（SAKIさん指定 2026-07-29・切替当日） */}
      <p className="serif mt-12 whitespace-pre-line text-sm font-medium leading-6 text-[#333]">
        {renderHiraTight(leadText)}
      </p>

      {/* SNSリンク（instagram ｜ x）。「｜」両脇のアキは半分に詰めた（gap-3→gap-1.5・SAKIさん指定 2026-07-13） */}
      <div className="serif mt-3 flex items-center gap-1.5 text-sm">
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
      <Link
        href="/about#wanted"
        className="serif mt-5 inline-block scale-[0.8] border-[0.5px] border-[#150c0c] py-0.5 pl-1.5 pr-1 text-xs text-[#333] transition-colors hover:bg-[#150c0c] hover:text-white lg:hidden"
      >
        書き手さん
        {/* 読点「、」の後ろのアキを詰める */}
        <span className="tracking-[-0.4em]">、</span>
        募集中
        {/* 「！」だけを箱で包んで20度・時計回りに傾ける */}
        <span className="inline-block rotate-[20deg]">！</span>
      </Link>

      {/* 「三十年商店とは？」ボタン */}
      <Link
        href="/about"
        className="serif mt-6 hidden w-32 items-center justify-center rounded-full bg-[#eeeeee] py-0.5 text-xs leading-tight text-[#333] transition-colors hover:bg-[#150c0c] hover:text-white lg:flex"
      >
        三十年商店とは？
      </Link>

      {/* お便りフォーム（左コラム）。トップページ以外でのみ表示（ContactFormSlot が出し分け）。
          さらにスマホ（lg未満）では非表示にする＝モバイルは縦1列で左コラムが日記の上に積まれ、
          フォームが日記より前に出てしまうのを防ぐため。PC（lg以上）でのみ表示する。
          宛先プルダウンに並べる連載一覧を渡す。 */}
      <div className="hidden w-full lg:block">
        <ContactFormSlot recipients={recipients} />
      </div>
    </div>
  );
}
