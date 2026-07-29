import Link from 'next/link';
import { requireUser } from '@/auth/session';
import { logout } from '@/app/actions/auth';
import { switchLocaleAction } from '@/app/actions/locale';
import { deleteArticleAction } from '@/app/actions/articles';
import { listArticles, countArticles, listArticleYearMonths } from '@/db/articles';
import { listUsers } from '@/db/users';
import { formatJst } from '@/lib/datetime';
import { t, tReplace, type Locale } from '@/lib/i18n';
import { Pagination } from '@/components/public/pagination';
import { ArticleFilter } from './article-filter';

export const metadata = {
  title: '投稿｜30nen',
};

// 1ページに出す記事の数（WPの投稿一覧と同じ20件）。
const PER_PAGE = 20;

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; y?: string; m?: string; author?: string }>;
}) {
  const user = await requireUser();
  const locale = (user.locale ?? 'ja') as Locale;

  const sp = await searchParams;

  // 年・月の絞り込み（選択肢は記事が実際にある年月だけ＝画像フォルダと同じ仕様）。
  const year = sp.y && /^\d{4}$/.test(sp.y) ? sp.y : '';
  const month = year && sp.m && /^\d{2}$/.test(sp.m) ? sp.m : '';

  // 投稿者の絞り込み：管理者だけが使える。投稿者(author)は常に自分の記事だけ。
  const filterAuthorId =
    user.role === 'admin' && sp.author && /^\d+$/.test(sp.author)
      ? Number(sp.author)
      : undefined;
  const authorId = user.role === 'admin' ? filterAuthorId : user.id;

  const scope = { authorId, year, month };

  // 件数（「ぜんぶ◯件」表示とページ送りの計算に使う）。絞り込み中はその範囲の数。
  const total = await countArticles(scope);
  const published = await countArticles({ ...scope, status: 'published' });
  const draft = total - published;

  const page = Math.max(1, Number.parseInt(sp.page ?? '1', 10) || 1);
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  const articles = await listArticles({
    ...scope,
    limit: PER_PAGE,
    offset: (page - 1) * PER_PAGE,
  });

  // 絞り込みプルダウンの選択肢（記事がある年月＋管理者には投稿者の一覧）。
  const yearMonths = await listArticleYearMonths({ authorId });
  const authors =
    user.role === 'admin'
      ? (await listUsers()).map((u) => ({ id: u.id, name: u.name }))
      : null;

  // ページ送りリンクに絞り込みを引き継ぐためのクエリ文字列。
  const filterParams = new URLSearchParams();
  if (filterAuthorId != null) filterParams.set('author', String(filterAuthorId));
  if (year) filterParams.set('y', year);
  if (month) filterParams.set('m', month);
  const filterQs = filterParams.toString();

  const newArticleLabel = t('admin.newArticle', locale);

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 px-4 py-12">
      <div className="w-full max-w-3xl">
        {/* スマホでは「見出しの行」と「ボタンの行」を分けて縦に積む（横幅が足りず不揃いに折り返すため）。
            sm以上（タブレット・PC）では従来どおり1行で左右に並べる。 */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <h1 className="whitespace-nowrap text-xl font-semibold text-zinc-900">{t('admin.title', locale)}</h1>
          <div className="flex flex-wrap items-center gap-3 whitespace-nowrap sm:justify-end">
            {user.role === 'admin' && (
              <>
                <Link
                  href="/admin/categories"
                  className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-700 transition-colors hover:bg-zinc-100"
                >
                  {t('admin.categories', locale)}
                </Link>
                <Link
                  href="/admin/users"
                  className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-700 transition-colors hover:bg-zinc-100"
                >
                  {t('admin.users', locale)}
                </Link>
                {/* 旅の地図（地図の棚）。いまは日本語のみ＝スペイン語版は必要になったら i18n に足す。 */}
                <Link
                  href="/admin/maps"
                  className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-700 transition-colors hover:bg-zinc-100"
                >
                  旅の地図
                </Link>
                <Link
                  href="/admin/settings"
                  className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-700 transition-colors hover:bg-zinc-100"
                >
                  {t('admin.settings', locale)}
                </Link>
              </>
            )}
            <Link
              href="/admin/media"
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-700 transition-colors hover:bg-zinc-100"
            >
              {t('admin.media', locale)}
            </Link>
            <Link
              href="/admin/profile"
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-700 transition-colors hover:bg-zinc-100"
            >
              {t('admin.profile', locale)}
            </Link>
            <Link
              href="/admin/new"
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
            >
              {newArticleLabel}
            </Link>
            <form action={logout}>
              <button
                type="submit"
                className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-700 transition-colors hover:bg-zinc-100"
              >
                {t('admin.logout', locale)}
              </button>
            </form>
            {/* 言語切替 */}
            <form action={switchLocaleAction}>
              <input type="hidden" name="locale" value={locale === 'ja' ? 'es' : 'ja'} />
              <button
                type="submit"
                className="rounded-md border border-zinc-300 px-2.5 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100"
                title={locale === 'ja' ? 'Cambiar a español' : '日本語に切り替え'}
              >
                {locale === 'ja' ? 'ES' : 'JA'}
              </button>
            </form>
          </div>
        </div>

        <p className="mb-1 text-sm text-zinc-500">
          {tReplace('admin.welcome', locale, {
            name: user.name,
            role: user.role === 'admin' ? t('admin.roleAdmin', locale) : t('admin.roleAuthor', locale),
          })}
        </p>

        {/* 自分の投稿の件数（WPの「所有 (761)」にあたる表示）。絞り込み中はその範囲の数。 */}
        <p className="mb-4 text-sm text-zinc-600">
          {tReplace('admin.countSummary', locale, {
            total: String(total),
            published: String(published),
            draft: String(draft),
          })}
        </p>

        {/* 絞り込み（記事がある年月だけが選択肢に出る。投稿者プルダウンは管理者のみ） */}
        <div className="mb-4">
          <ArticleFilter
            yearMonths={yearMonths}
            year={year}
            month={month}
            authors={authors}
            authorId={filterAuthorId != null ? String(filterAuthorId) : ''}
            locale={locale}
          />
        </div>

        {articles.length === 0 ? (
          <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center text-zinc-500">
            {tReplace('admin.noArticles', locale, { label: newArticleLabel })}
          </div>
        ) : (
          <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white">
            {articles.map((article) => (
              <li
                key={article.id}
                className="flex items-center justify-between gap-4 p-4"
              >
                {/* アイキャッチのサムネイル（無い記事はグレーの枠だけ）。 */}
                {article.featuredImagePath ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={article.featuredImagePath}
                    alt=""
                    className="h-12 w-12 shrink-0 rounded object-cover bg-zinc-100"
                  />
                ) : (
                  <div className="h-12 w-12 shrink-0 rounded bg-zinc-100" />
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {/* shrink-0 + whitespace-nowrap：スマホでバッジが潰れて縦書きにならないように */}
                    <span
                      className={
                        article.status === 'published'
                          ? 'shrink-0 whitespace-nowrap rounded bg-green-100 px-2 py-0.5 text-xs text-green-700'
                          : 'shrink-0 whitespace-nowrap rounded bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600'
                      }
                    >
                      {article.status === 'published' ? t('admin.statusPublished', locale) : t('admin.statusDraft', locale)}
                    </span>
                    <span className="truncate font-medium text-zinc-900">
                      {article.title}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-zinc-400">
                    {article.status === 'published' && article.publishedAt
                      ? tReplace('admin.publishedAt', locale, { date: formatJst(article.publishedAt) })
                      : tReplace('admin.updatedAt', locale, { date: formatJst(article.updatedAt) })}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <Link
                    href={`/admin/articles/${article.id}/edit`}
                    className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 transition-colors hover:bg-zinc-100"
                  >
                    {t('admin.edit', locale)}
                  </Link>
                  <form action={deleteArticleAction}>
                    <input type="hidden" name="id" value={article.id} />
                    <button
                      type="submit"
                      className="rounded-md border border-red-200 px-3 py-1.5 text-sm text-red-600 transition-colors hover:bg-red-50"
                    >
                      {t('admin.delete', locale)}
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* ページ送り（20件ずつ）。公開ページと同じ部品を使う。絞り込みはリンクに引き継ぐ。 */}
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          basePath={filterQs ? `/admin?${filterQs}` : '/admin'}
        />
      </div>
    </div>
  );
}
