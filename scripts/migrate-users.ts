// 著者対応表（author-map.csv）から、新システムに本物の著者アカウントを作るスクリプト。
//  - wp_id で突き合わせ＝すでに作ってあれば飛ばす（冪等／何度流してもOK）。
//  - 番号1（STUDIO移行アカウント）は作らない（maps.ts 側で除外済み）。
//  - 担当連載があれば category_authors（担当名簿）にも登録 → 投稿画面の自動ひもづけが効く。
//  - パスワードは仮のランダム値（実際の配布は本番前のオンボーディングで設定し直す）。
//
// 実行（お試し＝DBに書かない）:
//   DATABASE_PATH=data/migrate-test.db node --env-file=.env.local --import tsx scripts/migrate-users.ts --dry-run
// 実行（本当に作る）:
//   DATABASE_PATH=data/migrate-test.db node --env-file=.env.local --import tsx scripts/migrate-users.ts

import { randomBytes } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { db } from '../src/db/index';
import { users, categories, categoryAuthors } from '../src/db/schema';
import { hashPassword } from '../src/auth/password';
import {
  loadAuthorMap,
  loadSeriesMap,
  resolveSeriesByLabel,
  type AuthorEntry,
} from '../migration/lib/maps';

const DRY_RUN = process.argv.includes('--dry-run');

export type UserSyncResult = {
  created: number;
  skipped: number;
  linked: number; // 担当連載にひもづけた数
  errors: { wpId: number; reason: string }[];
};

// 著者1人をDBに作る（既にいれば飛ばす）。担当連載があれば名簿にも登録。
async function syncOneAuthor(
  entry: AuthorEntry,
  seriesLabelToCategoryId: (label: string) => number | null,
  result: UserSyncResult,
): Promise<void> {
  // すでに wp_id でいれば作らない（冪等）
  const existing = db.select().from(users).where(eq(users.wpId, entry.wpId)).get();
  if (existing) {
    result.skipped++;
    return;
  }
  // メール重複（wp_id 無しの手動アカウント等）も二重作成を避ける
  const sameEmail = db.select().from(users).where(eq(users.email, entry.email)).get();
  if (sameEmail) {
    result.errors.push({
      wpId: entry.wpId,
      reason: `メール重複のため作成せず: ${entry.email}（既存 id=${sameEmail.id}）`,
    });
    return;
  }

  if (DRY_RUN) {
    result.created++;
    const catId = seriesLabelToCategoryId(entry.seriesName);
    if (catId !== null) result.linked++;
    return;
  }

  const passwordHash = await hashPassword(randomBytes(18).toString('base64')); // 仮パスワード
  const [row] = await db
    .insert(users)
    .values({
      name: entry.displayName,
      email: entry.email,
      passwordHash,
      role: entry.role,
      wpId: entry.wpId,
    })
    .returning();
  result.created++;

  // 担当連載 → category_authors（担当名簿）に登録
  const catId = seriesLabelToCategoryId(entry.seriesName);
  if (catId !== null) {
    await db
      .insert(categoryAuthors)
      .values({ categoryId: catId, userId: row.id })
      .onConflictDoNothing();
    result.linked++;
  }
}

export async function syncUsers(): Promise<UserSyncResult> {
  const authorMap = loadAuthorMap();
  const seriesMap = loadSeriesMap();

  // 担当連載名（「度々の旅＞山陰編」等）→ DBの categories.id を引く関数。
  // 連載は series-map の wp_term_id で作成済み（DB側）。それを wpTermId で逆引きする。
  const seriesLabelToCategoryId = (label: string): number | null => {
    const series = resolveSeriesByLabel(label, seriesMap);
    if (!series) return null;
    const cat = db
      .select()
      .from(categories)
      .where(eq(categories.wpTermId, series.wpTermId))
      .get();
    return cat ? cat.id : null;
  };

  const result: UserSyncResult = { created: 0, skipped: 0, linked: 0, errors: [] };
  for (const entry of authorMap.entries) {
    try {
      await syncOneAuthor(entry, seriesLabelToCategoryId, result);
    } catch (e) {
      result.errors.push({ wpId: entry.wpId, reason: String(e) });
    }
  }
  return result;
}

async function main() {
  console.log(`【ユーザー同期】${DRY_RUN ? 'お試し(dry-run・DBに書きません)' : '本実行'}`);
  const r = await syncUsers();
  console.log(`  作成: ${r.created} 名 / 既存スキップ: ${r.skipped} 名 / 担当連載ひもづけ: ${r.linked} 件`);
  if (r.errors.length) {
    console.log(`  ⚠ エラー ${r.errors.length} 件:`);
    for (const e of r.errors) console.log(`    wpId=${e.wpId}: ${e.reason}`);
  } else {
    console.log('  エラーなし');
  }
}

// 直接実行されたときだけ main を走らせる（他スクリプトから import しても動かない）
if (process.argv[1] && process.argv[1].endsWith('migrate-users.ts')) {
  main();
}
