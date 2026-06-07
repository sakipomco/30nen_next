// 足跡（パンくずリスト）＝訪問者の現在地を示す案内。
// 例: 三十年商店 ＞ 連載名 ＞ 記事名。トップページでは「三十年商店」だけ。
// ゴシック体・小さめ・グレー。最後の項目（＝現在地）はリンクにしない。

import Link from 'next/link';

export type Crumb = { label: string; href?: string };

export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="現在地" className="mb-6 text-center">
      <ol className="gothic inline-flex flex-wrap items-center justify-center gap-1 text-xs text-[#808080]">
        {items.map((c, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={i} className="inline-flex items-center gap-1">
              {i > 0 && (
                <span aria-hidden className="text-[#c0c0c0]">
                  ›
                </span>
              )}
              {c.href && !isLast ? (
                <Link href={c.href} className="transition-opacity hover:opacity-60">
                  {c.label}
                </Link>
              ) : (
                <span>{c.label}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
