// 公開トップページ（記事一覧）。仕様書 §14-H / §14-I。
//  - 「最新」エリア: 最新1件を大きく表示（1ページ目のみ）
//  - 「記事一覧」: 新しい順・2列・12件/ページ。最新1件は一覧から省く（二重表示防止）
//  - ページ送りは ?page=2 のクエリで制御
//
// 記事は日々増えるので、常に最新のDB内容を表示する（force-dynamic）。

import {
  listPublishedArticles,
  countPublishedArticles,
} from '@/db/articles';
import { SectionHeading } from '@/components/public/section-heading';
import { LatestArticle } from '@/components/public/latest-article';
import { ArticleCard } from '@/components/public/article-card';
import { Pagination } from '@/components/public/pagination';

export const dynamic = 'force-dynamic';

const PER_PAGE = 12;

export default async function TopPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number.parseInt(sp.page ?? '1', 10) || 1);

  const total = await countPublishedArticles();

  // 最新1件（1ページ目だけ大きく表示）
  const latest =
    page === 1
      ? (await listPublishedArticles({ limit: 1, offset: 0 }))[0] ?? null
      : null;

  // 記事一覧（最新1件を飛ばして新しい順・12件）
  const listOffset = 1 + (page - 1) * PER_PAGE;
  const articles = await listPublishedArticles({
    limit: PER_PAGE,
    offset: listOffset,
  });

  // ページ数（一覧の対象は「最新1件を除いた件数」）
  const listTotal = Math.max(0, total - 1);
  const totalPages = Math.max(1, Math.ceil(listTotal / PER_PAGE));

  return (
    <div>
      {/* 最新エリア（1ページ目のみ） */}
      {latest && (
        <section className="mb-12">
          <SectionHeading>最新</SectionHeading>
          <LatestArticle article={latest} />
        </section>
      )}

      {/* 記事一覧 */}
      <section>
        <SectionHeading>記事一覧</SectionHeading>
        {articles.length === 0 ? (
          <p className="text-sm text-[#808080]">記事がありません。</p>
        ) : (
          <ul className="grid grid-cols-2 gap-x-5 gap-y-8">
            {articles.map((article) => (
              <li key={article.id}>
                <ArticleCard article={article} />
              </li>
            ))}
          </ul>
        )}

        <Pagination currentPage={page} totalPages={totalPages} basePath="/" />
      </section>
    </div>
  );
}
