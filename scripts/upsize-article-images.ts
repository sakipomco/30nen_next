// 本文の写真を「大きい版」に差し替えるスクリプト。
//
// ▼ なぜ必要か（🐛 2026-07-31 判明）
// WordPressは写真を貼るとき、元の写真とは別に縮小コピー（横300pxなど）を自動で作り、
// 本文にはその縮小コピーを貼っていた。旧サイトのCSSは本文の写真を横幅いっぱいに
// 引き伸ばして表示していたので、中身が300pxでも大きく見えていた。
// 新サイトは写真を本当の大きさで表示するため、300pxの写真は300pxのまま＝小さく見える。
// → 本文のURLを、同じ写真の「大きい版」に付け替える。
//
// ▼ どれを選ぶか
// 表示枠は最大720pxなので、1024px前後あれば十分きれい（大きすぎると通信が重くなる）。
//  ① 横1024px以上の版があれば、その中でいちばん小さいもの
//  ② 無ければ -scaled（WPが作る2560px版）
//  ③ 無ければ元ファイルそのもの
//  ④ 無ければ、今より大きい版のうち最大のもの
// どれも無い（サーバーに縮小コピーしか無い）写真は、そのままにして件数だけ報告する。
//
// ▼ 使い方（サーバー上で実行。既定は下読みだけ）
//   cd /var/www/30nen_next && npx tsx scripts/upsize-article-images.ts
//   cd /var/www/30nen_next && npx tsx scripts/upsize-article-images.ts --apply
//
// 何度実行しても結果は同じ（すでに大きい版になっているものは対象外）。

import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';

const DB_PATH = process.env.DB_PATH ?? 'data/30nen.db';
const PUBLIC_ROOT = process.env.PUBLIC_ROOT ?? 'public';
const APPLY = process.argv.includes('--apply');

// 本文中の <img src="/uploads/…"> を拾う
const IMG_SRC_RE = /(<img\b[^>]*?\bsrc=")(\/uploads\/[^"]+?)(")/gi;
// 縮小コピーの形: 〜-300x225.jpeg
const RESIZED_RE = /^(.*)-(\d+)x(\d+)(\.(?:jpe?g|png|gif|webp))$/i;

// フォルダの中身は何度も読むのでキャッシュする
const dirCache = new Map<string, string[]>();
function listDir(dir: string): string[] {
  const hit = dirCache.get(dir);
  if (hit) return hit;
  let files: string[] = [];
  try {
    files = fs.readdirSync(dir);
  } catch {
    files = [];
  }
  dirCache.set(dir, files);
  return files;
}

type Candidate = { file: string; width: number };

/**
 * 縮小コピーのURLを受け取り、差し替え先のURLを返す。
 * 差し替える必要が無い／大きい版が無いときは null。
 */
function findBigger(urlPath: string): string | null {
  const decoded = decodeURIComponent(urlPath);
  const m = decoded.match(RESIZED_RE);
  if (!m) return null; // 縮小コピーではない＝そのまま
  const [, baseNoExt, w, , ext] = m;
  const currentWidth = Number(w);

  const dir = path.join(PUBLIC_ROOT, path.dirname(baseNoExt));
  const stem = path.basename(baseNoExt); // 例: IMG_1859
  const files = listDir(dir);
  if (files.length === 0) return null;

  const lowerExt = ext.toLowerCase();
  const candidates: Candidate[] = [];
  let plain: string | null = null;
  let scaled: string | null = null;

  for (const f of files) {
    if (path.extname(f).toLowerCase() !== lowerExt) continue;
    const nameNoExt = f.slice(0, f.length - ext.length);
    if (nameNoExt === stem) {
      plain = f;
      continue;
    }
    if (nameNoExt === `${stem}-scaled`) {
      scaled = f;
      continue;
    }
    const vm = nameNoExt.match(/^(.*)-(\d+)x(\d+)$/);
    if (vm && vm[1] === stem) candidates.push({ file: f, width: Number(vm[2]) });
  }

  const toUrl = (file: string) => path.posix.join('/', path.dirname(baseNoExt), file);
  // 選んだ先が今と同じなら「差し替え不要」とする
  //（例: すでに横1024pxを使っている写真は①に自分自身が引っかかるため）
  const unlessSame = (file: string) => {
    const url = toUrl(file);
    return url === decoded ? null : url;
  };

  // ① 横1024px以上のうち、いちばん小さいもの
  const big = candidates.filter((c) => c.width >= 1024).sort((a, b) => a.width - b.width)[0];
  if (big) return unlessSame(big.file);
  // ② -scaled（WPの2560px版）
  if (scaled) return unlessSame(scaled);
  // ③ 元ファイル
  if (plain) return unlessSame(plain);
  // ④ 今より大きい版のうち最大のもの
  const larger = candidates.filter((c) => c.width > currentWidth).sort((a, b) => b.width - a.width)[0];
  if (larger) return unlessSame(larger.file);
  return null;
}

function main() {
  const db = new Database(DB_PATH);
  const rows = db
    .prepare("select id, title, content from articles where content like '%<img%'")
    .all() as { id: number; title: string; content: string }[];

  const update = db.prepare('update articles set content = ? where id = ?');
  let changedArticles = 0;
  let replaced = 0;
  let leftSmall = 0;
  const leftSamples = new Set<string>();

  for (const row of rows) {
    let count = 0;
    const html = row.content.replace(IMG_SRC_RE, (whole, head: string, src: string, tail: string) => {
      const better = findBigger(src);
      if (!better) {
        // 差し替え先が無かったもののうち、まだ小さい（横1024px未満）ものだけ数える
        const m = decodeURIComponent(src).match(RESIZED_RE);
        if (m && Number(m[2]) < 1024) {
          leftSmall++;
          if (leftSamples.size < 5) leftSamples.add(src);
        }
        return whole;
      }
      count++;
      return head + better + tail;
    });
    if (count > 0) {
      changedArticles++;
      replaced += count;
      if (APPLY) update.run(html, row.id);
    }
  }

  console.log(`DB: ${DB_PATH} / 画像フォルダ: ${PUBLIC_ROOT}/uploads`);
  console.log(APPLY ? '=== 実行（書き換えました） ===' : '=== 下読み（書き換えていません） ===');
  console.log(`  差し替え: ${changedArticles}記事 / ${replaced}枚`);
  console.log(`  そのまま: ${leftSmall}枚（サーバーに大きい版が無い＝旧サーバーから取り寄せが必要）`);
  for (const s of leftSamples) console.log(`      例: ${s}`);
  if (!APPLY) console.log('\n※ 実際に書き換えるには --apply を付けて実行してください。');
  db.close();
}

main();
