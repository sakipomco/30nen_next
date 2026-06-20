'use server';
// 「マイプロフィール」＝ログイン中の本人が、自分のプロフィールだけを編集する Server Action。
// requireUser() で本人を特定し、更新するのは“その本人の id”だけ（フォームに混ざった id 等は使わない）。
// ここで触れるのは公開プロフィール項目のみ：
//   名前(ペンネーム)／顔写真／誕生日／居住地／SNS各URL。
// メール(ログインID)・パスワード・権限・担当連載は管理者の領域なので、ここでは変更しない。

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireUser } from '@/auth/session';
import { updateUser } from '@/db/users';

export type ProfileFormState = { error?: string } | undefined;

export async function updateMyProfileAction(
  _prevState: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const me = await requireUser(); // 本人（未ログインなら /login へ）

  const name = String(formData.get('name') ?? '').trim();
  if (!name) return { error: '名前（表示名）を入力してください。' };

  // 誕生日は空欄＝なし。入っているときは 'YYYY-MM-DD' の形だけ受け付ける。
  const birthday = String(formData.get('birthday') ?? '').trim() || null;
  if (birthday && !/^\d{4}-\d{2}-\d{2}$/.test(birthday)) {
    return { error: '誕生日の形式が正しくありません。' };
  }

  try {
    await updateUser(me.id, {
      name,
      avatarPath: String(formData.get('avatarPath') ?? '').trim() || null,
      birthday,
      location: String(formData.get('location') ?? '').trim() || null,
      instagramUrl: String(formData.get('instagramUrl') ?? '').trim() || null,
      xUrl: String(formData.get('xUrl') ?? '').trim() || null,
      youtubeUrl: String(formData.get('youtubeUrl') ?? '').trim() || null,
      websiteUrl: String(formData.get('websiteUrl') ?? '').trim() || null,
    });
  } catch {
    return { error: '保存に失敗しました。入力内容を確認してください。' };
  }

  revalidatePath('/admin/profile');
  redirect('/admin/profile?saved=1'); // 保存後はこのページに戻り「保存しました」を出す
}
