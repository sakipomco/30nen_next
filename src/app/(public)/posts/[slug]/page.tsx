// 記事詳細ページ（/posts/[slug]）。一覧・最新カードのリンク先。
//  - [slug] には「slug」または「id（数字）」が入る。正式URLは番号（id）形式に統一し、
//    slug でのアクセスは番号URLへ恒久転送する（書き手FB対応：日本語URLのコピペ長大化を防ぐ）。
//  - 構成: 足跡（三十年商店＞連載＞タイトル）→ 連載名＋日付 → タイトル → 書き手 →
//          アイキャッチ画像 → 本文（投稿のHTML）。共通レイアウトの中央に入る。
//  - 記事は日々更新されるので常に最新DBを表示（force-dynamic）。

import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import {
  getPublishedArticleBySlug,
  getPublishedArticleById,
  getAdjacentArticles,
  getRandomCategoryArticles,
  type PublicArticle,
} from '@/db/articles';
import { getUserById, toPublicUser } from '@/db/users';
import { formatJstDate } from '@/lib/datetime';
import { sanitizeArticleHtml } from '@/lib/sanitize';
import { toMetaDescription, postHref } from '@/lib/site';
import { Breadcrumb } from '@/components/public/breadcrumb';
import { CategoryBanner } from '@/components/public/category-banner';
import { WriterProfile } from '@/components/public/writer-profile';
import { AdjacentNav } from '@/components/public/adjacent-nav';
import { RelatedArticles } from '@/components/public/related-articles';
import { SiteAdjacentNav } from '@/components/public/site-adjacent-nav';

export const dynamic = 'force-dynamic';

// slug もしくは id で記事を1件取得する（無ければ null）。
async function findArticle(slugOrId: string): Promise<PublicArticle | null> {
  // ⚠ Next.js 16 では動的セグメント（[slug]）の params は URLデコードされず、
  //    生の％エンコード（しかも大文字％XX）のまま渡ってくる。
  //    DBの slug は「人が読める形」（復号済み・例: "抜歯の火曜"）で保存しているので、
  //    ここで復号してから照合する。これで現行の符号化URLでもアクセスできる。
  let key = slugOrId;
  try {
    key = decodeURIComponent(slugOrId);
  } catch {
    // 壊れた符号化はそのまま使う
  }
  const bySlug = await getPublishedArticleBySlug(key);
  if (bySlug) return bySlug;
  if (/^\d+$/.test(key)) {
    return getPublishedArticleById(Number(key));
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
  // 末尾の「｜三十年商店」は src/app/layout.tsx の template が自動で付ける
  if (!article) return { title: '記事が見つかりません' };

  const description = toMetaDescription(article.excerpt || article.content);
  const canonical = postHref(article);
  // OGP画像はアイキャッチがあればそれ、無ければサイト既定（暖簾ロゴ）。
  const ogImage = article.featuredImagePath || '/30nen_logo_noren_plus.jpg';

  return {
    title: article.title,
    description,
    alternates: { canonical },
    openGraph: {
      type: 'article',
      url: canonical,
      title: article.title,
      description,
      images: [{ url: ogImage }],
      publishedTime: article.publishedAt ?? undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description,
      images: [ogImage],
    },
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

  // 正式URLは番号（id）形式。日本語slug等の旧URLで来たら番号URLへ恒久転送（308）。
  // すでに共有済みのリンクやブックマークはこの転送で切れずに番号URLへ届く。
  let requested = slug;
  try {
    requested = decodeURIComponent(slug);
  } catch {
    // 壊れた符号化はそのまま比較する
  }
  if (requested !== String(article.id)) {
    permanentRedirect(postHref(article));
  }

  // 書き手プロフィール（記事末尾の「書き手」欄用）。
  const authorRaw = article.authorId ? await getUserById(article.authorId) : null;
  const author = authorRaw ? toPublicUser(authorRaw) : null;

  // 同カテゴリーの「前後の日記」＋「関連記事（ランダム3件）」。連載が紐付く記事のみ。
  const adjacent =
    article.categoryId && article.publishedAt
      ? await getAdjacentArticles({
          categoryId: article.categoryId,
          publishedAt: article.publishedAt,
          articleId: article.id,
        })
      : { prev: null, next: null };
  const related = article.categoryId
    ? await getRandomCategoryArticles(article.categoryId, article.id, 3)
    : [];

  // 三十年商店“全体”の前後の日記（連載をまたいで全記事の前後）。
  const siteAdjacent = article.publishedAt
    ? await getAdjacentArticles({
        publishedAt: article.publishedAt,
        articleId: article.id,
      })
    : { prev: null, next: null };

  const date = article.publishedAt ? formatJstDate(article.publishedAt) : '';

  // 連載ページへのリンク先（slug があれば slug・無ければ id）。
  const seriesHref = article.categoryId
    ? `/series/${article.categorySlug ?? article.categoryId}`
    : undefined;

  return (
    <article className="mx-auto max-w-[720px]">
      {/* 足跡（現在地）。連載名はその連載の一覧ページへリンク。 */}
      <Breadcrumb
        items={[
          { label: '三十年商店', href: '/' },
          ...(article.categoryName
            ? [{ label: article.categoryName, href: seriesHref }]
            : []),
          { label: article.title },
        ]}
      />

      {/* カテゴリー帯（白窓＋連載画像＋連載名＋ヨミガナ）。連載ページへのリンク。 */}
      {article.categoryName && (
        <div className="mt-2">
          <CategoryBanner
            name={article.categoryName}
            reading={article.categoryReading}
            imagePath={article.categoryImagePath}
            href={seriesHref}
          />
        </div>
      )}

      {/* 日付 */}
      <p className="mt-6 text-xs text-[#333]">{date}</p>

      {/* タイトル（日付に近づけるため上のアキを詰める） */}
      <h1 className="serif mt-0.5 text-lg font-medium leading-snug text-[#333]">
        {article.title}
      </h1>

      {/* アイキャッチ画像は記事ページの一番上には出さない（旧サイトと同じ）。
          一覧カード・関連記事・SNSシェアの代表写真としてだけ使う。
          本文の写真は本文内（下記）で表示されるので、写真の二重表示は起きない。 */}

      {/* 本文（投稿のHTML）。表示直前にも無害化し、既存データもカバーする（R-02） */}
      <div
        className="article-body mt-8 text-[#333]"
        dangerouslySetInnerHTML={{ __html: sanitizeArticleHtml(article.content) }}
      />

      {/* 書き手プロフィール（帯＋丸写真＋名前／居住地・年齢／SNS） */}
      {author && <WriterProfile author={author} />}

      {/* 同カテゴリーの前後の日記へ移動（← →） */}
      <AdjacentNav prev={adjacent.prev} next={adjacent.next} />

      {/* 関連記事（同カテゴリーの過去記事をランダムに3点） */}
      <RelatedArticles articles={related} />

      {/* 三十年商店“全体”の前後の日記へ移動（カバー画像＋投稿日時つき） */}
      <SiteAdjacentNav prev={siteAdjacent.prev} next={siteAdjacent.next} />
    </article>
  );
}
