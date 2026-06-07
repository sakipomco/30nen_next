// 記事一覧用のカード（中央コラムのグリッドに並べる小さいカード）。
// 構成: アイキャッチ画像（無ければダミー）＋【連載名】＋日付（時刻なし）＋タイトル。
// 仕様書 §14-I。

import Image from 'next/image';
import Link from 'next/link';
import type { PublicArticle } from '@/db/articles';
import { formatJstDate } from '@/lib/datetime';

export function ArticleCard({ article }: { article: PublicArticle }) {
  const href = article.slug ? `/posts/${article.slug}` : `/posts/${article.id}`;
  const imageSrc = article.featuredImagePath || '/dammy.jpg';
  const date = article.publishedAt ? formatJstDate(article.publishedAt) : '';

  return (
    <Link href={href} className="group block">
      <div className="relative aspect-[4/2.5] w-full overflow-hidden bg-zinc-100">
        <Image
          src={imageSrc}
          alt={article.title}
          fill
          sizes="(max-width: 1024px) 50vw, 22vw"
          className="object-cover transition-opacity duration-300 group-hover:opacity-80"
        />
      </div>
      <p
        className="mt-2 text-[0.7rem] text-[#333]"
        // 全角の開きカッコ「【」は字形が右寄りで左にアキがあるため、
        // カテゴリー名がある行だけ先頭を左へ寄せて写真の左端と縦ラインを揃える。
        style={article.categoryName ? { textIndent: '-0.68em' } : undefined}
      >
        {article.categoryName ? `【${article.categoryName}】` : ''}
        {date}
      </p>
      <h3 className="serif mt-0.5 line-clamp-2 pr-5 text-[0.95rem] font-medium leading-snug text-[#333]">
        {article.title}
      </h3>
    </Link>
  );
}
