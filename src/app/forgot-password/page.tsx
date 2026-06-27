import { cookies } from 'next/headers';
import { ForgotPasswordForm } from './forgot-password-form';
import { t, type Locale } from '@/lib/i18n';

export const metadata = { title: 'パスワードを忘れた方｜三十年商店' };

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const { lang } = await searchParams;
  const cookieStore = await cookies();
  const locale: Locale = (lang === 'es' || cookieStore.get('locale')?.value === 'es') ? 'es' : 'ja';

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-sm">
        <h1 className="mb-2 text-xl font-semibold text-zinc-900">{t('forgot.title', locale)}</h1>
        <p className="mb-6 text-sm text-zinc-500">
          {t('forgot.description', locale)}
        </p>
        <ForgotPasswordForm locale={locale} />
      </div>
    </main>
  );
}
