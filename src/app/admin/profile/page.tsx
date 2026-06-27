import Link from 'next/link';
import { requireUser } from '@/auth/session';
import { updateMyProfileAction } from '@/app/actions/profile';
import { ProfileForm } from './profile-form';
import { t, type Locale } from '@/lib/i18n';

export const metadata = {
  title: 'myPROFILE｜30nen',
};

export default async function MyProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const me = await requireUser();
  const locale = (me.locale ?? 'ja') as Locale;
  const { saved } = await searchParams;

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 px-4 py-12">
      <div className="w-full max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-zinc-900">{t('profile.title', locale)}</h1>
          <Link href="/admin" className="text-sm text-zinc-500 hover:underline">
            {t('admin.backToAdmin', locale)}
          </Link>
        </div>

        {saved && (
          <p
            className="mb-4 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700"
            role="status"
          >
            {t('profile.saved', locale)}
          </p>
        )}

        <div className="rounded-lg border border-zinc-200 bg-white p-6">
          <ProfileForm
            action={updateMyProfileAction}
            locale={locale}
            initial={{
              name: me.name,
              avatarPath: me.avatarPath,
              birthday: me.birthday,
              location: me.location,
              instagramUrl: me.instagramUrl,
              xUrl: me.xUrl,
              youtubeUrl: me.youtubeUrl,
              websiteUrl: me.websiteUrl,
            }}
          />
        </div>
      </div>
    </div>
  );
}
