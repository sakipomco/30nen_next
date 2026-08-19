// 画像アップロードの窓口（POST /api/upload）。
// 本文エディタの「画像」ボタンと、アイキャッチ画像の設定欄の両方がここを使う。
//
// 流れ：ブラウザが画像ファイルを送る → ログイン確認 → 種類を検査
//   → 大きい写真は自動で「軽く」する（長辺を縮小＋圧縮。スマホの向きも補正）
//   → 同じ人が前に上げたのと中身が同じなら、保存せずそのときのURLを返す（二重保存を防ぐ）
//   → public/uploads/YYYY/MM/ にユニークな名前で保存 → 公開URL（/uploads/...）を返す。
//
// ※ public/ に置いたファイルは、そのURL（先頭が "/"）でそのまま配信される（Next.jsの仕様）。
//    保存したファイル自体はGit管理しない（.gitignore で /public/uploads を除外済み）。

import { createHash, randomBytes } from 'node:crypto';
import { access, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { getCurrentUser } from '@/auth/session';
import { findOwnUploadByHash, recordUpload } from '@/db/uploads';
import { shrinkImage } from '@/lib/image';

// 受け付けるファイルの種類（MIMEタイプ → 保存時の拡張子）。
const ALLOWED: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  // 動画は mp4 のみ（どのスマホ・パソコンのブラウザでも再生できる形式）。
  'video/mp4': 'mp4',
};

// 安全弁：自動で軽くするので普段は引っかからないが、極端に巨大なファイルだけ防ぐ上限。
const MAX_BYTES = 40 * 1024 * 1024; // 40MB
// 動画は縮小できないぶん上限を別に持つ。旧サイトの実績は最大153MBだったので余裕をみて200MB。
const MAX_VIDEO_BYTES = 200 * 1024 * 1024; // 200MB

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
      { error: '対応していない種類です（画像はJPEG・PNG・GIF・WebP、動画はMP4のみ）。' },
      { status: 400 },
    );
  }
  const isVideo = file.type.startsWith('video/');
  const maxBytes = isVideo ? MAX_VIDEO_BYTES : MAX_BYTES;
  if (file.size > maxBytes) {
    return Response.json(
      {
        error: isVideo
          ? '動画が大きすぎます（200MBまで）。'
          : '画像が大きすぎます（40MBまで）。',
      },
      { status: 400 },
    );
  }

  // ④ 大きい写真は自動で軽くする（縮小＋圧縮）。壊れた画像などはここで失敗する。
  //    動画は縮小できないのでそのまま保存する（上の40MB上限だけで守る）。
  let bytes: Buffer;
  try {
    const raw = Buffer.from(await file.arrayBuffer());
    bytes = isVideo ? raw : await shrinkImage(raw, file.type);
  } catch {
    return Response.json(
      { error: '画像を読み込めませんでした。別の画像でお試しください。' },
      { status: 400 },
    );
  }

  // ⑤ 「同じ写真をもう上げていないか」を指紋（SHA-256）で照合する。
  //    軽くした後のバイト列から取るので、同じ写真なら必ず同じ指紋になる。
  //    例）本文にドラッグ → アイキャッチでも端末から同じ写真を選ぶ、で2枚できるのを防ぐ。
  //    ※ 他人の写真は使い回さない（持ち主が消すと別の人の記事から画像が消えるため）。
  const contentHash = createHash('sha256').update(bytes).digest('hex');
  const existing = await findOwnUploadByHash(contentHash, user.id);
  if (existing) {
    // 台帳に残っていても実ファイルが無い場合（サーバー側で直接消したなど）は
    // 使い回さず、下でふつうに保存し直す＝リンク切れのURLを返さないための保険。
    const existingFile = path.join(process.cwd(), 'public', existing);
    const stillThere = await access(existingFile).then(
      () => true,
      () => false,
    );
    if (stillThere) return Response.json({ url: existing });
  }

  // ⑥ 保存先を決める：/uploads/年/月/ ランダム名.拡張子
  //    年月フォルダで分けると、枚数が増えても1フォルダに集中しない（旧WordPressと同じ考え方）。
  const now = new Date();
  const yyyy = String(now.getFullYear());
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const filename = `${randomBytes(16).toString('hex')}.${ext}`;

  const relDir = path.posix.join('uploads', yyyy, mm); // URL用（/区切り）
  const publicDir = path.join(process.cwd(), 'public', 'uploads', yyyy, mm);

  // ⑦ ファイルとして書き出す
  await mkdir(publicDir, { recursive: true });
  await writeFile(path.join(publicDir, filename), bytes);

  // ⑧ 「誰が上げたか」を台帳に記録する（画像フォルダ一覧で“自分の写真だけ削除”に使う）。
  //    記録に失敗しても画像保存自体は成功しているので、本処理は止めない（持ち主不明になるだけ）。
  const url = '/' + path.posix.join(relDir, filename);
  try {
    await recordUpload({ path: url, uploadedBy: user.id, contentHash });
  } catch {
    // 台帳への記録失敗は致命的ではないため無視（次回以降の削除判定で持ち主不明になるだけ）。
  }

  // ⑨ 表示に使う公開URLを返す
  return Response.json({ url });
}
