// 投稿者(ユーザー)の管理画面（/admin/users）。管理者だけが見られる。
// 投稿者の一覧（名前・権限・担当連載）＋「新規作成」フォーム。各人に編集・削除。

import Link from 'next/link';
import Image from 'next/image';
import { requireAdmin } from '@/auth/session';
import { createUserAction, deleteUserAction } from '@/app/actions/users';
import { listUsers } from '@/db/users';
import {
  listCategories,
  buildCategoryTree,
  getAssignmentsMap,
} from '@/db/categories';
import { UserForm } from './user-form';

export const metadata = {
  title: '投稿者｜30nen',
};

export default async function UsersAdminPage() {
  const admin = await requireAdmin();

  const users = await listUsers();
  const assignments = await getAssignmentsMap(); // { userId: { id, name } }
  const categoryOptions = buildCategoryTree(await listCategories()).map((c) => ({
    id: c.id,
    name: c.name,
    depth: c.depth,
  }));

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 px-4 py-12">
      <div className="w-full max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-zinc-900">投稿者</h1>
          <div className="flex items-center gap-4">
            {/* 書き手ガイドPDFのダウンロード */}
            <a
              href="/pdf/30nen-writer-guide-ja.pdf"
              download
              className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 transition-colors hover:bg-zinc-100"
            >
              手引き（日本語）
            </a>
            <a
              href="/pdf/30nen-writer-guide-es.pdf"
              download
              className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 transition-colors hover:bg-zinc-100"
            >
              手引き（スペイン語）
            </a>
            <Link href="/admin" className="text-sm text-zinc-500 hover:underline">
              ← 投稿へ戻る
            </Link>
          </div>
        </div>

        {/* 投稿者一覧 */}
        <ul className="mb-8 divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white">
          {users.map((u) => {
            const assigned = assignments[u.id];
            const isSelf = u.id === admin.id;
            return (
              <li
                key={u.id}
                className="flex items-center justify-between gap-4 p-4"
              >
                <div className="flex min-w-0 items-center gap-3">
                  {/* 名前の前に丸トリミングの顔写真（無ければ枠だけ） */}
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-zinc-100">
                    {u.avatarPath && (
                      <Image
                        src={u.avatarPath}
                        alt={u.name}
                        fill
                        sizes="40px"
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-zinc-900">{u.name}</span>
                    <span
                      className={
                        u.role === 'admin'
                          ? 'rounded bg-indigo-100 px-2 py-0.5 text-xs text-indigo-700'
                          : 'rounded bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600'
                      }
                    >
                      {u.role === 'admin' ? '管理者' : '投稿者'}
                    </span>
                    {isSelf && (
                      <span className="text-xs text-zinc-400">（あなた）</span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-zinc-400">
                    {u.email}
                    {' ・ 担当: '}
                    {assigned ? assigned.name : '未設定'}
                  </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Link
                    href={`/admin/users/${u.id}/edit`}
                    className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 transition-colors hover:bg-zinc-100"
                  >
                    編集
                  </Link>
                  {isSelf ? (
                    <span
                      className="rounded-md border border-zinc-100 px-3 py-1.5 text-sm text-zinc-300"
                      title="自分自身は削除できません"
                    >
                      削除
                    </span>
                  ) : (
                    <form action={deleteUserAction}>
                      <input type="hidden" name="id" value={u.id} />
                      <button
                        type="submit"
                        className="rounded-md border border-red-200 px-3 py-1.5 text-sm text-red-600 transition-colors hover:bg-red-50"
                      >
                        削除
                      </button>
                    </form>
                  )}
                </div>
              </li>
            );
          })}
        </ul>

        {/* 新規作成フォーム */}
        <div className="rounded-lg border border-zinc-200 bg-white p-6">
          <h2 className="mb-4 text-base font-semibold text-zinc-900">
            投稿者を新規作成
          </h2>
          <UserForm
            action={createUserAction}
            categories={categoryOptions}
            submitLabel="作成する"
          />
        </div>
      </div>
    </div>
  );
}
