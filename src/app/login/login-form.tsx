'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { login, type LoginState } from '@/app/actions/auth';
import { PasswordInput } from '@/components/password-input';
import { t, type Locale } from '@/lib/i18n';

export function LoginForm({ locale = 'ja' }: { locale?: Locale }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(
    login,
    undefined,
  );

  return (
    <form action={action} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        {t('login.email', locale)}
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          className="rounded-md border border-zinc-300 px-3 py-2 text-base outline-none focus:border-zinc-500"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        {t('login.password', locale)}
        <PasswordInput
          name="password"
          required
          autoComplete="current-password"
        />
      </label>

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
        {pending ? t('login.submitting', locale) : t('login.submit', locale)}
      </button>

      <Link
        href={`/forgot-password${locale === 'es' ? '?lang=es' : ''}`}
        className="text-center text-sm text-zinc-500 hover:underline"
      >
        {t('login.forgot', locale)}
      </Link>
    </form>
  );
}
