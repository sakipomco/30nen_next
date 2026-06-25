// サーバーから持ち帰った「まとめファイル」を、1記事ごとのファイルに分ける（手元で実行）。
//   入力: <baseDir>/all-posts.json（記事本体の配列）
//         <baseDir>/all-categories.tsv（post_id ごとの連載・タブ区切り）
//   出力: <baseDir>/posts/<ID>.json（1記事の本体）
//         <baseDir>/posts/<ID>.categories.json（その記事の連載配列）
// このあと derive-aux-files.ts で <ID>.author_id.txt / <ID>.imagelist.txt を作れば、
// サンプルと同じ4ファイル構成になり、migrate-articles.ts がそのまま使える。
//
// 実行:
//   node --import tsx migration/split-export.ts <baseDir>
//   例) node --import tsx migration/split-export.ts migration/export

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

const baseDir = resolve(process.argv[2] ?? 'migration/export');
const postsOut = join(baseDir, 'posts');
mkdirSync(postsOut, { recursive: true });

// PHP警告などの先頭ゴミを飛ばして JSON を読む（最初の [ または { から）。
function parseJsonLoose<T>(text: string): T {
  const i = text.search(/[[{]/);
  return JSON.parse(i >= 0 ? text.slice(i) : text) as T;
}

type WpPost = { ID: number } & Record<string, unknown>;
type WpCategory = { term_id: number; name: string; slug: string; parent: number };

// タブ区切りの「post_id<TAB>値」ファイルを Map に読む（先頭が数字でない行は飛ばす）。無ければ空。
function loadIdMap(path: string): Map<string, string> {
  const map = new Map<string, string>();
  if (!existsSync(path)) return map;
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    const [postId, value] = line.split('\t');
    if (!/^\d+$/.test(postId ?? '')) continue;
    if (value) map.set(postId, value.trim());
  }
  return map;
}

function main() {
  // ① 記事本体（配列）
  const posts = parseJsonLoose<WpPost[]>(
    readFileSync(join(baseDir, 'all-posts.json'), 'utf8'),
  );

  // ② カテゴリTSV → post_id ごとに集約（タブ区切り: object_id, term_id, name, slug, parent）
  const catsByPost = new Map<string, WpCategory[]>();
  const tsv = readFileSync(join(baseDir, 'all-categories.tsv'), 'utf8');
  for (const line of tsv.split('\n')) {
    if (!line.trim()) continue;
    const cols = line.split('\t');
    const [postId, termId, name, slug, parent] = cols;
    if (!/^\d+$/.test(postId ?? '')) continue; // 見出し行や空行は飛ばす
    const arr = catsByPost.get(postId) ?? [];
    arr.push({
      term_id: Number(termId),
      name: name ?? '',
      slug: slug ?? '',
      parent: Number(parent) || 0,
    });
    catsByPost.set(postId, arr);
  }

  // ③ アイキャッチ（代表写真）の対応表 post_id → 相対パス（あれば）
  const featuredByPost = loadIdMap(join(baseDir, 'all-featured.tsv'));

  // ④ 1記事ごとに書き出し
  let n = 0;
  for (const p of posts) {
    const id = String(p.ID);
    writeFileSync(join(postsOut, `${id}.json`), JSON.stringify(p));
    writeFileSync(
      join(postsOut, `${id}.categories.json`),
      JSON.stringify(catsByPost.get(id) ?? []),
    );
    const featured = featuredByPost.get(id);
    if (featured) writeFileSync(join(postsOut, `${id}.featured.txt`), featured);
    n++;
  }
  console.log(
    `分割完了: ${n} 記事 → ${postsOut}（<ID>.json / .categories.json / .featured.txt）`,
  );
}

main();
