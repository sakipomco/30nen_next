// 旅の行程マップ（maps ＝「地図の棚」）のデータアクセス層。
// 記事本文の [MAP:2025欧州] という記法と、棚に登録した地図を名札で結びつける。
//
// 画像を記事に直接貼らず名札で呼ぶのが肝＝棚の画像を1枚差し替えるだけで、
// その名札を使っている全記事の地図が一斉に新しくなる。

import { eq, asc, inArray } from 'drizzle-orm';
import { db } from './index';
import { maps } from './schema';

// schema から型を自動生成（手書きしない＝設計とズレない）
export type TravelMap = typeof maps.$inferSelect; // DBから読んだ1件の形
export type NewMapInput = {
  name: string; // 名札（例: '2025欧州'）
  imagePath: string; // 地図画像のパス（/uploads/…）
};
export type UpdateMapInput = Partial<NewMapInput>;

const now = () => new Date().toISOString().slice(0, 19).replace('T', ' ');

// 棚にある地図を全部（名札の順）。管理画面の一覧用。
export async function listMaps(): Promise<TravelMap[]> {
  return db.select().from(maps).orderBy(asc(maps.name));
}

// 1件取り出す（編集画面用）。無ければ null。
export async function getMap(id: number): Promise<TravelMap | null> {
  const rows = await db.select().from(maps).where(eq(maps.id, id)).limit(1);
  return rows[0] ?? null;
}

// 名札のリストから「名札 → 画像パス」の対応表を作る（記事表示用）。
// 本文に出てきた名札のぶんだけ引く＝記事に地図が無ければDBを触らない。
export async function getMapPathsByNames(
  names: string[],
): Promise<Map<string, string>> {
  const found = new Map<string, string>();
  if (names.length === 0) return found;
  const rows = await db
    .select({ name: maps.name, imagePath: maps.imagePath })
    .from(maps)
    .where(inArray(maps.name, names));
  for (const r of rows) found.set(r.name, r.imagePath);
  return found;
}

// 棚に足す。名札が重複していると unique 制約でエラーになる（呼び出し側で文言に変換）。
export async function createMap(input: NewMapInput): Promise<void> {
  await db.insert(maps).values({
    name: input.name,
    imagePath: input.imagePath,
    updatedAt: now(),
  });
}

// 棚の1件を書き換える（名札の変更・画像の差し替え）。
export async function updateMap(
  id: number,
  input: UpdateMapInput,
): Promise<void> {
  await db
    .update(maps)
    .set({ ...input, updatedAt: now() })
    .where(eq(maps.id, id));
}

// 棚から取り除く。
// ※ 記事本文の [MAP:…] は文字として残るが、名札が見つからないので
//    公開ページでは何も表示されない（下書きプレビューでは警告が出る）。
export async function deleteMap(id: number): Promise<void> {
  await db.delete(maps).where(eq(maps.id, id));
}
