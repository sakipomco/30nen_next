// 手作業で作ったアカウントに旧WordPressの著者番号（wp_id）を付与するスクリプト。
//   author-map.csv の「メール」で本番DBの users と突き合わせ、users.wp_id を埋める。
//   記事移行（migrate-articles.ts）は wp_id で著者をひもづけるため、移行の直前に必ず流す。
//   （account-creation-checklist.md 末尾のメモ＝2026-07-02 の決定事項）
//
//  - すでに正しい wp_id が付いていれば何もしない（冪等／何度流してもOK）。
//  - 対応表と違う wp_id が付いていたら警告だけ出して触らない（手で確認する）。
//  - 対応表にいるがDBに居ない人（例: クロウタドリ）は表示のみ（migrate-users.ts が後で作る）。
//
// 実行（お試し＝DBに書かない）:
//   DATABASE_PATH=data/30nen.db node --env-file=.env.local --import tsx scripts/backfill-wp-ids.ts --dry-run
// 実行（本当に付与する）:
//   DATABASE_PATH=data/30nen.db node --env-file=.env.local --import tsx scripts/backfill-wp-ids.ts

import { eq } from 'drizzle-orm';
import { db } from '../src/db/index';
import { users } from '../src/db/schema';
import { loadAuthorMap } from '../migration/lib/maps';

const DRY_RUN = process.argv.includes('--dry-run');

async function main() {
  console.log(`【wp_id付与】${DRY_RUN ? 'お試し(dry-run・DBに書きません)' : '本実行'}`);
  const authorMap = loadAuthorMap();
  const all = db.select().from(users).all();

  let set = 0;
  let already = 0;
  let missing = 0;
  let mismatch = 0;

  for (const entry of authorMap.entries) {
    const u = all.find((x) => x.email === entry.email);
    // すでにこの wp_id を持っている人がいれば、それを正とする（手動で先に付与したケース。
    // 例: 旧sakipomco(wp_id=2)はメールが店主アカウントと同じため、id=4へ手動付与済み＝2026-07-06 SAKI判断）
    const holder = all.find((x) => x.wpId === entry.wpId);
    if (holder) {
      if (u && holder.id === u.id) {
        already++;
      } else {
        console.log(
          `  別のアカウントに付与済み（そのまま）: wp_id=${entry.wpId} → id=${holder.id} ${holder.name}`,
        );
      }
      continue;
    }
    if (!u) {
      missing++;
      console.log(`  DBに未作成（migrate-usersが後で作る）: wp_id=${entry.wpId} ${entry.displayName}`);
      continue;
    }
    if (u.wpId === entry.wpId) {
      already++;
      continue;
    }
    if (u.wpId !== null && u.wpId !== entry.wpId) {
      mismatch++;
      console.log(`  ⚠ wp_idが対応表と違う（触らず・要確認）: id=${u.id} ${u.name} DB=${u.wpId} 対応表=${entry.wpId}`);
      continue;
    }
    if (!DRY_RUN) {
      await db.update(users).set({ wpId: entry.wpId }).where(eq(users.id, u.id));
    }
    set++;
    console.log(`  付与: id=${u.id} ${u.name} ← wp_id=${entry.wpId}`);
  }

  // DB側にいるのに対応表に無い人（テストユーザー等）は参考表示
  const mapEmails = new Set(authorMap.entries.map((e) => e.email));
  for (const u of all) {
    if (u.wpId === null && !mapEmails.has(u.email)) {
      console.log(`  対応表に無いアカウント（wp_id無しのまま・記事はひもづかない）: id=${u.id} ${u.name}`);
    }
  }

  console.log(
    `  付与: ${set} 名 / 付与済み: ${already} 名 / DB未作成: ${missing} 名 / 相違警告: ${mismatch} 件`,
  );
}

main();
