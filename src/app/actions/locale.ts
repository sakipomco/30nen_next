'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from '@/auth/session';
import { updateUser } from '@/db/users';
import type { Locale } from '@/lib/i18n';

export async function switchLocaleAction(formData: FormData): Promise<void> {
  const me = await requireUser();
  const locale = formData.get('locale') as string;
  if (locale !== 'ja' && locale !== 'es') return;
  await updateUser(me.id, { locale: locale as Locale });
  revalidatePath('/', 'layout');
}
