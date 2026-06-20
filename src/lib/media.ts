// 画像フォルダ（public/uploads/）の中身を読み取る係。
// アップロードはDBに台帳(uploads)を持つが、実体はファイル。
// 「実際に置いてある画像ファイル」を正として一覧する（過去の・記録の無い写真も拾える）。

import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';

// 一覧に出す画像の拡張子（アップロードで受け付ける種類に合わせる）。
const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp']);

export type UploadedImage = {
  url: string; // 公開URL（例: /uploads/2026/06/xxxx.jpg）
  mtimeMs: number; // ファイルの更新時刻（新しい順に並べるのに使う）
};

// public/uploads/ 以下を再帰的に走査して画像ファイルを集め、新しい順で返す。
export async function listUploadedImageFiles(): Promise<UploadedImage[]> {
  const baseDir = path.join(process.cwd(), 'public', 'uploads');

  let entries: string[];
  try {
    entries = await readdir(baseDir, { recursive: true });
  } catch {
    return []; // フォルダがまだ無ければ空一覧
  }

  const images: UploadedImage[] = [];
  for (const rel of entries) {
    if (!IMAGE_EXT.has(path.extname(rel).toLowerCase())) continue; // 画像以外・フォルダは飛ばす
    const full = path.join(baseDir, rel);
    try {
      const s = await stat(full);
      if (!s.isFile()) continue;
      // URL用に必ず「/」区切りにする（Windowsの「\」対策）。
      const urlRel = rel.split(path.sep).join('/');
      images.push({ url: '/' + path.posix.join('uploads', urlRel), mtimeMs: s.mtimeMs });
    } catch {
      continue; // 読めないものは飛ばす
    }
  }

  images.sort((a, b) => b.mtimeMs - a.mtimeMs); // 新しい順
  return images;
}
