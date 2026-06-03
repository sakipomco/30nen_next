// 連載の編集ページ（/admin/categories/[id]/edit）。管理者だけが見られる。
// 親連載の選択肢からは「自分自身と子孫」を除く（親子のループを防ぐ）。
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/auth/session';
import { updateCategoryAction } from '@/app/actions/categories';
import {
  listCategories,
  getCategoryById,
  buildCategoryTree,
  getDescendantIds,
} from '@/db/categories';
import { CategoryForm } from '../../category-form';

export const metadata = {
  title: '連載の編集｜30nen',
};

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();

  const { id } = await params;
  const categoryId = Number(id);
  if (!Number.isInteger(categoryId) || categoryId <= 0) notFound();

  const category = await getCategoryById(categoryId);
  if (!category) notFound();

  const all = await listCategories();
  // 自分自身と子孫を親候補から除く（循環防止）。
  const exclude = new Set([categoryId, ...getDescendantIds(all, categoryId)]);
  const parentOptions = buildCategoryTree(all)
    .filter((c) => !exclude.has(c.id))
    .map((c) => ({ id: c.id, name: c.name, depth: c.depth }));

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 px-4 py-12">
      <div className="w-full max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-zinc-900">連載を編集</h1>
          <Link
            href="/admin/categories"
            className="text-sm text-zinc-500 hover:underline"
          >
            ← 連載の管理へ戻る
          </Link>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-6">
          <CategoryForm
            action={updateCategoryAction}
            parentOptions={parentOptions}
            initial={{
              id: category.id,
              name: category.name,
              slug: category.slug,
              parentId: category.parentId,
              sortOrder: category.sortOrder,
              imagePath: category.imagePath,
            }}
            submitLabel="保存する"
          />
        </div>
      </div>
    </div>
  );
}
