'use client';
// パスワード設定フォーム（招待・リセット共用）。

import { useActionState } from 'react';
import { acceptInviteAction, resetPasswordAction } from '@/app/actions/auth-tokens';
import { PasswordInput } from '@/components/password-input';

type Props = { token: string; action: 'invite' | 'reset' };

export function SetPasswordForm({ token, action }: Props) {
  const serverAction = action === 'invite' ? acceptInviteAction : resetPasswordAction;
  const [state, formAction, pending] = useActionState(serverAction, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="token" value={token} />

      <label className="flex flex-col gap-1 text-sm">
        新しいパスワード
        <PasswordInput name="password" autoComplete="new-password" required />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        もう一度（確認）
        <PasswordInput name="confirm" autoComplete="new-password" required />
      </label>

      {state?.error && (
        <p className="text-sm text-red-600" role="alert">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-md bg-zinc-900 py-2.5 text-base font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-60"
      >
        {pending ? '設定中…' : 'パスワードを設定する'}
      </button>
    </form>
  );
}
