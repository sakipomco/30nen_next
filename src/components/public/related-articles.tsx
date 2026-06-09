// 記事詳細ページの「関連記事」欄。
// 同じ連載（カテゴリー）の過去記事からランダムに数件を、縦に積んで並べる。
// 1件＝〔左：カバー画像／右：タイトル＋本文の冒頭〕の横並び。SAKIさんの要望（縦3つ）。

import Image from 'next/image';
import Link from 'next/link';
import type { PublicArticle } from '@/db/articles';
import { textExcerpt } from '@/lib/sanitize';
import { SectionHeading } from './section-heading';

function RelatedCard({ article }: { article: PublicArticle }) {
  const href = article.slug ? `/posts/${article.slug}` : `/posts/${article.id}`;
  const imageSrc = article.featuredImagePath || '/dammy.jpg';
  // 本文の冒頭（excerpt があればそれを優先、無ければ本文HTMLから生成）。横並びなので少し長め。
  const preview = article.excerpt?.trim() || textExcerpt(article.content, 90);

  return (
    <Link href={href} className="group flex items-start gap-5">
      <div className="relative aspect-[4/2.5] w-[30%] shrink-0 overflow-hidden bg-zinc-100">
        <Image
          src={imageSrc}
          alt={article.title}
          fill
          sizes="(max-width: 1024px) 40vw, 290px"
          className="object-cover transition-opacity duration-300 group-hover:opacity-80"
        />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="serif line-clamp-2 text-base font-medium leading-snug text-[#333] group-hover:opacity-70">
          {article.title}
        </h3>
        {preview && (
          <p className="mt-2 line-clamp-3 text-[0.8rem] leading-relaxed text-[#555]">
            {preview}
          </p>
        )}
      </div>
    </Link>
  );
}

export function RelatedArticles({ articles }: { articles: PublicArticle[] }) {
  if (articles.length === 0) return null;

  return (
    <section className="mt-12">
      <SectionHeading>関連記事</SectionHeading>
      <div className="space-y-4">
        {articles.map((article) => (
          <RelatedCard key={article.id} article={article} />
        ))}
      </div>
    </section>
  );
}
