// 投稿管理画面（/admin）。ログインしている人だけが見られる。
// 未ログインなら /login へ送り返す（ルート保護＝この画面の入口で必ずチェック）。
// ※ Server Action（login/logout 等）も直接POSTで呼べるので、保護はUIだけに頼らず
//   データを触る各処理の中でも getCurrentUser で確認する方針（土台は src/auth/ 側）。

import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/auth/session';
import { logout } from '@/app/actions/auth';

export const metadata = {
  title: '投稿管理｜30nen',
};

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 px-4 py-16">
      <div className="w-full max-w-2xl rounded-lg border border-zinc-200 bg-white p-8 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-zinc-900">投稿管理</h1>
          {/* ログアウトはServer Actionをformで呼ぶ（Cookieを消して/loginへ） */}
          <form action={logout}>
            <button
              type="submit"
              className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 transition-colors hover:bg-zinc-100"
            >
              ログアウト
            </button>
          </form>
        </div>

        <p className="text-zinc-700">
          ようこそ、<span className="font-medium">{user.name}</span> さん（
          {user.role === 'admin' ? '管理者' : '投稿者'}）。
        </p>
        <p className="mt-2 text-sm text-zinc-500">
          ここに今後「記事の一覧・新規投稿・編集」を追加していきます。
        </p>
      </div>
    </div>
  );
}
