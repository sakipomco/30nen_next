// ワード検索の結果ページ（/search?q=キーワード）。仕様書 §14-J。
// 右コラム／ハンバーガー内の検索フォームの行き先。
//  - 公開記事のタイトル・本文・抜粋から部分一致で探す（複数語は「すべて含む」AND検索）。
//  - cat=連載のslug を付けると、その連載（子連載を含む）の記事だけに絞る（2026-11-11 追加）。
//  - 構成: 足跡（三十年商店＞ワード検索）→「ワード検索」帯＋入力欄 → 結果件数
//          → 記事一覧（新しい順・2列・12件/ページ）→ ページ送り。
//  - 記事は日々増えるので、常に最新DBを表示（force-dynamic）。

import type { Metadata } from 'next';
import {
  searchPublishedArticles,
  countSearchedArticles,
} from '@/db/articles';
import { Breadcrumb } from '@/components/public/breadcrumb';
import { SectionHeading } from '@/components/public/section-heading';
import { SearchForm } from '@/components/public/search-form';
import { listCategories, getDescendantIds } from '@/db/categories';
import { ArticleCard } from '@/components/public/article-card';
import { Pagination } from '@/components/public/pagination';

export const dynamic = 'force-dynamic';

const PER_PAGE = 12;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}): Promise<Metadata> {
  const q = ((await searchParams).q ?? '').trim();
  return {
    // 末尾の「｜三十年商店」は src/app/layout.tsx の template が自動で付ける
    title: q ? `「${q}」の検索結果` : 'ワード検索',
  };
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; cat?: string }>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? '').trim();
  const page = Math.max(1, Number.parseInt(sp.page ?? '1', 10) || 1);

  // 連載の絞り込み。選んだ連載＋その子連載（例：度々の旅→山陰編など）の記事を対象にする。
  // 知らない slug が来たときは絞り込まず「すべての連載」として扱う。
  const allCats = await listCategories();
  const selectedCat = sp.cat
    ? allCats.find((c) => c.slug === sp.cat) ?? null
    : null;
  const categoryIds = selectedCat
    ? [selectedCat.id, ...getDescendantIds(allCats, selectedCat.id)]
    : undefined;
  // プルダウンの選択肢＝右コラムと同じ親連載（トップ階層）の一覧。
  const categoryOptions = allCats.flatMap((c) =>
    c.parentId === null && c.slug ? [{ slug: c.slug, name: c.name }] : [],
  );

  // キーワードが空のときは検索せず、入力の案内だけ出す。
  const total = q ? await countSearchedArticles(q, categoryIds) : 0;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const articles = q
    ? await searchPublishedArticles(q, {
        limit: PER_PAGE,
        offset: (page - 1) * PER_PAGE,
        categoryIds,
      })
    : [];

  // ページ送りの土台URL（キーワードと連載の絞り込みを引き継ぐ）。
  const basePath =
    `/search?q=${encodeURIComponent(q)}` +
    (selectedCat?.slug ? `&cat=${encodeURIComponent(selectedCat.slug)}` : '');

  return (
    <div>
      {/* 足跡（現在地）。三十年商店 ＞ ワード検索。 */}
      <Breadcrumb
        items={[{ label: '三十年商店', href: '/' }, { label: 'ワード検索' }]}
      />

      <section>
        <SectionHeading>ワード検索</SectionHeading>

        {/* キーワード未入力のときだけ入力欄を出す（結果表示中は出さない） */}
        {q === '' ? (
          <div className="max-w-md">
            <SearchForm
              categories={categoryOptions}
              defaultCategory={selectedCat?.slug ?? ''}
            />
          </div>
        ) : (
          <>
            {/* 結果件数（記事詳細ページのタイトルと同じ文字サイズ・太さ） */}
            <p className="mb-6 text-lg font-medium leading-snug text-[#333]">
              「{q}」の検索結果
              {selectedCat ? `（${selectedCat.name}）` : ''}：{total}件
            </p>

            {/* 検索結果の記事一覧（新しい順・2列・12件/ページ） */}
            {articles.length === 0 ? (
              <p className="text-sm text-[#808080]">
                当てはまる記事は見つかりませんでした。別の言葉でお試しください。
              </p>
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
          </>
        )}
      </section>
    </div>
  );
}
