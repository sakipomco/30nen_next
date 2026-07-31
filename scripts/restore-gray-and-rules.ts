// 旧WordPressから移行したときに失われた「グレー文字」と「長い罫線」を復元するスクリプト。
//
// ▼ なぜ必要か（🐛 2026-07-31 判明）
//  ・グレー文字 … WPは <span style="color: #999999"> と色を直接書いていた。新システムは
//    安全のため style 属性を許していないので、色だけ落ちて黒文字になっていた（181記事）。
//  ・長い罫線 … WPは <hr /> を1行だけ書いていた。移行スクリプトの wpautop が
//    「中身が空の段落は捨てる」判定でこの行ごと捨てていた（193記事 → 6記事しか残っていない）。
//  どちらもエフェメラ！の定型（冒頭と末尾のグレー文＋2本の罫線）で使われていたもの。
//
// ▼ 安全のしくみ
//  旧WPの原文から作り直した本文が、いま本番に入っている本文と「一字一句同じ」ときだけ書き換える。
//  ＝移行後に書き手が手を入れた記事には触らない。判定は次の考え方:
//    今のパイプライン（修正後）で作った本文から、罫線の行を抜き、グレーの印を外すと、
//    当時（バグがあった頃）の出力に戻るはず。それが本番の本文と一致すれば「未編集」。
//
// ▼ 使い方（既定は下読みだけ。実際に書き換えるのは --apply を付けたときだけ）
//   npx tsx scripts/restore-gray-and-rules.ts
//   npx tsx scripts/restore-gray-and-rules.ts --apply
//
// 何度実行しても結果は同じ（復元済みの記事は「一致」しなくなるので対象外になる）。

import fs from 'node:fs';
import Database from 'better-sqlite3';
import { transformContent } from '../migration/lib/transform';

const DB_PATH = process.env.DB_PATH ?? 'data/30nen.db';
const EXPORT_PATH = process.env.EXPORT_PATH ?? 'migration/export/all-posts.json';
const APPLY = process.argv.includes('--apply');

/** 復元後の本文から、当時（バグがあった頃）の本文を組み立て直す。 */
function toLegacy(html: string): string {
  return html
    // 罫線だけの行は、当時は丸ごと捨てられていた
    .replace(/\n?<hr\s*\/?>\n?/gi, (m) => (m.startsWith('\n') && m.endsWith('\n') ? '\n' : ''))
    // span は、当時は色ごと落とされてただの文字だった
    // （グレー以外の色指定＝#333 なども <span> になるので、まとめて外す）
    .replace(/<span class="gray">/g, '')
    .replace(/<span>/g, '')
    .replace(/<\/span>/g, '');
}

/** 復元後の本文から <span class="gray"> を外した形（グレー以外の差がないか確かめる用） */
function countMarks(html: string) {
  return {
    gray: (html.match(/<span class="gray">/g) ?? []).length,
    hr: (html.match(/<hr\s*\/?>/gi) ?? []).length,
  };
}

function main() {
  const posts = JSON.parse(fs.readFileSync(EXPORT_PATH, 'utf8')) as {
    ID: number | string;
    post_content: string;
  }[];
  const byWpId = new Map(posts.map((p) => [String(p.ID), p]));

  const db = new Database(DB_PATH);
  const rows = db
    .prepare('select id, wp_id as wpId, title, content from articles where wp_id is not null')
    .all() as { id: number; wpId: number; title: string; content: string }[];

  const update = db.prepare('update articles set content = ? where id = ?');
  const restored: { id: number; title: string; gray: number; hr: number }[] = [];
  const skipped: { id: number; title: string }[] = [];

  for (const row of rows) {
    const post = byWpId.get(String(row.wpId));
    if (!post) continue;
    const raw = String(post.post_content ?? '');
    // 旧原文にグレーも罫線も無い記事は関係ない
    if (!/<span[^>]*color/i.test(raw) && !/<hr/i.test(raw)) continue;

    const restoredHtml = transformContent(raw);
    const marks = countMarks(restoredHtml);
    if (marks.gray === 0 && marks.hr === 0) continue; // 復元するものが無い

    if (restoredHtml === row.content) continue; // すでに復元済み

    // 移行後に手が入っていないか＝当時の出力と一致するか
    if (toLegacy(restoredHtml) !== toLegacy(row.content)) {
      skipped.push({ id: row.id, title: row.title });
      continue;
    }

    restored.push({ id: row.id, title: row.title, gray: marks.gray, hr: marks.hr });
    if (APPLY) update.run(restoredHtml, row.id);
  }

  console.log(`DB: ${DB_PATH}`);
  console.log(APPLY ? '=== 実行（書き換えました） ===' : '=== 下読み（書き換えていません） ===');
  const gray = restored.reduce((n, r) => n + r.gray, 0);
  const hr = restored.reduce((n, r) => n + r.hr, 0);
  console.log(`  復元: ${restored.length}記事（グレー ${gray}か所 / 罫線 ${hr}本）`);
  if (skipped.length) {
    console.log(`  見送り: ${skipped.length}記事（移行後に手が入っているため触りません）`);
    for (const s of skipped.slice(0, 20)) console.log(`      ${s.id}「${s.title}」`);
    if (skipped.length > 20) console.log(`      …ほか ${skipped.length - 20}件`);
  }
  if (!APPLY) console.log('\n※ 実際に書き換えるには --apply を付けて実行してください。');
  db.close();
}

main();
