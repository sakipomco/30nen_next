// アップロード画像の台帳（uploads テーブル）のデータアクセス層。
// 「どの写真を誰が上げたか」を記録・参照する窓口。実ファイルの読み書きはしない。

import { and, eq } from 'drizzle-orm';
import { db } from './index';
import { uploads } from './schema';

// アップロードを1件記録する（重複URLは無視）。
// 画像アップロードの窓口（/api/upload）が保存成功後に呼ぶ。
export async function recordUpload(input: {
  path: string;
  uploadedBy: number;
  contentHash?: string;
}): Promise<void> {
  await db
    .insert(uploads)
    .values({
      path: input.path,
      uploadedBy: input.uploadedBy,
      contentHash: input.contentHash ?? null,
    })
    .onConflictDoNothing({ target: uploads.path }); // 同じパスが既にあれば何もしない
}

// 「この人が、同じ中身の写真を前にも上げていないか」を指紋（SHA-256）で探す。
// 見つかればその公開URLを返す＝同じファイルをもう一枚作らずに済む
// （本文にドラッグ→アイキャッチでも同じ写真を指定、という操作で二重に増えるのを防ぐ）。
//
// ⚠ わざと「同じ人が上げたもの」に限定している。他人の写真まで使い回すと、
//    持ち主が画像フォルダで削除したときに別の人の記事から画像が消えてしまうため
//    （削除のルールは src/app/actions/media.ts）。
export async function findOwnUploadByHash(
  contentHash: string,
  uploadedBy: number,
): Promise<string | null> {
  const rows = await db
    .select({ path: uploads.path })
    .from(uploads)
    .where(
      and(eq(uploads.contentHash, contentHash), eq(uploads.uploadedBy, uploadedBy)),
    )
    .limit(1);
  return rows[0]?.path ?? null;
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
