'use client';
// マイプロフィールの入力フォーム（本人が自分の分だけ編集する）。
// 編集できる項目：名前(ペンネーム)／顔写真／誕生日／居住地／SNS各URL。
// メール(ログインID)・パスワード・権限・担当連載はここには無い（管理者にご依頼ください）。

import { useActionState } from 'react';
import type { ProfileFormState } from '@/app/actions/profile';
import { FeaturedImage } from '@/app/admin/featured-image';

type ProfileAction = (
  prevState: ProfileFormState,
  formData: FormData,
) => Promise<ProfileFormState>;

type Props = {
  action: ProfileAction;
  initial: {
    name: string;
    avatarPath: string | null;
    birthday: string | null; // 'YYYY-MM-DD'（任意）
    location: string | null;
    instagramUrl: string | null;
    xUrl: string | null;
    youtubeUrl: string | null;
    websiteUrl: string | null;
  };
};

export function ProfileForm({ action, initial }: Props) {
  const [state, formAction, pending] = useActionState<ProfileFormState, FormData>(
    action,
    undefined,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        名前（表示名・ペンネーム）
        <input
          type="text"
          name="name"
          required
          defaultValue={initial.name}
          className="rounded-md border border-zinc-300 px-3 py-2 text-base outline-none focus:border-zinc-500"
        />
        <span className="text-xs text-zinc-500">
          記事ページの「書き手」欄に表示される名前です。
        </span>
      </label>

      {/* 顔写真（丸く表示される。本文画像と同じアップロードの仕組みを流用） */}
      <FeaturedImage
        name="avatarPath"
        label="顔写真"
        initialPath={initial.avatarPath}
      />

      <div className="flex flex-wrap gap-4">
        <label className="flex min-w-[12rem] flex-1 flex-col gap-1 text-sm">
          居住地（例：神奈川県藤沢市）
          <input
            type="text"
            name="location"
            defaultValue={initial.location ?? ''}
            className="rounded-md border border-zinc-300 px-3 py-2 text-base outline-none focus:border-zinc-500"
          />
        </label>
        <label className="flex w-44 flex-col gap-1 text-sm">
          誕生日
          <input
            type="date"
            name="birthday"
            defaultValue={initial.birthday ?? ''}
            className="rounded-md border border-zinc-300 px-3 py-2 text-base outline-none focus:border-zinc-500"
          />
          <span className="text-xs text-zinc-500">
            一度入れておけば、年齢は毎年自動で更新されます（書き換え不要）。誕生日そのものは公開されません。
          </span>
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        Instagram の URL
        <input
          type="url"
          name="instagramUrl"
          placeholder="https://www.instagram.com/..."
          defaultValue={initial.instagramUrl ?? ''}
          className="rounded-md border border-zinc-300 px-3 py-2 text-base outline-none focus:border-zinc-500"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        X（旧Twitter）の URL
        <input
          type="url"
          name="xUrl"
          placeholder="https://x.com/..."
          defaultValue={initial.xUrl ?? ''}
          className="rounded-md border border-zinc-300 px-3 py-2 text-base outline-none focus:border-zinc-500"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        YouTube の URL
        <input
          type="url"
          name="youtubeUrl"
          placeholder="https://www.youtube.com/..."
          defaultValue={initial.youtubeUrl ?? ''}
          className="rounded-md border border-zinc-300 px-3 py-2 text-base outline-none focus:border-zinc-500"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Webサイトの URL
        <input
          type="url"
          name="websiteUrl"
          placeholder="https://..."
          defaultValue={initial.websiteUrl ?? ''}
          className="rounded-md border border-zinc-300 px-3 py-2 text-base outline-none focus:border-zinc-500"
        />
      </label>

      <p className="text-xs text-zinc-500">
        メールアドレス（ログインID）・パスワード・担当連載の変更は、管理者にご依頼ください。
      </p>

      {state?.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}

      <div className="mt-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-zinc-900 px-4 py-2 text-base font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-60"
        >
          {pending ? '保存中…' : '保存する'}
        </button>
      </div>
    </form>
  );
}
