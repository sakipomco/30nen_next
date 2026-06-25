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

import { readdirSync, copyFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { eq } from 'drizzle-orm';
import { db } from '../src/db/index';
import { categories } from '../src/db/schema';
import { loadSeriesMap, type SeriesEntry } from '../migration/lib/maps';

const DRY_RUN = process.argv.includes('--dry-run');

const PROJECT_ROOT = resolve(dirname(new URL(import.meta.url).pathname), '..');

// 小商店の表示用：連載ロゴと並び順（項目52でSAKIさんが確定。wp_term_id をキーに）。
// ロゴ実体は ph_data/logo/ にあり、移行時に public/uploads/logo/ へコピーする。
const DISPLAY: Record<number, { sortOrder: number; imagePath: string }> = {
  126: { sortOrder: 1, imagePath: '/uploads/logo/oshirase3.jpg' },
  226: { sortOrder: 2, imagePath: '/uploads/logo/p01_tabitabi_pre_logo2.png' },
  205: { sortOrder: 3, imagePath: '/uploads/logo/23_moshimoshi_logo.jpg' },
  187: { sortOrder: 4, imagePath: '/uploads/logo/22_caltatau_logo.jpg' },
  159: { sortOrder: 5, imagePath: '/uploads/logo/21_uki_logo3.jpg' },
  137: { sortOrder: 6, imagePath: '/uploads/logo/20_ephemera_logo1.jpg' },
  102: { sortOrder: 7, imagePath: '/uploads/logo/19_oosama_logo_3.png' },
  58: { sortOrder: 8, imagePath: '/uploads/logo/18_amenochihare_logo_2.jpg' },
  59: { sortOrder: 9, imagePath: '/uploads/logo/17_tocotobi_logo_2.png' },
  33: { sortOrder: 10, imagePath: '/uploads/logo/15_shimashima_logo2.png' },
  15: { sortOrder: 11, imagePath: '/uploads/logo/14_nayatane_kari_logo4.jpg' },
  14: { sortOrder: 12, imagePath: '/uploads/logo/12_gokigen_logo3.png' },
  6: { sortOrder: 13, imagePath: '/uploads/logo/11_sophy_logo.png' },
  13: { sortOrder: 14, imagePath: '/uploads/logo/10_ps_logo3.png' },
  12: { sortOrder: 15, imagePath: '/uploads/logo/01_kazahaya_ph.jpg' },
  7: { sortOrder: 16, imagePath: '/uploads/logo/02_10957_logo2.png' },
  10: { sortOrder: 17, imagePath: '/uploads/logo/04_nochinonora_logo.jpg' },
  9: { sortOrder: 18, imagePath: '/uploads/logo/06_kakinuma_logo.jpg' },
  8: { sortOrder: 19, imagePath: '/uploads/logo/05_watashino_logo.jpg' },
  34: { sortOrder: 20, imagePath: '/uploads/logo/16_seizetheday_logo_new.jpg' },
};

// ロゴ実体（ph_data/logo/）を public/uploads/logo/ へコピーする（無ければ作る・既存は上書きしない）。
function copyLogos(): void {
  const src = join(PROJECT_ROOT, 'ph_data/logo');
  const dest = join(PROJECT_ROOT, 'public/uploads/logo');
  if (!existsSync(src)) return;
  mkdirSync(dest, { recursive: true });
  for (const f of readdirSync(src)) {
    const to = join(dest, f);
    if (!existsSync(to)) copyFileSync(join(src, f), to);
  }
}

// 親連載ラベル「度々の旅(226)」から親の term_id を取り出す。無ければ null（＝トップ階層）。
function parentTermId(label: string): number | null {
  const m = /\((\d+)\)/.exec(label);
  return m ? Number(m[1]) : null;
}

export type CategorySyncResult = { created: number; skipped: number; errors: string[] };

async function insertCategory(
  entry: SeriesEntry,
  fallbackOrder: number,
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
  // 並び順・ロゴは DISPLAY（項目52の確定）を優先。無い連載（子の山陰編など）は
  // 末尾に回し（100+）・ロゴなし。
  const disp = DISPLAY[entry.wpTermId];
  const sortOrder = disp ? disp.sortOrder : 100 + fallbackOrder;
  const imagePath = disp ? disp.imagePath : null;
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
      imagePath,
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
  if (!DRY_RUN) copyLogos(); // ロゴ実体を public/uploads/logo/ へ用意
  const r = await syncCategories();
  console.log(`  作成: ${r.created} / 既存スキップ: ${r.skipped} / エラー: ${r.errors.length}`);
  for (const e of r.errors) console.log(`    ⚠ ${e}`);
}

if (process.argv[1] && process.argv[1].endsWith('migrate-categories.ts')) {
  main();
}
