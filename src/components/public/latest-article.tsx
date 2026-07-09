// 「最新」エリアの大きいカード（中央コラム上部）。
// 構成: 大きいアイキャッチ画像（4:2.5）＋画像左下にカテゴリー画像（白い窓）を重ねる
//       ＋日時（n月j日 G時i分）＋タイトル。著者名は出さない。仕様書 §14-H。

import Image from 'next/image';
import Link from 'next/link';
import type { PublicArticle } from '@/db/articles';
import { formatJstDatetime } from '@/lib/datetime';
import { postHref } from '@/lib/site';

export function LatestArticle({ article }: { article: PublicArticle }) {
  const href = postHref(article);
  const imageSrc = article.featuredImagePath || '/dammy.jpg';
  const categoryImg = article.categoryImagePath || '/line-up.png';
  const datetime = article.publishedAt
    ? formatJstDatetime(article.publishedAt)
    : '';

  return (
    <Link href={href} className="group block">
      <div className="relative aspect-[4/2.5] w-full overflow-hidden bg-zinc-100">
        <Image
          src={imageSrc}
          alt={article.title}
          fill
          sizes="(max-width: 1024px) 100vw, 45vw"
          priority
          className="object-cover transition-opacity duration-300 group-hover:opacity-80"
        />
        {/* 画像左下に重ねるカテゴリー画像（白い窓） */}
        <span className="absolute bottom-2 left-2 block w-[84px] bg-white p-1 shadow-sm">
          <span className="relative block aspect-square w-full">
            <Image
              src={categoryImg}
              alt={article.categoryName ?? ''}
              fill
              sizes="84px"
              className="object-contain"
            />
          </span>
        </span>
      </div>
      <p className="mt-2 text-xs text-[#333]">{datetime}</p>
      <h3 className="serif mt-0 text-lg leading-snug text-[#333]">
        {article.title}
      </h3>
    </Link>
  );
}
