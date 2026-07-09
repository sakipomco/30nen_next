// 記事詳細ページの「三十年商店“全体”の前後の日記」へ移動するナビ（← →）。
// カテゴリー内の前後ナビ（adjacent-nav）とは別物で、連載をまたいで全記事の前後をたどる。
// 各カードに「カバー画像＋投稿日時（＋タイトル）」を入れる（SAKIさんの要望）。
// 並びは adjacent-nav と統一（書き手FB対応）: 左＝次の日記（1つ新しい・未来）／右＝前の日記（1つ古い・過去）。
// 片側が無ければプレースホルダ。

import Image from 'next/image';
import Link from 'next/link';
import type { PublicArticle } from '@/db/articles';
import { formatJstDatetime } from '@/lib/datetime';
import { postHref } from '@/lib/site';

function NavCard({
  article,
  side,
}: {
  article: PublicArticle;
  side: 'left' | 'right';
}) {
  const imageSrc = article.featuredImagePath || '/dammy.jpg';
  const datetime = article.publishedAt ? formatJstDatetime(article.publishedAt) : '';
  const isLeft = side === 'left';

  return (
    <Link
      href={postHref(article)}
      className={`group flex w-full items-center gap-5 sm:w-1/2 ${isLeft ? '' : 'flex-row-reverse'}`}
    >
      {/* 矢印は「く」の字画像。元画像は左向き(<)なので、右側は左右反転(>)して使う。 */}
      <Image
        src="/30nen_kunoji.png"
        alt=""
        width={88}
        height={90}
        aria-hidden
        className={`h-4 w-4 shrink-0 transition-opacity group-hover:opacity-60 ${isLeft ? '' : '-scale-x-100'}`}
      />
      {/* 写真＋その下に日時を2行（◎月◎日／◎時◎分）。文字ラベルは入れない。 */}
      <span className={`flex flex-col gap-1.5 group-hover:opacity-80 ${isLeft ? '' : 'items-end'}`}>
        <span className="relative aspect-[4/2.5] w-[120px] overflow-hidden bg-zinc-100">
          <Image
            src={imageSrc}
            alt={article.title}
            fill
            sizes="120px"
            className="object-cover transition-opacity duration-300 group-hover:opacity-80"
          />
        </span>
        <span
          className={`block whitespace-nowrap text-[0.8rem] leading-tight tracking-[0.05em] text-[#333] ${isLeft ? '' : 'text-right'}`}
        >
          {datetime}
        </span>
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
      className="mt-12 flex items-start justify-between gap-3"
    >
      {/* スマホもPCも1行に左右で並べる（書き手FB対応で縦積みをやめ、写真の上端を揃える）。
          片側が無くても幅を保つよう空のプレースホルダを置く。 */}
      {/* 左＝次の日記（1つ新しい）。個別日記ナビ（adjacent-nav）と同じ並び。 */}
      {next ? (
        <NavCard article={next} side="left" />
      ) : (
        <span aria-hidden className="w-1/2" />
      )}
      {/* 右＝前の日記（1つ古い） */}
      {prev ? (
        <NavCard article={prev} side="right" />
      ) : (
        <span aria-hidden className="w-1/2" />
      )}
    </nav>
  );
}
