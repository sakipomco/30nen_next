// 記事詳細ページの「関連記事」欄。
// 同じ連載（カテゴリー）の過去記事からランダムに数件を、カバー画像＋タイトル＋本文の冒頭で並べる。
// SAKIさんの要望: 同カテゴリーの過去記事をランダムに3点。

import Image from 'next/image';
import Link from 'next/link';
import type { PublicArticle } from '@/db/articles';
import { textExcerpt } from '@/lib/sanitize';
import { SectionHeading } from './section-heading';

function RelatedCard({ article }: { article: PublicArticle }) {
  const href = article.slug ? `/posts/${article.slug}` : `/posts/${article.id}`;
  const imageSrc = article.featuredImagePath || '/dammy.jpg';
  // 本文の冒頭を少しだけ（excerpt があればそれを優先、無ければ本文HTMLから生成）。
  const preview = article.excerpt?.trim() || textExcerpt(article.content, 50);

  return (
    <Link href={href} className="group block">
      <div className="relative aspect-[4/2.5] w-full overflow-hidden bg-zinc-100">
        <Image
          src={imageSrc}
          alt={article.title}
          fill
          sizes="(max-width: 1024px) 50vw, 240px"
          className="object-cover transition-opacity duration-300 group-hover:opacity-80"
        />
      </div>
      <h3 className="serif mt-2 line-clamp-2 text-[0.9rem] font-medium leading-snug text-[#333]">
        {article.title}
      </h3>
      {preview && (
        <p className="mt-1 line-clamp-2 text-[0.72rem] leading-relaxed text-[#808080]">
          {preview}
        </p>
      )}
    </Link>
  );
}

export function RelatedArticles({ articles }: { articles: PublicArticle[] }) {
  if (articles.length === 0) return null;

  return (
    <section className="mt-12">
      <SectionHeading>関連記事</SectionHeading>
      <div className="grid grid-cols-3 gap-x-3 gap-y-6">
        {articles.map((article) => (
          <RelatedCard key={article.id} article={article} />
        ))}
      </div>
    </section>
  );
}
