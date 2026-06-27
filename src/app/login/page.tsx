import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getCurrentUser } from '@/auth/session';
import { LoginForm } from './login-form';
import { t, type Locale } from '@/lib/i18n';

export const metadata = {
  title: 'ログイン｜30nen',
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) {
    redirect('/admin');
  }

  const { lang } = await searchParams;
  const cookieStore = await cookies();
  const locale: Locale = (lang === 'es' || cookieStore.get('locale')?.value === 'es') ? 'es' : 'ja';

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-16">
      <div className="w-full max-w-sm rounded-lg border border-zinc-200 bg-white p-8 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-zinc-900">{t('login.title', locale)}</h1>
          <a
            href={`/login?lang=${locale === 'ja' ? 'es' : 'ja'}`}
            className="rounded-md border border-zinc-300 px-2.5 py-1 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100"
          >
            {locale === 'ja' ? 'ES' : 'JA'}
          </a>
        </div>
        <LoginForm locale={locale} />
      </div>
    </div>
  );
}
