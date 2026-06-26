'use client';
// 招待メールを再送するボタン。押すと「送りました」に変わる。

import { useActionState } from 'react';
import { resendInviteAction } from '@/app/actions/auth-tokens';

export function ResendInviteButton({ userId }: { userId: number }) {
  const [state, formAction, pending] = useActionState(
    async (_prev: { sent: boolean }, formData: FormData) => {
      await resendInviteAction(formData);
      return { sent: true };
    },
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
    </form>
  );
}
