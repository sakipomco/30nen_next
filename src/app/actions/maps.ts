'use server';
// 旅の行程マップ（地図の棚）の作成・更新・削除を行う Server Action（サーバー側で動く処理）。
// 地図の管理は管理者だけ → どれも先頭で requireAdmin() を呼ぶ。

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/auth/session';
import { createMap, updateMap, deleteMap } from '@/db/maps';

// useActionState に渡す状態の形（エラー文言を画面に返す）。
export type MapFormState = { error?: string } | undefined;

// 名札に使える文字。本文に [MAP:名札] と手で打つので、記法を壊す文字は禁止する。
// 具体的には 半角の [ ] と改行 を除いた1〜30文字（日本語OK）。
const NAME_MAX = 30;

// フォームの各欄を読み取って整える。
function readForm(formData: FormData): { name: string; imagePath: string } {
  return {
    name: String(formData.get('name') ?? '').trim(),
    imagePath: String(formData.get('imagePath') ?? '').trim(),
  };
}

// 入力の検査。問題があればエラー文言を返す（無ければ null）。
function validate(name: string, imagePath: string): string | null {
  if (!name) return '地図の名前を入力してください。';
  if (name.length > NAME_MAX) {
    return `地図の名前は${NAME_MAX}文字までにしてください。`;
  }
  if (/[[\]\r\n]/.test(name)) {
    return '地図の名前に [ ] や改行は使えません（本文の記法が壊れるため）。';
  }
  if (!imagePath) return '地図の画像を選んでください。';
  return null;
}

// ── 新規作成 ─────────────────────────────────────────────
export async function createMapAction(
  _prevState: MapFormState,
  formData: FormData,
): Promise<MapFormState> {
  await requireAdmin();

  const { name, imagePath } = readForm(formData);
  const invalid = validate(name, imagePath);
  if (invalid) return { error: invalid };

  try {
    await createMap({ name, imagePath });
  } catch (e) {
    return { error: nameErrorMessage(e) };
  }

  revalidatePath('/admin/maps');
  redirect('/admin/maps');
}

// ── 更新（編集）──────────────────────────────────────────
// 画像を差し替えると、この名札を使っている全記事の地図が一斉に新しくなる。
export async function updateMapAction(
  _prevState: MapFormState,
  formData: FormData,
): Promise<MapFormState> {
  await requireAdmin();

  const id = Number(formData.get('id'));
  if (!Number.isInteger(id) || id <= 0) {
    return { error: '地図が見つかりませんでした。' };
  }
  const { name, imagePath } = readForm(formData);
  const invalid = validate(name, imagePath);
  if (invalid) return { error: invalid };

  try {
    await updateMap(id, { name, imagePath });
  } catch (e) {
    return { error: nameErrorMessage(e) };
  }

  revalidatePath('/admin/maps');
  redirect('/admin/maps');
}

// ── 削除 ─────────────────────────────────────────────────
// 一覧の各行に置く小さなフォームから呼ぶ。
// ※ 記事本文の [MAP:…] は文字として残るが、名札が見つからないので
//    公開ページには何も出ない（下書きプレビューでは警告が出る）。
export async function deleteMapAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = Number(formData.get('id'));
  if (Number.isInteger(id) && id > 0) {
    await deleteMap(id);
    revalidatePath('/admin/maps');
  }
}

// 名札の重複などの保存エラーを、利用者に分かる日本語にする。
function nameErrorMessage(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  if (msg.includes('UNIQUE') && msg.includes('name')) {
    return 'その名前は既に使われています。別の名前にしてください。';
  }
  return '保存に失敗しました。入力内容を確認してください。';
}
