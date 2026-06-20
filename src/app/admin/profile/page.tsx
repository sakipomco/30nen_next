// マイプロフィール（/admin/profile）。ログイン中の本人が自分のプロフィールを編集する。
// 書き手も管理者も自分の分を編集できる（他人の分は触れない）。
import Link from 'next/link';
import { requireUser } from '@/auth/session';
import { updateMyProfileAction } from '@/app/actions/profile';
import { ProfileForm } from './profile-form';

export const metadata = {
  title: 'myPROFILE｜30nen',
};

export default async function MyProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const me = await requireUser();
  const { saved } = await searchParams; // 保存直後は ?saved=1 が付く

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 px-4 py-12">
      <div className="w-full max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-zinc-900">myPROFILE</h1>
          <Link href="/admin" className="text-sm text-zinc-500 hover:underline">
            ← 投稿管理へ戻る
          </Link>
        </div>

        {saved && (
          <p
            className="mb-4 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700"
            role="status"
          >
            保存しました。
          </p>
        )}

        <div className="rounded-lg border border-zinc-200 bg-white p-6">
          <ProfileForm
            action={updateMyProfileAction}
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
