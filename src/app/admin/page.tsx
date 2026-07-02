import Link from 'next/link';
import { requireUser } from '@/auth/session';
import { logout } from '@/app/actions/auth';
import { switchLocaleAction } from '@/app/actions/locale';
import { deleteArticleAction } from '@/app/actions/articles';
import { listArticles, countArticles } from '@/db/articles';
import { formatJst } from '@/lib/datetime';
import { t, tReplace, type Locale } from '@/lib/i18n';
import { Pagination } from '@/components/public/pagination';

export const metadata = {
  title: '投稿｜30nen',
};

// 1ページに出す記事の数（WPの投稿一覧と同じ20件）。
const PER_PAGE = 20;

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const user = await requireUser();
  const locale = (user.locale ?? 'ja') as Locale;

  // 投稿者は自分の記事だけ・管理者は全記事。
  const scope = user.role === 'admin' ? undefined : { authorId: user.id };

  // 件数（「ぜんぶ◯件」表示とページ送りの計算に使う）。
  const total = await countArticles(scope);
  const published = await countArticles({ ...scope, status: 'published' });
  const draft = total - published;

  const sp = await searchParams;
  const page = Math.max(1, Number.parseInt(sp.page ?? '1', 10) || 1);
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  const articles = await listArticles({
    ...scope,
    limit: PER_PAGE,
    offset: (page - 1) * PER_PAGE,
  });
  const newArticleLabel = t('admin.newArticle', locale);

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 px-4 py-12">
      <div className="w-full max-w-3xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h1 className="text-xl font-semibold text-zinc-900">{t('admin.title', locale)}</h1>
          <div className="flex flex-wrap items-center justify-end gap-3 whitespace-nowrap">
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

        {/* 自分の投稿の件数（WPの「所有 (761)」にあたる表示）。 */}
        <p className="mb-4 text-sm text-zinc-600">
          {tReplace('admin.countSummary', locale, {
            total: String(total),
            published: String(published),
            draft: String(draft),
          })}
        </p>

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
                    <span
                      className={
                        article.status === 'published'
                          ? 'rounded bg-green-100 px-2 py-0.5 text-xs text-green-700'
                          : 'rounded bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600'
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

        {/* ページ送り（20件ずつ）。公開ページと同じ部品を使う。 */}
        <Pagination currentPage={page} totalPages={totalPages} basePath="/admin" />
      </div>
    </div>
  );
}
