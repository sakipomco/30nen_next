'use client';
// 投稿者(ユーザー)の入力フォーム（新規作成・編集で使い回す）。
// 欄：名前／メール／パスワード／権限／担当連載／自己紹介(任意)。
// パスワードは新規では必須、編集では「変えたいときだけ」入力（空欄＝そのまま）。

import { useActionState } from 'react';
import type { UserFormState } from '@/app/actions/users';
import { FeaturedImage } from '@/app/admin/featured-image';

type UserAction = (
  prevState: UserFormState,
  formData: FormData,
) => Promise<UserFormState>;

type Props = {
  action: UserAction;
  categories: { id: number; name: string; depth: number }[]; // 担当連載の選択肢（全連載）
  initial?: {
    id: number;
    name: string;
    email: string;
    role: 'admin' | 'author';
    bio: string | null;
    categoryId: number | null; // 現在の担当連載
    avatarPath: string | null;
    location: string | null;
    age: number | null;
    instagramUrl: string | null;
    xUrl: string | null;
    youtubeUrl: string | null;
    websiteUrl: string | null;
  };
  submitLabel?: string;
};

export function UserForm({ action, categories, initial, submitLabel = '保存' }: Props) {
  const [state, formAction, pending] = useActionState<UserFormState, FormData>(
    action,
    undefined,
  );
  const isEdit = !!initial;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {initial && <input type="hidden" name="id" value={initial.id} />}

      <label className="flex flex-col gap-1 text-sm">
        名前（表示名・ペンネーム）
        <input
          type="text"
          name="name"
          required
          defaultValue={initial?.name ?? ''}
          className="rounded-md border border-zinc-300 px-3 py-2 text-base outline-none focus:border-zinc-500"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        メールアドレス（ログインID）
        <input
          type="email"
          name="email"
          required
          defaultValue={initial?.email ?? ''}
          className="rounded-md border border-zinc-300 px-3 py-2 text-base outline-none focus:border-zinc-500"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        パスワード
        {isEdit && (
          <span className="text-xs text-zinc-500">
            変更したいときだけ入力してください（空欄なら今のままです）。
          </span>
        )}
        <input
          type="password"
          name="password"
          required={!isEdit}
          autoComplete="new-password"
          placeholder={isEdit ? '（変更しない）' : ''}
          className="rounded-md border border-zinc-300 px-3 py-2 text-base outline-none focus:border-zinc-500"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        権限
        <select
          name="role"
          defaultValue={initial?.role ?? 'author'}
          className="w-fit rounded-md border border-zinc-300 px-3 py-2 text-base outline-none focus:border-zinc-500"
        >
          <option value="author">投稿者（記事を書く人）</option>
          <option value="admin">管理者（連載・投稿者も管理できる人）</option>
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        担当連載（この人が書く連載・1つ）
        <select
          name="categoryId"
          defaultValue={initial?.categoryId != null ? String(initial.categoryId) : ''}
          className="w-fit rounded-md border border-zinc-300 px-3 py-2 text-base outline-none focus:border-zinc-500"
        >
          <option value="">（まだ決めない）</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {'　'.repeat(c.depth) + c.name}
            </option>
          ))}
        </select>
        <span className="text-xs text-zinc-500">
          ここで担当を決めておくと、この人の投稿画面では連載が自動で選ばれます（選び忘れ防止）。
        </span>
      </label>

      {/* 書き手プロフィール（記事ページの「書き手」欄に表示・すべて任意） */}
      <fieldset className="flex flex-col gap-4 rounded-md border border-zinc-200 p-4">
        <legend className="px-1 text-sm font-medium text-zinc-600">
          書き手プロフィール（記事ページに表示）
        </legend>

        {/* 顔写真（丸く表示される。アイキャッチと同じアップロードの仕組みを流用） */}
        <FeaturedImage
          name="avatarPath"
          label="顔写真"
          initialPath={initial?.avatarPath}
        />

        <div className="flex gap-4">
          <label className="flex flex-1 flex-col gap-1 text-sm">
            居住地（例：神奈川県藤沢市）
            <input
              type="text"
              name="location"
              defaultValue={initial?.location ?? ''}
              className="rounded-md border border-zinc-300 px-3 py-2 text-base outline-none focus:border-zinc-500"
            />
          </label>
          <label className="flex w-28 flex-col gap-1 text-sm">
            年齢
            <input
              type="number"
              name="age"
              min={0}
              max={120}
              defaultValue={initial?.age != null ? String(initial.age) : ''}
              className="rounded-md border border-zinc-300 px-3 py-2 text-base outline-none focus:border-zinc-500"
            />
          </label>
        </div>

        <label className="flex flex-col gap-1 text-sm">
          Instagram の URL
          <input
            type="url"
            name="instagramUrl"
            placeholder="https://www.instagram.com/..."
            defaultValue={initial?.instagramUrl ?? ''}
            className="rounded-md border border-zinc-300 px-3 py-2 text-base outline-none focus:border-zinc-500"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          X（旧Twitter）の URL
          <input
            type="url"
            name="xUrl"
            placeholder="https://x.com/..."
            defaultValue={initial?.xUrl ?? ''}
            className="rounded-md border border-zinc-300 px-3 py-2 text-base outline-none focus:border-zinc-500"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          YouTube の URL
          <input
            type="url"
            name="youtubeUrl"
            placeholder="https://www.youtube.com/..."
            defaultValue={initial?.youtubeUrl ?? ''}
            className="rounded-md border border-zinc-300 px-3 py-2 text-base outline-none focus:border-zinc-500"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Webサイトの URL
          <input
            type="url"
            name="websiteUrl"
            placeholder="https://..."
            defaultValue={initial?.websiteUrl ?? ''}
            className="rounded-md border border-zinc-300 px-3 py-2 text-base outline-none focus:border-zinc-500"
          />
        </label>
      </fieldset>

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
          {pending ? '保存中…' : submitLabel}
        </button>
      </div>
    </form>
  );
}
