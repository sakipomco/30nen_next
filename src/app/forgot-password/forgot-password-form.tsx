'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { forgotPasswordAction } from '@/app/actions/auth-tokens';

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(forgotPasswordAction, undefined);

  if (state?.success) {
    return (
      <div>
        <p className="mb-4 rounded-md bg-green-50 p-4 text-sm text-green-800">
          {state.success}
        </p>
        <Link href="/login" className="text-sm text-zinc-500 hover:underline">
          ← ログイン画面に戻る
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        メールアドレス
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          className="rounded-md border border-zinc-300 px-3 py-2 text-base outline-none focus:border-zinc-500"
        />
      </label>

      {state?.error && (
        <p className="text-sm text-red-600" role="alert">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-md bg-zinc-900 py-2.5 text-base font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-60"
      >
        {pending ? '送信中…' : 'リセットメールを送る'}
      </button>

      <Link href="/login" className="text-center text-sm text-zinc-500 hover:underline">
        ← ログイン画面に戻る
      </Link>
    </form>
  );
}
