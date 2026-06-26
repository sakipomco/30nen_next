'use client';
// ログイン入力フォーム（ブラウザ側で動く部分）。
// useActionState＝「Server Action の実行状態（処理中か・戻り値）」を受け取るReactのフック。
//   - state   … login の戻り値（エラー文言など）
//   - action  … <form action={...}> に渡すと送信時に login が走る
//   - pending … 送信中かどうか（true の間はボタンを押せなくする）

import { useActionState } from 'react';
import { login, type LoginState } from '@/app/actions/auth';
import { PasswordInput } from '@/components/password-input';

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(
    login,
    undefined,
  );

  return (
    <form action={action} className="flex flex-col gap-4">
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

      <label className="flex flex-col gap-1 text-sm">
        パスワード
        <PasswordInput
          name="password"
          required
          autoComplete="current-password"
        />
      </label>

      {/* エラーがあれば赤字で表示 */}
      {state?.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-md bg-zinc-900 px-4 py-2 text-base font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-60"
      >
        {pending ? 'ログイン中…' : 'ログイン'}
      </button>
    </form>
  );
}
