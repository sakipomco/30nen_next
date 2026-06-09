// 記事詳細ページの「同カテゴリーの前後の日記」へ移動するナビ（← →）。
// 左＝前の日記（1つ古い）／右＝次の日記（1つ新しい）。
// どちらかが無ければ、その側は薄いプレースホルダ（リンクなし）にする。

import Link from 'next/link';
import type { PublicArticle } from '@/db/articles';

function hrefOf(article: PublicArticle): string {
  return article.slug ? `/posts/${article.slug}` : `/posts/${article.id}`;
}

export function AdjacentNav({
  prev,
  next,
}: {
  prev: PublicArticle | null;
  next: PublicArticle | null;
}) {
  // 前後どちらも無ければ何も出さない。
  if (!prev && !next) return null;

  return (
    <nav className="mt-12 flex items-stretch justify-between gap-3 border-t border-[#150c0c]/20 pt-5">
      {/* 前の日記（左・←） */}
      {prev ? (
        <Link
          href={hrefOf(prev)}
          className="group flex max-w-[45%] items-center gap-2 text-left"
        >
          <span className="serif text-lg leading-none text-[#150c0c]">←</span>
          <span>
            <span className="block text-[0.7rem] text-[#808080]">前の日記</span>
            <span className="serif line-clamp-1 text-[0.85rem] text-[#333] group-hover:opacity-70">
              {prev.title}
            </span>
          </span>
        </Link>
      ) : (
        <span aria-hidden className="max-w-[45%]" />
      )}

      {/* 次の日記（右・→） */}
      {next ? (
        <Link
          href={hrefOf(next)}
          className="group flex max-w-[45%] items-center gap-2 text-right"
        >
          <span>
            <span className="block text-[0.7rem] text-[#808080]">次の日記</span>
            <span className="serif line-clamp-1 text-[0.85rem] text-[#333] group-hover:opacity-70">
              {next.title}
            </span>
          </span>
          <span className="serif text-lg leading-none text-[#150c0c]">→</span>
        </Link>
      ) : (
        <span aria-hidden className="max-w-[45%]" />
      )}
    </nav>
  );
}
