// 本文に残った「https:// の二重付き」リンクを直すスクリプト。
//   例: <a href="https://https://30nen.com/posts/2783"> → <a href="https://30nen.com/posts/2783">
//
//   原因は編集画面のリンク入力箱に "https://" を先入れしていたこと。パソコンでは開いた瞬間に
//   文字が選択されるので上書きされるが、スマホ・タブレット（書き手の主環境）ではタップした
//   位置にカーソルが立つだけなので、そこへURLを貼ると先入れの "https://" とつながってしまう。
//   入力箱そのものは 13c8857 で直したので、これは「すでに壊れてしまった記事」を直す後追い修正。
//
//   直す形は2つだけ（2026-08-13 時点の本番DBを調べた結果）:
//     https://https://…  → https://…   （ほぼ全部）
//     https://https//…   → https://…   （1か所・ブラウザのアドレス欄から写してコロンが落ちた形）
//   飛び先はほとんどが 30nen.com 内だが、外のサイト（Instagram等）へのリンクもある。
//   どちらも「頭の余分な https:// を取る」だけなので扱いは同じ。
//
//  - 置き換えで本文が変わらない記事は触らない。
//  - 何度流しても結果は同じ（冪等）。
//  - 更新日時（updated_at）は変えない。書き手が書き直したわけではないため。
//
// 実行（お試し＝DBに書かない）:
//   DATABASE_PATH=data/30nen.db node --import tsx scripts/fix-doubled-https.ts --dry-run
// 実行（本当に直す）:
//   DATABASE_PATH=data/30nen.db node --import tsx scripts/fix-doubled-https.ts

import { eq, like } from 'drizzle-orm';
import { db } from '../src/db/index';
import { articles } from '../src/db/schema';

const DRY_RUN = process.argv.includes('--dry-run');

// 二重付きの https:// を1つに戻す。
//   "https://https://…" と、コロンが落ちた "https://https//…" の両方に対応する。
export function fixDoubledHttps(html: string): string {
  // 「https:// のすぐ後ろに、もう一つ http(s):// が続いている」ところだけを縮める。
  // コロンが落ちた "https//" も同じ扱いにする（:? の部分）。
  // 3重・4重にも効くよう、変化しなくなるまで繰り返す。
  let out = html;
  let before = '';
  while (before !== out) {
    before = out;
    out = out.replace(/https:\/\/(https?):?\/\//gi, '$1://');
  }
  return out;
}

// 報告用に、壊れたリンクが何か所あるかを数える
function countBroken(html: string): number {
  return (html.match(/https:\/\/https:?\/\//gi) ?? []).length;
}

async function main() {
  console.log(
    `【二重https リンクの修正】${DRY_RUN ? 'お試し(dry-run・DBに書きません)' : '本実行'}`,
  );

  const targets = db
    .select({ id: articles.id, title: articles.title, content: articles.content })
    .from(articles)
    .where(like(articles.content, '%https://https%'))
    .all();

  console.log(`対象の記事: ${targets.length}本`);

  let changed = 0;
  let untouched = 0;
  let links = 0;

  for (const a of targets) {
    const fixed = fixDoubledHttps(a.content);
    if (fixed === a.content) {
      untouched += 1;
      continue;
    }
    const n = countBroken(a.content);
    links += n;
    changed += 1;
    console.log(`  ${a.id} : ${a.title}（${n}か所）`);
    if (!DRY_RUN) {
      db.update(articles).set({ content: fixed }).where(eq(articles.id, a.id)).run();
    }
  }

  console.log(
    `\n${DRY_RUN ? '直る見込み' : '直した'}: ${changed}本 / ${links}か所` +
      (untouched > 0 ? `（変化なし: ${untouched}本）` : ''),
  );
}

main();
