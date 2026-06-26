// 連載(カテゴリ)の管理画面（/admin/categories）。管理者だけが見られる。
// 連載の一覧（親子を字下げ表示）＋「新規作成」フォーム。各連載に編集・削除。

import Link from 'next/link';
import { requireAdmin } from '@/auth/session';
import { createCategoryAction, deleteCategoryAction } from '@/app/actions/categories';
import {
  listCategories,
  buildCategoryTree,
  getArticleCountByCategory,
} from '@/db/categories';
import { CategoryForm } from './category-form';

export const metadata = {
  title: '連載｜30nen',
};

export default async function CategoriesAdminPage() {
  await requireAdmin();

  const all = await listCategories();
  const tree = buildCategoryTree(all);
  const articleCounts = await getArticleCountByCategory();

  // 親に選べる連載（新規作成では全件が候補）。
  const parentOptions = tree.map((c) => ({
    id: c.id,
    name: c.name,
    depth: c.depth,
  }));

  // 各連載が削除できるか（子連載が無い & 記事が無い）。
  const childCount = new Map<number, number>();
  for (const c of all) {
    if (c.parentId != null) {
      childCount.set(c.parentId, (childCount.get(c.parentId) ?? 0) + 1);
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 px-4 py-12">
      <div className="w-full max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-zinc-900">連載</h1>
          <Link href="/admin" className="text-sm text-zinc-500 hover:underline">
            ← 投稿へ戻る
          </Link>
        </div>

        {/* 連載一覧 */}
        {tree.length === 0 ? (
          <div className="mb-8 rounded-lg border border-zinc-200 bg-white p-8 text-center text-zinc-500">
            まだ連載がありません。下のフォームから作成してください。
          </div>
        ) : (
          <ul className="mb-8 divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white">
            {tree.map((c) => {
              const articles = articleCounts[c.id] ?? 0;
              const children = childCount.get(c.id) ?? 0;
              const deletable = articles === 0 && children === 0;
              return (
                <li
                  key={c.id}
                  className="flex items-center justify-between gap-4 p-4"
                >
                  <div className="min-w-0" style={{ paddingLeft: c.depth * 20 }}>
                    <span className="font-medium text-zinc-900">
                      {c.depth > 0 && (
                        <span className="text-zinc-400">└ </span>
                      )}
                      {c.name}
                    </span>
                    <p className="mt-1 text-xs text-zinc-400">
                      記事 {articles} 件
                      {children > 0 && ` ・ 子連載 ${children} 件`}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Link
                      href={`/admin/categories/${c.id}/edit`}
                      className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 transition-colors hover:bg-zinc-100"
                    >
                      編集
                    </Link>
                    {deletable ? (
                      <form action={deleteCategoryAction}>
                        <input type="hidden" name="id" value={c.id} />
                        <button
                          type="submit"
                          className="rounded-md border border-red-200 px-3 py-1.5 text-sm text-red-600 transition-colors hover:bg-red-50"
                        >
                          削除
                        </button>
                      </form>
                    ) : (
                      <span
                        className="rounded-md border border-zinc-100 px-3 py-1.5 text-sm text-zinc-300"
                        title="記事や子連載があるため削除できません"
                      >
                        削除
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {/* 新規作成フォーム */}
        <div className="rounded-lg border border-zinc-200 bg-white p-6">
          <h2 className="mb-4 text-base font-semibold text-zinc-900">
            連載を新規作成
          </h2>
          <CategoryForm
            action={createCategoryAction}
            parentOptions={parentOptions}
            submitLabel="作成する"
          />
        </div>
      </div>
    </div>
  );
}
