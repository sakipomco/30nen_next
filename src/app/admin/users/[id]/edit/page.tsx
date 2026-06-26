// 投稿者の編集ページ（/admin/users/[id]/edit）。管理者だけが見られる。
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/auth/session';
import { updateUserAction } from '@/app/actions/users';
import { getUserById, toPublicUser } from '@/db/users';
import {
  listCategories,
  buildCategoryTree,
  getCategoriesForUser,
} from '@/db/categories';
import { UserForm } from '../../user-form';
import { ResendInviteButton } from './resend-invite-button';

export const metadata = {
  title: '投稿者の編集｜30nen',
};

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();

  const { id } = await params;
  const userId = Number(id);
  if (!Number.isInteger(userId) || userId <= 0) notFound();

  const user = await getUserById(userId);
  if (!user) notFound();
  const publicUser = toPublicUser(user);

  // 現在の担当連載（1人1連載前提・先頭の1件）。
  const assigned = await getCategoriesForUser(userId);
  const currentCategoryId = assigned[0]?.id ?? null;

  const categoryOptions = buildCategoryTree(await listCategories()).map((c) => ({
    id: c.id,
    name: c.name,
    depth: c.depth,
  }));

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 px-4 py-12">
      <div className="w-full max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-zinc-900">投稿者を編集</h1>
          <div className="flex items-center gap-4">
            <ResendInviteButton userId={publicUser.id} />
            <Link
              href="/admin/users"
              className="text-sm text-zinc-500 hover:underline"
            >
              ← 投稿者へ戻る
            </Link>
          </div>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-6">
          <UserForm
            action={updateUserAction}
            categories={categoryOptions}
            initial={{
              id: publicUser.id,
              name: publicUser.name,
              email: publicUser.email,
              role: publicUser.role,
              bio: publicUser.bio,
              categoryId: currentCategoryId,
              avatarPath: publicUser.avatarPath,
              location: publicUser.location,
              birthday: publicUser.birthday,
              instagramUrl: publicUser.instagramUrl,
              xUrl: publicUser.xUrl,
              youtubeUrl: publicUser.youtubeUrl,
              websiteUrl: publicUser.websiteUrl,
            }}
            submitLabel="保存する"
          />
        </div>
      </div>
    </div>
  );
}
