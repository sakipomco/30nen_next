'use server';
// 画像フォルダ一覧での「写真の削除」。
// ルール：
//   ・自分が上げた写真 → 削除できる
//   ・他人が上げた写真 → 削除できない
//   ・管理者 → すべて削除できる
//   ・記録の無い（過去の）写真 → 持ち主不明なので管理者だけ削除できる
// 実ファイル(public/uploads/...)とDBの記録(uploads)の両方を消す。

import { revalidatePath } from 'next/cache';
import { unlink } from 'node:fs/promises';
import path from 'node:path';
import { requireUser } from '@/auth/session';
import { getUploadByPath, deleteUploadRecord } from '@/db/uploads';

export async function deleteUploadAction(formData: FormData): Promise<void> {
  const me = await requireUser();
  const url = String(formData.get('path') ?? '').trim();

  // 安全確認①：必ず /uploads/ 配下で、上位移動（..）を含まないURLだけ受け付ける。
  if (!url.startsWith('/uploads/') || url.includes('..')) return;

  // 持ち主チェック：記録があり本人 or 管理者なら許可。記録が無ければ管理者のみ。
  const record = await getUploadByPath(url);
  const isOwner = record?.uploadedBy != null && record.uploadedBy === me.id;
  if (me.role !== 'admin' && !isOwner) return;

  // 実ファイルを削除（public/uploads の外を指していないか最終確認＝パストラバーサル防御）。
  const baseDir = path.join(process.cwd(), 'public', 'uploads');
  const target = path.join(process.cwd(), 'public', url);
  if (target !== baseDir && !target.startsWith(baseDir + path.sep)) return;
  try {
    await unlink(target);
  } catch {
    // すでに無いなどは無視（記録だけは消す）
  }

  await deleteUploadRecord(url);
  revalidatePath('/admin/media');
}
