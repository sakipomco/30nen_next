// アップロード画像の台帳（uploads テーブル）のデータアクセス層。
// 「どの写真を誰が上げたか」を記録・参照する窓口。実ファイルの読み書きはしない。

import { eq } from 'drizzle-orm';
import { db } from './index';
import { uploads } from './schema';

// アップロードを1件記録する（重複URLは無視）。
// 画像アップロードの窓口（/api/upload）が保存成功後に呼ぶ。
export async function recordUpload(input: {
  path: string;
  uploadedBy: number;
}): Promise<void> {
  await db
    .insert(uploads)
    .values({ path: input.path, uploadedBy: input.uploadedBy })
    .onConflictDoNothing({ target: uploads.path }); // 同じパスが既にあれば何もしない
}

// 「公開URL → 上げた人のid」の対応表を作る（画像フォルダ一覧で持ち主判定に使う）。
// 記録の無い（＝過去の）写真は、この表に出てこない＝持ち主不明。
export async function getUploadOwners(): Promise<Map<string, number | null>> {
  const rows = await db
    .select({ path: uploads.path, uploadedBy: uploads.uploadedBy })
    .from(uploads);
  const map = new Map<string, number | null>();
  for (const r of rows) map.set(r.path, r.uploadedBy);
  return map;
}

// 1件の記録を取得（削除時の持ち主チェック用）。記録が無ければ null。
export async function getUploadByPath(
  path: string,
): Promise<{ path: string; uploadedBy: number | null } | null> {
  const rows = await db
    .select({ path: uploads.path, uploadedBy: uploads.uploadedBy })
    .from(uploads)
    .where(eq(uploads.path, path))
    .limit(1);
  return rows[0] ?? null;
}

// 記録を削除する（実ファイル削除とセットで使う）。
export async function deleteUploadRecord(path: string): Promise<void> {
  await db.delete(uploads).where(eq(uploads.path, path));
}
