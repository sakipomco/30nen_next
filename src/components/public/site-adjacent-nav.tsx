// 記事詳細ページの「三十年商店“全体”の前後の日記」へ移動するナビ（← →）。
// カテゴリー内の前後ナビ（adjacent-nav）とは別物で、連載をまたいで全記事の前後をたどる。
// 各カードに「カバー画像＋投稿日時（＋タイトル）」を入れる（SAKIさんの要望）。
// 左＝前の日記（1つ古い）／右＝次の日記（1つ新しい）。片側が無ければプレースホルダ。

import Image from 'next/image';
import Link from 'next/link';
import type { PublicArticle } from '@/db/articles';
import { formatJstDatetime } from '@/lib/datetime';

function hrefOf(article: PublicArticle): string {
  return article.slug ? `/posts/${article.slug}` : `/posts/${article.id}`;
}

function NavCard({
  article,
  direction,
}: {
  article: PublicArticle;
  direction: 'prev' | 'next';
}) {
  const imageSrc = article.featuredImagePath || '/dammy.jpg';
  const datetime = article.publishedAt ? formatJstDatetime(article.publishedAt) : '';
  const isPrev = direction === 'prev';

  return (
    <Link
      href={hrefOf(article)}
      className={`group flex w-full items-center gap-3 sm:w-1/2 ${isPrev ? '' : 'flex-row-reverse text-right'}`}
    >
      <span className="serif shrink-0 text-xl leading-none text-[#150c0c]">
        {isPrev ? '←' : '→'}
      </span>
      <span className="relative aspect-[4/2.5] w-20 shrink-0 overflow-hidden bg-zinc-100">
        <Image
          src={imageSrc}
          alt={article.title}
          fill
          sizes="80px"
          className="object-cover transition-opacity duration-300 group-hover:opacity-80"
        />
      </span>
      <span className="min-w-0 group-hover:opacity-70">
        <span className="block text-[0.7rem] text-[#808080]">
          {isPrev ? '前の日記' : '次の日記'}
        </span>
        <span className="block whitespace-nowrap text-[0.85rem] text-[#333]">{datetime}</span>
      </span>
    </Link>
  );
}

export function SiteAdjacentNav({
  prev,
  next,
}: {
  prev: PublicArticle | null;
  next: PublicArticle | null;
}) {
  if (!prev && !next) return null;

  return (
    <nav
      aria-label="三十年商店全体の前後の日記"
      className="mt-12 flex flex-col gap-4 border-t border-[#150c0c]/20 pt-5 sm:flex-row sm:items-stretch sm:justify-between sm:gap-3"
    >
      {/* スマホは縦積み（片側だけのときは行を作らない）。PCは左右に並べ、
          片側が無くても幅を保つよう空のプレースホルダを置く。 */}
      {prev ? (
        <NavCard article={prev} direction="prev" />
      ) : (
        <span aria-hidden className="hidden sm:block sm:w-1/2" />
      )}
      {next ? (
        <NavCard article={next} direction="next" />
      ) : (
        <span aria-hidden className="hidden sm:block sm:w-1/2" />
      )}
    </nav>
  );
}
