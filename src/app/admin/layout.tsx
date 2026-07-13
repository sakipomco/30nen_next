import { getCurrentUser } from '@/auth/session';
import { isIndexable } from '@/lib/site';
import { t, type Locale } from '@/lib/i18n';

// 練習期間だけ管理画面の全ページ上部に出す注意バナー。
// 正式切替で SITE_INDEXABLE=true を設定すると自動的に消える（消し忘れが起きない）。
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (isIndexable()) return <>{children}</>;

  const user = await getCurrentUser();
  const locale = (user?.locale ?? 'ja') as Locale;

  return (
    <>
      <div className="border-b border-amber-300 bg-amber-50 px-4 py-3 text-center text-amber-900">
        <p className="text-sm font-medium">{t('admin.practiceTitle', locale)}</p>
        <p className="mt-0.5 text-xs">{t('admin.practiceBody', locale)}</p>
      </div>
      {children}
    </>
  );
}
