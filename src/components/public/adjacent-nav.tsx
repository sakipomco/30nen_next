// 記事詳細ページの「同カテゴリーの前後の日記」へ移動するナビ（文字だけ）。
// SAKIさんの指定: 左に「つぎの日記」／右に「まえの日記」。矢印・記事タイトルは出さない。
// どちらかが無ければ、その側は何も置かない（プレースホルダで幅だけ確保）。

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

  const linkClass =
    'serif text-[0.95rem] text-[#333] transition-opacity hover:opacity-60';

  return (
    <nav className="mt-12 flex items-center justify-between gap-3 border-t border-[#150c0c]/20 pt-5">
      {/* 左＝つぎの日記（1つ新しい） */}
      {next ? (
        <Link href={hrefOf(next)} className={linkClass}>
          つぎの日記
        </Link>
      ) : (
        <span aria-hidden />
      )}

      {/* 右＝まえの日記（1つ古い） */}
      {prev ? (
        <Link href={hrefOf(prev)} className={linkClass}>
          まえの日記
        </Link>
      ) : (
        <span aria-hidden />
      )}
    </nav>
  );
}
