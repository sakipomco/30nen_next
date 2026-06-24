// 画像アップロードの窓口（POST /api/upload）。
// 本文エディタの「画像」ボタンと、アイキャッチ画像の設定欄の両方がここを使う。
//
// 流れ：ブラウザが画像ファイルを送る → ログイン確認 → 種類を検査
//   → 大きい写真は自動で「軽く」する（長辺を縮小＋圧縮。スマホの向きも補正）
//   → public/uploads/YYYY/MM/ にユニークな名前で保存 → 公開URL（/uploads/...）を返す。
//
// ※ public/ に置いたファイルは、そのURL（先頭が "/"）でそのまま配信される（Next.jsの仕様）。
//    保存したファイル自体はGit管理しない（.gitignore で /public/uploads を除外済み）。

import { randomBytes } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { getCurrentUser } from '@/auth/session';
import { recordUpload } from '@/db/uploads';
import { shrinkImage } from '@/lib/image';

// 受け付ける画像の種類（MIMEタイプ → 保存時の拡張子）。
const ALLOWED: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
};

// 安全弁：自動で軽くするので普段は引っかからないが、極端に巨大なファイルだけ防ぐ上限。
const MAX_BYTES = 40 * 1024 * 1024; // 40MB

// 縮小・圧縮の本体は `@/lib/image` の shrinkImage を使う（移行スクリプトと同じ基準）。

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

  // ③ 種類とサイズ（安全弁）を検査
  const ext = ALLOWED[file.type];
  if (!ext) {
    return Response.json(
      { error: '対応していない種類です（JPEG・PNG・GIF・WebP のみ）。' },
      { status: 400 },
    );
  }
  if (file.size > MAX_BYTES) {
    return Response.json(
      { error: '画像が大きすぎます（40MBまで）。' },
      { status: 400 },
    );
  }

  // ④ 大きい写真は自動で軽くする（縮小＋圧縮）。壊れた画像などはここで失敗する。
  let bytes: Buffer;
  try {
    bytes = await shrinkImage(Buffer.from(await file.arrayBuffer()), file.type);
  } catch {
    return Response.json(
      { error: '画像を読み込めませんでした。別の画像でお試しください。' },
      { status: 400 },
    );
  }

  // ⑤ 保存先を決める：/uploads/年/月/ ランダム名.拡張子
  //    年月フォルダで分けると、枚数が増えても1フォルダに集中しない（旧WordPressと同じ考え方）。
  const now = new Date();
  const yyyy = String(now.getFullYear());
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const filename = `${randomBytes(16).toString('hex')}.${ext}`;

  const relDir = path.posix.join('uploads', yyyy, mm); // URL用（/区切り）
  const publicDir = path.join(process.cwd(), 'public', 'uploads', yyyy, mm);

  // ⑥ ファイルとして書き出す
  await mkdir(publicDir, { recursive: true });
  await writeFile(path.join(publicDir, filename), bytes);

  // ⑦ 「誰が上げたか」を台帳に記録する（画像フォルダ一覧で“自分の写真だけ削除”に使う）。
  //    記録に失敗しても画像保存自体は成功しているので、本処理は止めない（持ち主不明になるだけ）。
  const url = '/' + path.posix.join(relDir, filename);
  try {
    await recordUpload({ path: url, uploadedBy: user.id });
  } catch {
    // 台帳への記録失敗は致命的ではないため無視（次回以降の削除判定で持ち主不明になるだけ）。
  }

  // ⑧ 表示に使う公開URLを返す
  return Response.json({ url });
}
