import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireUser } from '@/auth/session';
import { saveArticleAction } from '@/app/actions/articles';
import { getArticleById, canManageArticle } from '@/db/articles';
import { listSelectableCategories, getCategoryById } from '@/db/categories';
import { utcToJstInput, formatJstTime } from '@/lib/datetime';
import { postHref } from '@/lib/site';
import { t, tReplace, type Locale } from '@/lib/i18n';
import { ArticleForm } from '../../../article-form';

export const metadata = {
  title: '編集｜30nen',
};

// saved=1 は「いま保存してここへ来た」という合図（src/app/actions/articles.ts の redirect）。
// 画面の見た目が変わらないので、保存できたことを時刻つきで知らせる。
export default async function EditArticlePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const user = await requireUser();
  const locale = (user.locale ?? 'ja') as Locale;

  const { id } = await params;
  const articleId = Number(id);
  if (!Number.isInteger(articleId) || articleId <= 0) notFound();

  const article = await getArticleById(articleId);
  if (!article) notFound();
  if (!canManageArticle(user, article)) notFound();

  const { saved } = await searchParams;

  const categories = await listSelectableCategories(user);
  if (
    article.categoryId != null &&
    !categories.some((c) => c.id === article.categoryId)
  ) {
    const own = await getCategoryById(article.categoryId);
    if (own) categories.unshift({ id: own.id, name: own.name, depth: 0 });
  }

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 px-4 py-12">
      <div className="w-full max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-zinc-900">{t('article.editTitle', locale)}</h1>
          <div className="flex items-center gap-4">
            {/* 公開済みのときだけ、公開ページを別のタブで開けるようにする。
                「投稿したあと、実際のページを見ながら直したい」（書き手FB 2026-08-01）。 */}
            {article.status === 'published' && (
              <a
                href={postHref(article)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-zinc-500 hover:underline"
              >
                {t('article.viewPublished', locale)}
              </a>
            )}
            <Link href="/admin" className="text-sm text-zinc-500 hover:underline">
              {t('admin.backToList', locale)}
            </Link>
          </div>
        </div>

        {saved && (
          <p
            className="mb-4 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700"
            role="status"
          >
            {tReplace('article.saved', locale, {
              time: formatJstTime(article.updatedAt),
            })}
          </p>
        )}

        <div className="rounded-lg border border-zinc-200 bg-white p-6">
          <ArticleForm
            action={saveArticleAction}
            categories={categories}
            locale={locale}
            initial={{
              id: article.id,
              title: article.title,
              content: article.content,
              status: article.status,
              featuredImagePath: article.featuredImagePath,
              categoryId: article.categoryId,
              publishedAtInput: article.publishedAt
                ? utcToJstInput(article.publishedAt)
                : '',
            }}
          />
        </div>
      </div>
    </div>
  );
}
