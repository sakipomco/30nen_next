// 連載対応表（series-map.csv）から、新システムに連載(categories)を作るスクリプト（S2）。
//  - wp_term_id で突き合わせ＝すでにあれば飛ばす（冪等）。
//  - 「未分類」は作らない（maps.ts 側の create=false）。
//  - 親子: 親（度々の旅）を先に作り、子（山陰編）は親の id を parentId に入れる。
//  - 並び順(sortOrder)・ヨミガナ・連載画像は表示用の付加情報。ここでは sortOrder を
//    CSVの並び順で仮置きし、画像/ヨミガナは別途（管理画面や別データ）で設定する。
//
// 実行（お試し）:
//   DATABASE_PATH=data/migrate-test.db node --env-file=.env.local --import tsx scripts/migrate-categories.ts --dry-run
// 実行:
//   DATABASE_PATH=data/migrate-test.db node --env-file=.env.local --import tsx scripts/migrate-categories.ts

import { eq } from 'drizzle-orm';
import { db } from '../src/db/index';
import { categories } from '../src/db/schema';
import { loadSeriesMap, type SeriesEntry } from '../migration/lib/maps';

const DRY_RUN = process.argv.includes('--dry-run');

// 親連載ラベル「度々の旅(226)」から親の term_id を取り出す。無ければ null（＝トップ階層）。
function parentTermId(label: string): number | null {
  const m = /\((\d+)\)/.exec(label);
  return m ? Number(m[1]) : null;
}

export type CategorySyncResult = { created: number; skipped: number; errors: string[] };

async function insertCategory(
  entry: SeriesEntry,
  sortOrder: number,
  parentId: number | null,
  result: CategorySyncResult,
): Promise<void> {
  const existing = db
    .select()
    .from(categories)
    .where(eq(categories.wpTermId, entry.wpTermId))
    .get();
  if (existing) {
    result.skipped++;
    return;
  }
  if (DRY_RUN) {
    result.created++;
    return;
  }
  db.insert(categories)
    .values({
      name: entry.name,
      slug: entry.slug || null,
      parentId,
      sortOrder,
      wpTermId: entry.wpTermId,
    })
    .run();
  result.created++;
}

export async function syncCategories(): Promise<CategorySyncResult> {
  const series = loadSeriesMap();
  const toCreate = series.entries.filter((e) => e.create);
  const result: CategorySyncResult = { created: 0, skipped: 0, errors: [] };

  // パス1: トップ階層（親を持たない）
  let order = 0;
  for (const e of toCreate) {
    if (parentTermId(e.parentLabel) !== null) continue;
    try {
      await insertCategory(e, order++, null, result);
    } catch (err) {
      result.errors.push(`${e.name}: ${String(err)}`);
    }
  }
  // パス2: 子（親の id を引いてひもづけ）
  for (const e of toCreate) {
    const pTerm = parentTermId(e.parentLabel);
    if (pTerm === null) continue;
    const parent = db.select().from(categories).where(eq(categories.wpTermId, pTerm)).get();
    if (!parent) {
      result.errors.push(`${e.name}: 親(term_id ${pTerm})が見つからない`);
      continue;
    }
    try {
      await insertCategory(e, order++, parent.id, result);
    } catch (err) {
      result.errors.push(`${e.name}: ${String(err)}`);
    }
  }
  return result;
}

async function main() {
  console.log(`【連載同期】${DRY_RUN ? 'お試し(dry-run・DBに書きません)' : '本実行'}`);
  const r = await syncCategories();
  console.log(`  作成: ${r.created} / 既存スキップ: ${r.skipped} / エラー: ${r.errors.length}`);
  for (const e of r.errors) console.log(`    ⚠ ${e}`);
}

if (process.argv[1] && process.argv[1].endsWith('migrate-categories.ts')) {
  main();
}
