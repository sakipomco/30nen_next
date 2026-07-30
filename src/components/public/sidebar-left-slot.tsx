'use client';
// 左コラム（ロゴ・リード・SNS・ボタン）の表示制御。
// 日記1本を読むページ（/posts/… と下書きプレビュー /preview/…）では、
// スマホ（lg未満）のときだけ左コラムを丸ごと隠す。
// 理由＝スマホは縦1列なので左コラムが日記の上に積まれ、暖簾ロゴとリード文で
// 画面が埋まって日記本文がずっと下に押し下げられるため（SAKIさん指定 2026-07-31）。
// PC（lg以上）は3カラムなので今までどおり表示する。
// コラムの箱（aside）ごと隠す＝隠すだけだとコラム間のアキ(gap)が残り、
// 日記の上に空白の帯ができてしまうため。
// トップへ戻る導線は、日記ページ上部のパンくず「三十年商店」が担う。

import { usePathname } from 'next/navigation';

export function SidebarLeftSlot({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isArticlePage =
    pathname.startsWith('/posts/') || pathname.startsWith('/preview/');
  return (
    <aside
      className={`no-scrollbar lg:min-h-0 lg:overflow-y-auto ${
        isArticlePage ? 'hidden lg:block' : ''
      }`}
    >
      {children}
    </aside>
  );
}
