// 「日記1本を読むページ」かどうかの判定（URLのパスを見るだけ）。
// 公開の記事ページ /posts/… と、書き手向けの下書きプレビュー /preview/… の2つ。
// 左コラムの出し分け（sidebar-left-slot・lead-text-slot）で共用する。

export function isArticlePath(pathname: string): boolean {
  return pathname.startsWith('/posts/') || pathname.startsWith('/preview/');
}
