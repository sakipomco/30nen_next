// 連載別一覧ページ（/shop/[slug]）。連載名・カテゴリー帯・「小商店」画像のリンク先。
//  - 正式なURLは /shop/○○（旧サイトと同じ形。書き手がSNSに貼っていたリンクをそのまま生かす）。
//    移行直後だけ使っていた /series/○○ は src/app/series/[slug]/route.ts で /shop/○○ へ転送する。
//  - [slug] には「slug」または「id（数字）」が入る（連載に slug が無ければ id でリンクするため）。
//  - 構成: 足跡（三十年商店＞連載名）→ カテゴリー帯（白窓＋画像＋連載名＋ヨミガナ）
//          → その連載の記事一覧（新しい順・2列・12件/ページ）→ ページ送り。
//  - 記事は日々増えるので、常に最新DBを表示（force-dynamic）。

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  getCategoryById,
  getCategoryBySlug,
  getChildCategories,
  getPublicAuthorsForCategory,
  type Category,
} from '@/db/categories';
import {
  listPublishedArticles,
  countPublishedArticles,
} from '@/db/articles';
import Image from 'next/image';
import Link from 'next/link';
import { Breadcrumb } from '@/components/public/breadcrumb';
import { CategoryBanner } from '@/components/public/category-banner';
import { ArticleCard } from '@/components/public/article-card';
import { Pagination } from '@/components/public/pagination';
import { WriterProfile } from '@/components/public/writer-profile';

export const dynamic = 'force-dynamic';

const PER_PAGE = 12;

// slug もしくは id で連載を1件取得する（無ければ null）。
// 数字だけのURLは番号(id)として先に探す＝記事ページと同じ考え方。
// いまは数字だけの名前(slug)を持つ連載は無いが、あとで付けられたときに
// 「番号のつもりで開いたら別の連載だった」が起きないようにしておく
// （記事側では実際にこれが起き、46件が別記事に飛んでいた。2026-07-29）。
async function findCategory(slugOrId: string): Promise<Category | null> {
  if (/^\d+$/.test(slugOrId)) {
    const byId = await getCategoryById(Number(slugOrId));
    if (byId) return byId;
  }
  const bySlug = await getCategoryBySlug(slugOrId);
  if (bySlug) return bySlug;
  return null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await findCategory(slug);
  // 末尾の「｜三十年商店」は src/app/layout.tsx の template が自動で付ける
  if (!category) return { title: '連載が見つかりません' };
  return { title: category.name };
}

export default async function SeriesPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const category = await findCategory(slug);
  if (!category) notFound();

  // 子連載（例：「度々の旅」の下の「山陰編」）。あれば記事一覧の前にカバー画像で並べる。
  const children = await getChildCategories(category.id);

  const sp = await searchParams;
  const page = Math.max(1, Number.parseInt(sp.page ?? '1', 10) || 1);

  const total = await countPublishedArticles(category.id);
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  const offset = (page - 1) * PER_PAGE;
  const articles = await listPublishedArticles({
    categoryId: category.id,
    limit: PER_PAGE,
    offset,
  });

  // この連載の担当書き手（ページ最下部の「書き手」欄。旧サイトと同じ位置）。
  const authors = await getPublicAuthorsForCategory(category.id);

  // ページ送りの土台URL（slug があれば slug・無ければ id）。
  const basePath = `/shop/${category.slug ?? category.id}`;

  return (
    <div>
      {/* 足跡（現在地）。三十年商店 ＞ 連載名。 */}
      <Breadcrumb
        items={[{ label: '三十年商店', href: '/' }, { label: category.name }]}
      />

      {/* カテゴリー帯（白窓＋連載画像＋連載名＋ヨミガナ）。記事ページ上部と同じ見た目。 */}
      <div className="mb-8">
        <CategoryBanner
          name={category.name}
          reading={category.reading}
          imagePath={category.imagePath}
        />
      </div>

      {/* 子連載を持つ親（例：「度々の旅」）は、子の「〇〇編」ロゴだけを並べて記事一覧は出さない
          （SAKIさん指定 2026-07-10。現行サイトの親カテゴリーページも同じ作り）。
          子連載が無い普通の連載は、従来どおり記事一覧＋ページ送り。 */}
      {children.length > 0 ? (
        <ul className="grid grid-cols-1 gap-x-1 gap-y-8 lg:grid-cols-2">
          {children.map((c) => (
            <li key={c.id}>
              <Link href={c.slug ? `/shop/${c.slug}` : `/shop/${c.id}`} className="group block">
                {/* ロゴは切り抜かず元の縦横比のまま幅いっぱいに（記事カードと違い写真でないため） */}
                <Image
                  src={c.imagePath || '/line-up.png'}
                  alt={c.name}
                  width={640}
                  height={360}
                  className="h-auto w-full transition-opacity duration-300 group-hover:opacity-80"
                />
                <h3 className="serif mt-2 text-[17px] font-medium leading-snug text-[#333] md:text-[13px]">
                  {c.name}
                </h3>
              </Link>
            </li>
          ))}
        </ul>
      ) : articles.length === 0 ? (
        <p className="text-sm text-[#808080]">この連載の記事はまだありません。</p>
      ) : (
        <>
          <ul className="grid grid-cols-1 gap-x-1 gap-y-8 lg:grid-cols-2">
            {articles.map((article) => (
              <li key={article.id}>
                <ArticleCard article={article} />
              </li>
            ))}
          </ul>
          <Pagination currentPage={page} totalPages={totalPages} basePath={basePath} />
        </>
      )}

      {/* 書き手プロフィール（帯＋丸写真＋名前／居住地・年齢／SNS）。
          担当2名（CAL TATAU・エフェメラ！など）は帯1本の下に2人ぶん並ぶ。 */}
      {authors.map((author, i) => (
        <WriterProfile key={author.id} author={author} withHeading={i === 0} />
      ))}
    </div>
  );
}
