// パスワードを忘れた方のページ（/forgot-password）。
// メールアドレスを入力するとリセットリンクが届く。

import { ForgotPasswordForm } from './forgot-password-form';

export const metadata = { title: 'パスワードを忘れた方｜三十年商店' };

export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-sm">
        <h1 className="mb-2 text-xl font-semibold text-zinc-900">パスワードを忘れた方</h1>
        <p className="mb-6 text-sm text-zinc-500">
          登録しているメールアドレスを入力してください。
          パスワードを再設定するためのリンクをお送りします。
        </p>
        <ForgotPasswordForm />
      </div>
    </main>
  );
}
