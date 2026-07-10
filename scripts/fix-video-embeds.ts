// 移行済み記事の「動画が文字のまま見えている」問題を直すスクリプト。
//   旧WordPressの [video mp4="…"][/video]（動画ショートコード）と、
//   行に単独で貼られた YouTube URL（旧WPでは自動で埋め込みプレーヤーになっていた）を、
//   新システムで再生できる <video> タグ / YouTube埋め込み(iframe) に変換して保存し直す。
//   変換ロジックは移行スクリプトと共通（migration/lib/transform.ts の convertVideoEmbeds）。
//   ※ 今後の移行（本移行②）は transformContent に組み込み済みなので、このスクリプトは
//     「すでに移行してしまった記事」を直すための一回きりの後追い修正。
//
//  - 変換で本文が変わらない記事（例: YouTubeへの普通のリンクだけの記事）は触らない。
//  - 何度流しても結果は同じ（冪等）。
//
// 実行（お試し＝DBに書かない）:
//   DATABASE_PATH=data/30nen.db node --env-file=.env.local --import tsx scripts/fix-video-embeds.ts --dry-run
// 実行（本当に直す）:
//   DATABASE_PATH=data/30nen.db node --env-file=.env.local --import tsx scripts/fix-video-embeds.ts

import { eq, like, or } from 'drizzle-orm';
import { db } from '../src/db/index';
import { articles } from '../src/db/schema';
import { convertVideoEmbeds } from '../migration/lib/transform';
import { sanitizeArticleHtml } from '../src/lib/sanitize';

const DRY_RUN = process.argv.includes('--dry-run');

// 変換後HTMLの中身をざっくり数える（報告用）
function countTag(html: string, tag: string): number {
  return (html.match(new RegExp(`<${tag}\\b`, 'g')) ?? []).length;
}

async function main() {
  console.log(`【動画埋め込みの修正】${DRY_RUN ? 'お試し(dry-run・DBに書きません)' : '本実行'}`);

  // 動画表現を含む可能性のある記事だけを対象にする
  const targets = db
    .select({ id: articles.id, wpId: articles.wpId, title: articles.title, content: articles.content })
    .from(articles)
    .where(
      or(
        like(articles.content, '%[video%'),
        like(articles.content, '%[embed%'),
        like(articles.content, '%youtube.com%'),
        like(articles.content, '%youtu.be%'),
      ),
    )
    .all();

  let changed = 0;
  let untouched = 0;

  for (const a of targets) {
    const converted = convertVideoEmbeds(a.content);
    if (converted === a.content) {
      untouched++; // 普通のリンク等のみ＝変換対象なし
      continue;
    }
    const next = sanitizeArticleHtml(converted);
    const videos = countTag(next, 'video') - countTag(a.content, 'video');
    const iframes = countTag(next, 'iframe') - countTag(a.content, 'iframe');
    console.log(
      `  修正: id=${a.id} wp_id=${a.wpId} 「${a.title}」 → 動画+${videos} / YouTube埋め込み+${iframes}`,
    );
    if (!DRY_RUN) {
      await db.update(articles).set({ content: next }).where(eq(articles.id, a.id));
    }
    changed++;
  }

  console.log(`  修正: ${changed} 記事 / 変換対象なし（そのまま）: ${untouched} 記事`);
  if (DRY_RUN) console.log('  ※ dry-run のためDBは変更していません。');
}

main();
