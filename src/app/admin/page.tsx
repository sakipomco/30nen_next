import Link from 'next/link';
import { requireUser } from '@/auth/session';
import { logout } from '@/app/actions/auth';
import { switchLocaleAction } from '@/app/actions/locale';
import { deleteArticleAction } from '@/app/actions/articles';
import { listArticles } from '@/db/articles';
import { formatJst } from '@/lib/datetime';
import { t, tReplace, type Locale } from '@/lib/i18n';

export const metadata = {
  title: '投稿｜30nen',
};

export default async function AdminPage() {
  const user = await requireUser();
  const locale = (user.locale ?? 'ja') as Locale;
  const articles = await listArticles(
    user.role === 'admin' ? undefined : { authorId: user.id },
  );
  const newArticleLabel = t('admin.newArticle', locale);

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 px-4 py-12">
      <div className="w-full max-w-3xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h1 className="text-xl font-semibold text-zinc-900">{t('admin.title', locale)}</h1>
          <div className="flex items-center gap-3">
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

        <p className="mb-4 text-sm text-zinc-500">
          {tReplace('admin.welcome', locale, {
            name: user.name,
            role: user.role === 'admin' ? t('admin.roleAdmin', locale) : t('admin.roleAuthor', locale),
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
                <div className="min-w-0">
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
      </div>
    </div>
  );
}
