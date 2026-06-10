// 月別アーカイブページ（/archive/2026-06 のような URL）。
// 右コラム／ハンバーガー内の「アーカイブ」目次のクリック先。
//  - [ym] は「年-月」（例 2026-06）。日本時間JSTでその月に公開された記事を並べる。
//  - 構成: 足跡（三十年商店＞2026年6月）→「2026年6月」帯
//          → その月の記事一覧（新しい順・2列・12件/ページ）→ ページ送り。
//  - 記事は日々増えるので、常に最新DBを表示（force-dynamic）。

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  listPublishedArticlesByMonth,
  countPublishedArticlesByMonth,
} from '@/db/articles';
import { Breadcrumb } from '@/components/public/breadcrumb';
import { SectionHeading } from '@/components/public/section-heading';
import { ArticleCard } from '@/components/public/article-card';
import { Pagination } from '@/components/public/pagination';

export const dynamic = 'force-dynamic';

const PER_PAGE = 12;

// URLの [ym]（例 "2026-06"）を年・月に分解する。形式が変なら null。
function parseYm(ym: string): { year: number; month: number } | null {
  const m = /^(\d{4})-(\d{2})$/.exec(ym);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  if (month < 1 || month > 12) return null;
  return { year, month };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ ym: string }>;
}): Promise<Metadata> {
  const parsed = parseYm((await params).ym);
  // 末尾の「｜三十年商店」は src/app/layout.tsx の template が自動で付ける
  if (!parsed) return { title: 'ページが見つかりません' };
  return { title: `${parsed.year}年${parsed.month}月の日記` };
}

export default async function ArchivePage({
  params,
  searchParams,
}: {
  params: Promise<{ ym: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const parsed = parseYm((await params).ym);
  if (!parsed) notFound();
  const { year, month } = parsed;

  const sp = await searchParams;
  const page = Math.max(1, Number.parseInt(sp.page ?? '1', 10) || 1);

  const total = await countPublishedArticlesByMonth(year, month);
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  const articles = await listPublishedArticlesByMonth(year, month, {
    limit: PER_PAGE,
    offset: (page - 1) * PER_PAGE,
  });

  const label = `${year}年${month}月`;
  const basePath = `/archive/${(await params).ym}`;

  return (
    <div>
      {/* 足跡（現在地）。三十年商店 ＞ 2026年6月。 */}
      <Breadcrumb items={[{ label: '三十年商店', href: '/' }, { label }]} />

      {/* その月の記事一覧（新しい順・2列・12件/ページ） */}
      <section>
        <SectionHeading>{label}</SectionHeading>
        {articles.length === 0 ? (
          <p className="text-sm text-[#808080]">この月の記事はありません。</p>
        ) : (
          <ul className="grid grid-cols-1 gap-x-1 gap-y-8 lg:grid-cols-2">
            {articles.map((article) => (
              <li key={article.id}>
                <ArticleCard article={article} />
              </li>
            ))}
          </ul>
        )}

        <Pagination
          currentPage={page}
          totalPages={totalPages}
          basePath={basePath}
        />
      </section>
    </div>
  );
}
