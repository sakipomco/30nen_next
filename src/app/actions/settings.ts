'use server';
// サイト設定（リードテキストなど）を保存する Server Action。
// 設定の編集は管理者だけ → 先頭で requireAdmin() を呼ぶ。

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/auth/session';
import { setSetting } from '@/db/settings';

// useActionState に渡す状態の形（保存後のメッセージ・エラーを画面に返す）。
export type SettingsFormState = { ok?: boolean; error?: string } | undefined;

// トップページのリードテキストを保存する。
export async function updateLeadTextAction(
  _prevState: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  await requireAdmin();

  const leadText = String(formData.get('leadText') ?? '').trim();
  if (!leadText) {
    return { error: 'リードテキストを入力してください。' };
  }

  try {
    await setSetting('lead_text', leadText);
  } catch {
    return { error: '保存に失敗しました。もう一度お試しください。' };
  }

  revalidatePath('/'); // 公開トップページの表示を更新
  return { ok: true };
}
