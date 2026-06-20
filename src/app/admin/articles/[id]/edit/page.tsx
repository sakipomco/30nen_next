// 記事の編集ページ（/admin/articles/[id]/edit）。ログイン必須。
// URLの [id] 部分（動的セグメント）は params から受け取る。Next 16 では params は非同期。
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireUser } from '@/auth/session';
import { saveArticleAction } from '@/app/actions/articles';
import { getArticleById, canManageArticle } from '@/db/articles';
import { listSelectableCategories, getCategoryById } from '@/db/categories';
import { utcToJstInput } from '@/lib/datetime';
import { ArticleForm } from '../../../article-form';

export const metadata = {
  title: '編集｜30nen',
};

export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();

  const { id } = await params;
  const articleId = Number(id);
  if (!Number.isInteger(articleId) || articleId <= 0) notFound();

  const article = await getArticleById(articleId);
  if (!article) notFound();
  // 本人の記事か管理者でなければ編集画面を見せない（R-01）。
  if (!canManageArticle(user, article)) notFound();

  // この人が選べる連載。編集中の記事の連載が一覧に無ければ、保存値を保てるよう先頭に足す。
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
          <h1 className="text-xl font-semibold text-zinc-900">記事を編集</h1>
          <Link href="/admin" className="text-sm text-zinc-500 hover:underline">
            ← 一覧へ戻る
          </Link>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-6">
          <ArticleForm
            action={saveArticleAction}
            categories={categories}
            initial={{
              id: article.id,
              title: article.title,
              content: article.content,
              status: article.status,
              featuredImagePath: article.featuredImagePath,
              categoryId: article.categoryId,
              // 公開日時があれば日本時間の入力欄の形にして初期表示
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
