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
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-zinc-100">
        <Image
          src={imageSrc}
          alt={article.title}
          fill
          sizes="(max-width: 1024px) 50vw, 22vw"
          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
      </div>
      <p className="mt-2 text-[0.7rem] text-[#808080]">
        {article.categoryName ? `【${article.categoryName}】` : ''}
        {date}
      </p>
      <h3 className="serif mt-1 line-clamp-2 text-sm leading-snug text-[#333]">
        {article.title}
      </h3>
    </Link>
  );
}
