// 画像アップロードの窓口（POST /api/upload）。
// 本文エディタの「画像」ボタンと、アイキャッチ画像の設定欄の両方がここを使う。
//
// 流れ：ブラウザが画像ファイルを送る → ログイン確認 → 種類・サイズを検査
//   → public/uploads/YYYY/MM/ にユニークな名前で保存 → 公開URL（/uploads/...）を返す。
//
// ※ public/ に置いたファイルは、そのURL（先頭が "/"）でそのまま配信される（Next.jsの仕様）。
//    保存したファイル自体はGit管理しない（.gitignore で /public/uploads を除外済み）。

import { randomBytes } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { getCurrentUser } from '@/auth/session';

// 受け付ける画像の種類（MIMEタイプ → 保存時の拡張子）。
const ALLOWED: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
};

const MAX_BYTES = 10 * 1024 * 1024; // 1枚あたり最大10MB

export async function POST(request: Request) {
  // ① ログイン必須（未ログインは弾く）
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: 'ログインが必要です。' }, { status: 401 });
  }

  // ② 送られてきたファイルを取り出す
  const formData = await request.formData();
  const file = formData.get('file');
  if (!(file instanceof File)) {
    return Response.json({ error: '画像が選ばれていません。' }, { status: 400 });
  }

  // ③ 種類とサイズを検査
  const ext = ALLOWED[file.type];
  if (!ext) {
    return Response.json(
      { error: '対応していない種類です（JPEG・PNG・GIF・WebP のみ）。' },
      { status: 400 },
    );
  }
  if (file.size > MAX_BYTES) {
    return Response.json(
      { error: '画像が大きすぎます（10MBまで）。' },
      { status: 400 },
    );
  }

  // ④ 保存先を決める：/uploads/年/月/ ランダム名.拡張子
  //    年月フォルダで分けると、枚数が増えても1フォルダに集中しない（旧WordPressと同じ考え方）。
  const now = new Date();
  const yyyy = String(now.getFullYear());
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const filename = `${randomBytes(16).toString('hex')}.${ext}`;

  const relDir = path.posix.join('uploads', yyyy, mm); // URL用（/区切り）
  const publicDir = path.join(process.cwd(), 'public', 'uploads', yyyy, mm);

  // ⑤ ファイルとして書き出す
  const bytes = Buffer.from(await file.arrayBuffer());
  await mkdir(publicDir, { recursive: true });
  await writeFile(path.join(publicDir, filename), bytes);

  // ⑥ 表示に使う公開URLを返す
  const url = '/' + path.posix.join(relDir, filename);
  return Response.json({ url });
}
