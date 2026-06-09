// 記事詳細ページ（/posts/[slug]）。一覧・最新カードのリンク先。
//  - [slug] には「slug」または「id（数字）」が入る（記事に slug が無ければ id でリンクするため）。
//  - 構成: 足跡（三十年商店＞連載＞タイトル）→ 連載名＋日付 → タイトル → 書き手 →
//          アイキャッチ画像 → 本文（投稿のHTML）。共通レイアウトの中央に入る。
//  - 記事は日々更新されるので常に最新DBを表示（force-dynamic）。

import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import {
  getPublishedArticleBySlug,
  getPublishedArticleById,
  type PublicArticle,
} from '@/db/articles';
import { getUserById, toPublicUser } from '@/db/users';
import { formatJstDate } from '@/lib/datetime';
import { sanitizeArticleHtml } from '@/lib/sanitize';
import { Breadcrumb } from '@/components/public/breadcrumb';
import { CategoryBanner } from '@/components/public/category-banner';
import { WriterProfile } from '@/components/public/writer-profile';

export const dynamic = 'force-dynamic';

// slug もしくは id で記事を1件取得する（無ければ null）。
async function findArticle(slugOrId: string): Promise<PublicArticle | null> {
  const bySlug = await getPublishedArticleBySlug(slugOrId);
  if (bySlug) return bySlug;
  if (/^\d+$/.test(slugOrId)) {
    return getPublishedArticleById(Number(slugOrId));
  }
  return null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await findArticle(slug);
  if (!article) return { title: '記事が見つかりません｜三十年商店' };
  return {
    title: `${article.title}｜三十年商店`,
    description: article.excerpt ?? undefined,
  };
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await findArticle(slug);
  if (!article) notFound();

  // 書き手プロフィール（記事末尾の「書き手」欄用）。
  const authorRaw = article.authorId ? await getUserById(article.authorId) : null;
  const author = authorRaw ? toPublicUser(authorRaw) : null;

  const date = article.publishedAt ? formatJstDate(article.publishedAt) : '';

  return (
    <article className="mx-auto max-w-[720px]">
      {/* 足跡（現在地）。連載名は連載ページが未実装なので今はリンクなし。 */}
      <Breadcrumb
        items={[
          { label: '三十年商店', href: '/' },
          ...(article.categoryName ? [{ label: article.categoryName }] : []),
          { label: article.title },
        ]}
      />

      {/* カテゴリー帯（白窓＋連載画像＋連載名＋ヨミガナ） */}
      {article.categoryName && (
        <div className="mt-2">
          <CategoryBanner
            name={article.categoryName}
            reading={article.categoryReading}
            imagePath={article.categoryImagePath}
          />
        </div>
      )}

      {/* 日付 */}
      <p className="mt-6 text-xs text-[#333]">{date}</p>

      {/* タイトル（日付に近づけるため上のアキを詰める） */}
      <h1 className="serif mt-0.5 text-lg font-medium leading-snug text-[#333]">
        {article.title}
      </h1>

      {/* アイキャッチ画像（設定があれば）。トリミングせず原寸比率のまま表示
          （正方形・縦長もそのまま）。width/height=0＋styleで自然な比率に。 */}
      {article.featuredImagePath && (
        <Image
          src={article.featuredImagePath}
          alt={article.title}
          width={0}
          height={0}
          sizes="(max-width: 1024px) 100vw, 720px"
          priority
          className="mt-6"
          style={{ width: '100%', height: 'auto' }}
        />
      )}

      {/* 本文（投稿のHTML）。表示直前にも無害化し、既存データもカバーする（R-02） */}
      <div
        className="article-body mt-8 text-[#333]"
        dangerouslySetInnerHTML={{ __html: sanitizeArticleHtml(article.content) }}
      />

      {/* 書き手プロフィール（帯＋丸写真＋名前／居住地・年齢／SNS） */}
      {author && <WriterProfile author={author} />}
    </article>
  );
}
