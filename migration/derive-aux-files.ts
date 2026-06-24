// サーバーから持ち帰った書き出しJSONをもとに、補助ファイル2種を「手元(ローカル)」で作る後処理。
//  - <ID>.author_id.txt  … 著者番号（<ID>.json の post_author から）
//  - <ID>.imagelist.txt  … 本文で使う画像の相対パス（<ID>.json の本文から wp-content/uploads を抽出）
// これでサンプル(reference/sample-posts/posts)と完全に同じ4ファイル構成になり、
// 既存の migrate-articles.ts がそのまま使える。
//
// なぜサーバーでなく手元で作るか:
//  - サーバー(本番)での処理コマンド数を減らし負荷・実行時間を抑えるため。
//  - 本文の解析は手元のNodeで確実に行える（サーバー側ツールの有無に依存しない）。
//
// 実行:
//   node --import tsx migration/derive-aux-files.ts <書き出しフォルダ>
//   例) node --import tsx migration/derive-aux-files.ts migration/export/posts

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const dir = resolve(process.argv[2] ?? 'migration/export/posts');

// PHP警告などの先頭ゴミを飛ばして JSON を読む（最初の { から）。
function parseJsonLoose<T>(text: string): T {
  const i = text.search(/[[{]/);
  return JSON.parse(i >= 0 ? text.slice(i) : text) as T;
}

// 本文HTMLから wp-content/uploads 配下の相対パスを抽出（重複除去・整列）。
//   …/wp-content/uploads/2026/05/IMG_5867-300x300.png → 2026/05/IMG_5867-300x300.png
function extractImagePaths(content: string): string[] {
  const re = /wp-content\/uploads\/([^"'\s)\\<>]+)/g;
  const set = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) set.add(m[1]);
  return [...set].sort();
}

function main() {
  const idBases = readdirSync(dir)
    .filter((f) => f.endsWith('.json') && !f.endsWith('.categories.json'))
    .map((f) => f.replace(/\.json$/, ''));

  let done = 0;
  for (const id of idBases) {
    const post = parseJsonLoose<{ post_author: string; post_content: string }>(
      readFileSync(join(dir, `${id}.json`), 'utf8'),
    );
    writeFileSync(join(dir, `${id}.author_id.txt`), String(post.post_author ?? ''));
    writeFileSync(
      join(dir, `${id}.imagelist.txt`),
      extractImagePaths(post.post_content ?? '').join('\n'),
    );
    done++;
  }
  console.log(`補助ファイル生成 完了: ${done} 記事ぶん（author_id.txt / imagelist.txt）→ ${dir}`);
}

main();
