// 投稿管理画面（/admin）。ログインしている人だけが見られる。
// 記事の一覧を表示し、「新規作成」「編集」「削除」への入口を置く。

import Link from 'next/link';
import { requireUser } from '@/auth/session';
import { logout } from '@/app/actions/auth';
import { deleteArticleAction } from '@/app/actions/articles';
import { listArticles } from '@/db/articles';
import { formatJst } from '@/lib/datetime';

export const metadata = {
  title: '投稿管理｜30nen',
};

export default async function AdminPage() {
  const user = await requireUser();
  // 管理者は全記事、投稿者は本人の記事だけ（R-01）。新しい順・最大50件。
  const articles = await listArticles(
    user.role === 'admin' ? undefined : { authorId: user.id },
  );
  // 新規作成の呼び方（管理者・書き手とも共通のやさしい言い回し）。
  const newArticleLabel = '新しい日記をかく';

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 px-4 py-12">
      <div className="w-full max-w-3xl">
        {/* ヘッダー：タイトル・新規作成・ログアウト */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <h1 className="text-xl font-semibold text-zinc-900">投稿管理</h1>
          <div className="flex items-center gap-3">
            {/* 連載・投稿者の管理は管理者だけ */}
            {user.role === 'admin' && (
              <>
                <Link
                  href="/admin/categories"
                  className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-700 transition-colors hover:bg-zinc-100"
                >
                  連載の管理
                </Link>
                <Link
                  href="/admin/users"
                  className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-700 transition-colors hover:bg-zinc-100"
                >
                  投稿者の管理
                </Link>
                <Link
                  href="/admin/settings"
                  className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-700 transition-colors hover:bg-zinc-100"
                >
                  サイト設定
                </Link>
              </>
            )}
            {/* 画像フォルダ（これまでに上げた写真の一覧・全員） */}
            <Link
              href="/admin/media"
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-700 transition-colors hover:bg-zinc-100"
            >
              画像フォルダ
            </Link>
            {/* 自分のプロフィール編集（書き手・管理者とも本人の分） */}
            <Link
              href="/admin/profile"
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-700 transition-colors hover:bg-zinc-100"
            >
              myPROFILE
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
                ログアウト
              </button>
            </form>
          </div>
        </div>

        <p className="mb-4 text-sm text-zinc-500">
          ようこそ、<span className="font-medium">{user.name}</span> さん（
          {user.role === 'admin' ? '管理者' : '投稿者'}）。
        </p>

        {/* 記事一覧 */}
        {articles.length === 0 ? (
          <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center text-zinc-500">
            まだ記事がありません。「{newArticleLabel}」から書いてみましょう。
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
                      {article.status === 'published' ? '公開' : '下書き'}
                    </span>
                    <span className="truncate font-medium text-zinc-900">
                      {article.title}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-zinc-400">
                    {article.status === 'published' && article.publishedAt
                      ? `公開: ${formatJst(article.publishedAt)}`
                      : `更新: ${formatJst(article.updatedAt)}`}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <Link
                    href={`/admin/articles/${article.id}/edit`}
                    className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 transition-colors hover:bg-zinc-100"
                  >
                    編集
                  </Link>
                  {/* 削除（小さなフォームでServer Actionを呼ぶ） */}
                  <form action={deleteArticleAction}>
                    <input type="hidden" name="id" value={article.id} />
                    <button
                      type="submit"
                      className="rounded-md border border-red-200 px-3 py-1.5 text-sm text-red-600 transition-colors hover:bg-red-50"
                    >
                      削除
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
