// ログインページ（/login）。サーバー側で動く。
// すでにログイン済みなら、ログイン画面を見せずに投稿管理画面(/admin)へ送る。

import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/auth/session';
import { LoginForm } from './login-form';

export const metadata = {
  title: 'ログイン｜30nen',
};

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect('/admin');
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-16">
      <div className="w-full max-w-sm rounded-lg border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="mb-6 text-xl font-semibold text-zinc-900">ログイン</h1>
        <LoginForm />
      </div>
    </div>
  );
}
