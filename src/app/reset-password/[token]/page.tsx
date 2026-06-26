// パスワードリセットのページ（/reset-password/[token]）。
// メールに届いたリンクから来て、新しいパスワードを設定する。

import { hashToken } from '@/lib/token';
import { findValidToken } from '@/db/tokens';
import { SetPasswordForm } from '@/app/invite/[token]/set-password-form';

export const metadata = { title: 'パスワードを再設定｜三十年商店' };

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const tokenRecord = await findValidToken(hashToken(token), 'reset');

  if (!tokenRecord) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
        <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-sm">
          <h1 className="mb-4 text-xl font-semibold text-zinc-900">リンクが無効です</h1>
          <p className="mb-4 text-sm text-zinc-600">
            このリンクは期限切れか、すでに使用済みです。
          </p>
          <a href="/forgot-password" className="text-sm text-zinc-800 underline">
            もう一度リセットメールを送る →
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-sm">
        <h1 className="mb-2 text-xl font-semibold text-zinc-900">パスワードを再設定</h1>
        <p className="mb-6 text-sm text-zinc-500">
          8文字以上の新しいパスワードを入力してください。
        </p>
        <SetPasswordForm token={token} action="reset" />
      </div>
    </main>
  );
}
