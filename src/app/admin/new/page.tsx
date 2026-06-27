import Link from 'next/link';
import { requireUser } from '@/auth/session';
import { saveArticleAction } from '@/app/actions/articles';
import { listSelectableCategories } from '@/db/categories';
import { ArticleForm } from '../article-form';
import { t, type Locale } from '@/lib/i18n';

export const metadata = {
  title: '新規作成｜30nen',
};

export default async function NewArticlePage() {
  const user = await requireUser();
  const locale = (user.locale ?? 'ja') as Locale;
  const categories = await listSelectableCategories(user);

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 px-4 py-12">
      <div className="w-full max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-zinc-900">{t('article.newTitle', locale)}</h1>
          <Link href="/admin" className="text-sm text-zinc-500 hover:underline">
            {t('admin.backToList', locale)}
          </Link>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-6">
          <ArticleForm action={saveArticleAction} categories={categories} locale={locale} />
        </div>
      </div>
    </div>
  );
}
