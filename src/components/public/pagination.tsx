// ページ送り（ページネーション）。« 前 / » 次 ＋ ページ数字。現在ページをハイライト。
// URL は ?page=2 のクエリで制御。仕様書 §14-I。

import Link from 'next/link';

// basePath にすでに ?q=… などのクエリが付いていれば & でつなぐ（検索結果ページ用）。
function pageHref(basePath: string, page: number): string {
  const sep = basePath.includes('?') ? '&' : '?';
  return page <= 1 ? basePath : `${basePath}${sep}page=${page}`;
}

// 表示するページ番号の並びを作る（現在ページの前後＋最初/最後、間は「…」）。
function buildPages(current: number, total: number): (number | '…')[] {
  const pages = new Set<number>([1, total, current]);
  for (let d = 1; d <= 2; d++) {
    if (current - d >= 1) pages.add(current - d);
    if (current + d <= total) pages.add(current + d);
  }
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const result: (number | '…')[] = [];
  let prev = 0;
  for (const p of sorted) {
    if (prev && p - prev > 1) result.push('…');
    result.push(p);
    prev = p;
  }
  return result;
}

export function Pagination({
  currentPage,
  totalPages,
  basePath = '/',
}: {
  currentPage: number;
  totalPages: number;
  basePath?: string;
}) {
  if (totalPages <= 1) return null;
  const pages = buildPages(currentPage, totalPages);

  const itemBase =
    'inline-flex h-8 min-w-8 items-center justify-center px-2 text-sm serif';

  return (
    <nav className="mt-10 flex items-center justify-center gap-1" aria-label="ページ送り">
      {currentPage > 1 && (
        <Link href={pageHref(basePath, currentPage - 1)} className={`${itemBase} text-[#333] hover:opacity-60`} aria-label="前のページ">
          «
        </Link>
      )}

      {pages.map((p, i) =>
        p === '…' ? (
          <span key={`gap-${i}`} className={`${itemBase} text-[#808080]`}>
            …
          </span>
        ) : p === currentPage ? (
          <span key={p} aria-current="page" className={`${itemBase} bg-[#150c0c] text-white`}>
            {p}
          </span>
        ) : (
          <Link key={p} href={pageHref(basePath, p)} className={`${itemBase} text-[#333] hover:opacity-60`}>
            {p}
          </Link>
        ),
      )}

      {currentPage < totalPages && (
        <Link href={pageHref(basePath, currentPage + 1)} className={`${itemBase} text-[#333] hover:opacity-60`} aria-label="次のページ">
          »
        </Link>
      )}
    </nav>
  );
}
