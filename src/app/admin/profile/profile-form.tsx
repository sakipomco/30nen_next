'use client';

import { useActionState } from 'react';
import type { ProfileFormState } from '@/app/actions/profile';
import { FeaturedImage } from '@/app/admin/featured-image';
import { t, type Locale } from '@/lib/i18n';

type ProfileAction = (
  prevState: ProfileFormState,
  formData: FormData,
) => Promise<ProfileFormState>;

type Props = {
  action: ProfileAction;
  locale?: Locale;
  initial: {
    name: string;
    avatarPath: string | null;
    birthday: string | null;
    location: string | null;
    instagramUrl: string | null;
    xUrl: string | null;
    youtubeUrl: string | null;
    websiteUrl: string | null;
  };
};

export function ProfileForm({ action, initial, locale = 'ja' }: Props) {
  const [state, formAction, pending] = useActionState<ProfileFormState, FormData>(
    action,
    undefined,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        {t('profile.nameLabel', locale)}
        <input
          type="text"
          name="name"
          required
          defaultValue={initial.name}
          className="rounded-md border border-zinc-300 px-3 py-2 text-base outline-none focus:border-zinc-500"
        />
        <span className="text-xs text-zinc-500">
          {t('profile.nameHint', locale)}
        </span>
      </label>

      <FeaturedImage
        name="avatarPath"
        label={t('profile.photoLabel', locale)}
        initialPath={initial.avatarPath}
        locale={locale}
      />

      <div className="flex flex-wrap gap-4">
        <label className="flex min-w-[12rem] flex-1 flex-col gap-1 text-sm">
          {t('profile.locationLabel', locale)}
          <input
            type="text"
            name="location"
            defaultValue={initial.location ?? ''}
            className="rounded-md border border-zinc-300 px-3 py-2 text-base outline-none focus:border-zinc-500"
          />
        </label>
        <label className="flex w-44 flex-col gap-1 text-sm">
          {t('profile.birthdayLabel', locale)}
          <input
            type="date"
            name="birthday"
            defaultValue={initial.birthday ?? ''}
            className="rounded-md border border-zinc-300 px-3 py-2 text-base outline-none focus:border-zinc-500"
          />
          <span className="text-xs text-zinc-500">
            {t('profile.birthdayHint', locale)}
          </span>
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        {t('profile.instagram', locale)}
        <input
          type="url"
          name="instagramUrl"
          placeholder="https://www.instagram.com/..."
          defaultValue={initial.instagramUrl ?? ''}
          className="rounded-md border border-zinc-300 px-3 py-2 text-base outline-none focus:border-zinc-500"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        {t('profile.x', locale)}
        <input
          type="url"
          name="xUrl"
          placeholder="https://x.com/..."
          defaultValue={initial.xUrl ?? ''}
          className="rounded-md border border-zinc-300 px-3 py-2 text-base outline-none focus:border-zinc-500"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        {t('profile.youtube', locale)}
        <input
          type="url"
          name="youtubeUrl"
          placeholder="https://www.youtube.com/..."
          defaultValue={initial.youtubeUrl ?? ''}
          className="rounded-md border border-zinc-300 px-3 py-2 text-base outline-none focus:border-zinc-500"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        {t('profile.website', locale)}
        <input
          type="url"
          name="websiteUrl"
          placeholder="https://..."
          defaultValue={initial.websiteUrl ?? ''}
          className="rounded-md border border-zinc-300 px-3 py-2 text-base outline-none focus:border-zinc-500"
        />
      </label>

      <p className="text-xs text-zinc-500">
        {t('profile.contactAdmin', locale)}
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
          {pending ? t('profile.saving', locale) : t('profile.save', locale)}
        </button>
      </div>
    </form>
  );
}
