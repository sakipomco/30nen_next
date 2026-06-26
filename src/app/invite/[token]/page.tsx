// 招待リンクのページ（/invite/[token]）。
// メールに届いたリンクから来て、初めてのパスワードを設定する。

import { hashToken } from '@/lib/token';
import { findValidToken } from '@/db/tokens';
import { SetPasswordForm } from './set-password-form';

export const metadata = { title: 'パスワードを設定｜三十年商店' };

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const tokenRecord = await findValidToken(hashToken(token), 'invite');

  if (!tokenRecord) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
        <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-sm">
          <h1 className="mb-4 text-xl font-semibold text-zinc-900">リンクが無効です</h1>
          <p className="text-sm text-zinc-600">
            このリンクは期限切れか、すでに使用済みです。
            <br />
            管理者に招待メールの再送を依頼してください。
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-sm">
        <h1 className="mb-2 text-xl font-semibold text-zinc-900">パスワードを設定</h1>
        <p className="mb-6 text-sm text-zinc-500">
          8文字以上のパスワードを決めてください。
        </p>
        <SetPasswordForm token={token} action="invite" />
      </div>
    </main>
  );
}
