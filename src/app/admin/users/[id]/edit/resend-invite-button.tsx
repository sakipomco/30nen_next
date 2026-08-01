'use client';
// 招待メールを再送するボタン。押すと「送りました」に変わる。

import { useActionState } from 'react';
import {
  resendInviteAction,
  type ResendInviteResult,
} from '@/app/actions/auth-tokens';

export function ResendInviteButton({ userId }: { userId: number }) {
  const [state, formAction, pending] = useActionState<
    ResendInviteResult,
    FormData
  >(
    async (_prev, formData) => resendInviteAction(formData),
    { sent: false },
  );

  if (state.sent) {
    return (
      <span className="text-sm text-green-700">
        ✓ 招待メールを送りました
      </span>
    );
  }

  return (
    <form action={formAction}>
      <input type="hidden" name="userId" value={userId} />
      <button
        type="submit"
        disabled={pending}
        className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 transition-colors hover:bg-zinc-100 disabled:opacity-50"
      >
        {pending ? '送信中…' : '招待メールを再送する'}
      </button>
      {/* 短い間隔で押したときなど、送れなかった理由をその場に出す。 */}
      {state.error && (
        <p className="mt-1 text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}
    </form>
  );
}
