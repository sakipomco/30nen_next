'use client';
// リードテキスト（左コラムのロゴ下の文章）の表示制御。
// 日記1本を読むページ（/posts/… と下書きプレビュー /preview/…）では表示しない。
// 理由＝そのページの左コラムはリードの代わりにお便りフォームを見せたいため
//（SAKIさん指定 2026-08-02）。スマホでは左コラムごと隠れる（sidebar-left-slot）ので、
// この出し分けが効くのは実質PC（lg以上）。

import { usePathname } from 'next/navigation';
import { isArticlePath } from './article-path';
import { renderHiraTight } from './hira-tight';

export function LeadTextSlot({ text }: { text: string }) {
  const pathname = usePathname();
  if (isArticlePath(pathname)) return null;

  return (
    // 改行を活かす・少し太め・ひらがな部分だけ字間を詰める。
    // ロゴ下のキャッチとのアキ（いずれもSAKIさん指定 2026-07-29・切替当日）:
    // - PC は mt-12（48px）。24pxでは近すぎた
    // - スマホは mt-6（24px）＝その半分。のれんロゴを80%に縮めたぶん、
    //   48pxだと離れすぎて見えるため
    <p className="serif mt-6 whitespace-pre-line text-sm font-medium leading-6 text-[#333] lg:mt-12">
      {renderHiraTight(text)}
    </p>
  );
}
