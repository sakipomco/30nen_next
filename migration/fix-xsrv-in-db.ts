// 既存DBの本文画像URLに残る旧サーバー名(the30nen.xsrv.jp)を /uploads/ へ直す一括修正。
//
// 背景: 記事移行が「xsrv対応前のtransform.ts」で実行されたため、1,476記事の本文に
//       http://the30nen.xsrv.jp/wp-content/uploads/... が残っている（画像ファイル自体は
//       移行時にjpg化して配置済み・本番へrsync済み。直すのは本文URLだけ）。
// 方式: 移行コードとまったく同じ rewriteImageUrls を、本文に当てるだけ（wpautop/サニタイズは
//       再適用しない＝既に整形済みの本文を壊さない）。rewriteImageUrls は既に正しいURLには
//       影響しない（べき等）ので、該当記事だけに安全に効く。
//
// 使い方:
//   DATABASE_PATH=data/prod-import.db node --env-file=.env.local --import tsx migration/fix-xsrv-in-db.ts --dry-run
//   DATABASE_PATH=data/prod-import.db node --env-file=.env.local --import tsx migration/fix-xsrv-in-db.ts

import Database from 'better-sqlite3';
import { rewriteImageUrls } from './lib/transform';

const dbPath = process.env.DATABASE_PATH;
if (!dbPath) {
  console.error('DATABASE_PATH を指定してください（例: DATABASE_PATH=data/prod-import.db）');
  process.exit(1);
}
const dryRun = process.argv.includes('--dry-run');

const db = new Database(dbPath);

const countXsrv = () =>
  (db.prepare("SELECT COUNT(*) c FROM articles WHERE content LIKE '%the30nen.xsrv.jp%'").get() as { c: number }).c;
const countPlaces = () => {
  // 本文中の the30nen.xsrv.jp 出現「箇所」の合計（記事数ではなく総数）
  const rows = db.prepare("SELECT content FROM articles WHERE content LIKE '%the30nen.xsrv.jp%'").all() as { content: string }[];
  return rows.reduce((n, r) => n + (r.content.match(/the30nen\.xsrv\.jp/gi)?.length ?? 0), 0);
};

console.log('=== 修正前 ===');
console.log('  該当記事数:', countXsrv());
console.log('  該当箇所数:', countPlaces());

// 念のためホストのバリエーションを確認（https版・www付きが混ざっていないか）
const variants = db.prepare("SELECT content FROM articles WHERE content LIKE '%the30nen.xsrv.jp%'").all() as { content: string }[];
const hostSet = new Set<string>();
for (const r of variants) {
  for (const m of r.content.matchAll(/https?:\/\/(?:www\.)?the30nen\.xsrv\.jp\/wp-content\/uploads\//gi)) {
    hostSet.add(m[0]);
  }
}
console.log('  検出したホスト前置き:', [...hostSet].join(' , ') || '(なし)');

// 対象記事を取得して書き換え
const targets = db.prepare("SELECT id, title, content FROM articles WHERE content LIKE '%the30nen.xsrv.jp%'").all() as {
  id: number;
  title: string;
  content: string;
}[];

let changed = 0;
let sampleShown = false;
const update = db.prepare('UPDATE articles SET content = ? WHERE id = ?');
const tx = db.transaction(() => {
  for (const a of targets) {
    const next = rewriteImageUrls(a.content);
    if (next !== a.content) {
      changed++;
      if (!sampleShown) {
        sampleShown = true;
        const beforeUrl = a.content.match(/https?:\/\/[^\s"')]*the30nen\.xsrv\.jp[^\s"')]*/i)?.[0];
        // 書き換え後、その画像パスがどう変わったかを1例だけ表示
        console.log('\n=== サンプル（記事ID ' + a.id + '「' + a.title + '」）===');
        console.log('  変更前の一例:', beforeUrl);
        const afterUrl = next.match(/\/uploads\/[^\s"')]+/i)?.[0];
        console.log('  変更後の一例:', afterUrl);
      }
      if (!dryRun) update.run(next, a.id);
    }
  }
});
tx();

console.log('\n書き換えが必要な記事数:', changed);

if (dryRun) {
  console.log('\n[dry-run] 実際の書き込みはしていません。');
} else {
  console.log('\n=== 修正後 ===');
  console.log('  該当記事数:', countXsrv());
  console.log('  該当箇所数:', countPlaces());
}

db.close();
