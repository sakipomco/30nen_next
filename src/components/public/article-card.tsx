// 記事一覧用のカード（中央コラムのグリッドに並べる小さいカード）。
// 構成: アイキャッチ画像（無ければダミー）＋【連載名】＋日付（時刻なし）＋タイトル。
// 仕様書 §14-I。

import Image from 'next/image';
import Link from 'next/link';
import type { PublicArticle } from '@/db/articles';
import { formatJstDate } from '@/lib/datetime';
import { postHref } from '@/lib/site';

export function ArticleCard({ article }: { article: PublicArticle }) {
  const href = postHref(article);
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
      {/* 連載名・日付の行：スマホ12px＝見本比較でSAKIさん選択（2026-07-10）／PCは従来どおり0.65rem */}
      <p
        className="mt-2 text-[12px] text-[#333] md:text-[0.65rem]"
        // 全角の開きカッコ「【」は字形が右寄りで左にアキがあるため、
        // カテゴリー名がある行だけ先頭を左へ寄せて写真の左端と縦ラインを揃える。
        style={article.categoryName ? { textIndent: '-0.68em' } : undefined}
      >
        {article.categoryName ? `【${article.categoryName}】` : ''}
        {date}
      </p>
      {/* タイトルの大きさ：スマホ17px＝見本比較でSAKIさん選択（2026-07-10。現行の15pxより一回り大きく）／PC13px＝現行と同じ */}
      <h3 className="serif mt-0 line-clamp-2 pr-5 text-[17px] font-medium leading-snug text-[#333] md:text-[13px]">
        {article.title}
      </h3>
    </Link>
  );
}
