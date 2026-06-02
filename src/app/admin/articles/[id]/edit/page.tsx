// 記事の編集ページ（/admin/articles/[id]/edit）。ログイン必須。
// URLの [id] 部分（動的セグメント）は params から受け取る。Next 16 では params は非同期。
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireUser } from '@/auth/session';
import { updateArticleAction } from '@/app/actions/articles';
import { getArticleById } from '@/db/articles';
import { ArticleForm } from '../../../article-form';

export const metadata = {
  title: '編集｜30nen',
};

export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();

  const { id } = await params;
  const articleId = Number(id);
  if (!Number.isInteger(articleId) || articleId <= 0) notFound();

  const article = await getArticleById(articleId);
  if (!article) notFound();

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
            action={updateArticleAction}
            initial={{
              id: article.id,
              title: article.title,
              content: article.content,
            }}
          />
        </div>
      </div>
    </div>
  );
}
