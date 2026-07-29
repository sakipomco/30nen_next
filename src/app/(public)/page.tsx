// 公開トップページ（記事一覧）。仕様書 §14-H / §14-I。
//  - 「最新」エリア: 最新1件を大きく表示（1ページ目のみ・PC専用）。
//    スマホ（lg未満）では「最新」帯も大画像も出さず、いきなり「記事一覧」が最新から並ぶ。
//  - 「記事一覧」: 新しい順・2列。1ページ目だけ13件取得し、PCでは先頭カード
//    （＝最新。大画像と重複）だけCSSで隠す。スマホは先頭カードとして表示。
//    → PCの一覧は12件（2列がぴったり6行）・スマホは13件（1列なので隙間なし）。
//    ※ 以前は1ページ目も12件取得していたため、PCでは先頭を隠して11件＝奇数になり、
//      最終行の右側が空いていた（SAKIさん指摘 2026-07-29）。1件多く取ることで解消。
//  - 2ページ目以降は12件。ページ送りの件数計算も1ページ目が13件である前提で行う。
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
import { Breadcrumb } from '@/components/public/breadcrumb';

export const dynamic = 'force-dynamic';

const PER_PAGE = 12;
// 1ページ目だけ1件多く取る（PCで先頭カードを隠しても一覧が12件＝偶数に保つため）。
const FIRST_PAGE_SIZE = PER_PAGE + 1; // 13

export default async function TopPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number.parseInt(sp.page ?? '1', 10) || 1);

  const total = await countPublishedArticles();
  // 1ページ目が13件・2ページ目以降が12件なので、総ページ数もその前提で数える。
  const totalPages =
    total <= FIRST_PAGE_SIZE
      ? 1
      : 1 + Math.ceil((total - FIRST_PAGE_SIZE) / PER_PAGE);

  // 記事一覧（新しい順）。1ページ目は13件・以降は12件。先頭(最新)も含めて取得する。
  const limit = page === 1 ? FIRST_PAGE_SIZE : PER_PAGE;
  const offset = page === 1 ? 0 : FIRST_PAGE_SIZE + (page - 2) * PER_PAGE;
  const articles = await listPublishedArticles({ limit, offset });

  // 最新エリアに大きく出す記事（1ページ目の先頭）。PC専用。
  const latest = page === 1 ? articles[0] ?? null : null;

  return (
    <div>
      {/* 足跡（現在地）。トップページなので「三十年商店」のみ。 */}
      <Breadcrumb items={[{ label: '三十年商店' }]} />

      {/* 最新エリア（1ページ目のみ・PC専用。スマホは一覧の先頭カードで表示） */}
      {latest && (
        <section className="mb-6 hidden lg:block">
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
          <ul className="grid grid-cols-1 gap-x-1 gap-y-8 lg:grid-cols-2">
            {articles.map((article, i) => (
              <li
                key={article.id}
                // 1ページ目の先頭(=最新)はPCでは大画像と重複するので隠す。
                // スマホは大画像が無いので、一覧の先頭カードとして表示する。
                className={page === 1 && i === 0 ? 'lg:hidden' : undefined}
              >
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
