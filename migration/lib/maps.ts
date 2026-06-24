// 移行用の「対応表」読み取り部品。
//  - author-map.csv … WPの著者番号 → 新システムの著者（表示名・メール・権限・担当連載・言語）
//  - series-map.csv  … WPの連載番号(term_id) → 連載名・slug・親など
// さらに、記事ごとの著者解決ルール（番号1の統合・記事単位の特例）もここに集約する。
//
// CSVは外部ライブラリを使わず最小実装で読む（カンマ入りの値は二重引用符で囲まれている）。

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const MIGRATION_DIR = join(here, '..'); // migration/

// ── 最小CSVパーサ（RFC4180準拠の範囲）─────────────────────────
// 二重引用符で囲まれた値の中のカンマ・改行・"" エスケープに対応する。
export function parseCsv(text: string): string[][] {
  const src = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') { field += '"'; i++; } // "" → "
        else inQuotes = false;
      } else field += ch;
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ',') { row.push(field); field = ''; }
      else if (ch === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
      else field += ch;
    }
  }
  // 最後のフィールド／行を取りこぼさない
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  // 末尾の空行を捨てる
  return rows.filter((r) => !(r.length === 1 && r[0].trim() === ''));
}

// ── 記事単位の特例（著者番号の一括ルールでは処理できない記事）──────
// data-migration-plan.md §「個別例外」より。スクリプトはこれを最優先で適用する。
export const EXCLUDED_ARTICLE_WP_IDS = new Set<number>([
  282, // ¥2,000 お雑煮材料費（重複のため移行しない）
]);

// 記事ID → 強制的にこの著者番号にする（一括ルールから外す）
export const ARTICLE_AUTHOR_OVERRIDES: Record<number, number> = {
  24126: 23, // Hijos（CAL TATAU）→ Luis(番号23)
};

// 旧著者番号 → 統合先の著者番号（番号1のSTUDIO移行アカウントはぐっさん番号12へ）
export const AUTHOR_MERGE: Record<number, number> = {
  1: 12, // 30year_1227 → ぐっさん
};

// ── 著者対応表 ────────────────────────────────────────────
export type AuthorEntry = {
  wpId: number; // 旧WordPressの著者番号
  displayName: string; // 公開ページに出る表示名（現行の表示名＝ペンネーム）
  loginName: string; // 旧ログイン名（参考）
  email: string; // メール（ログインID）
  role: 'admin' | 'author';
  seriesName: string; // 担当連載名（例: かきぬまめがね＠東京／度々の旅＞山陰編／（なし））
  language: string; // 使用言語（日本語／スペイン語）
  createAccount: boolean; // 新システムにアカウントを作るか（番号1は作らない）
};

export type AuthorMap = {
  entries: AuthorEntry[]; // アカウントを作る著者だけ
  byWpId: Map<number, AuthorEntry>; // wpId → アカウントを作る著者
};

function parseRole(raw: string): 'admin' | 'author' | null {
  const v = raw.trim();
  if (v === 'admin') return 'admin';
  if (v === 'author') return 'author';
  return null; // 「（アカウントは作らない）」などはここに来る
}

export function loadAuthorMap(): AuthorMap {
  const rows = parseCsv(readFileSync(join(MIGRATION_DIR, 'author-map.csv'), 'utf8'));
  const entries: AuthorEntry[] = [];
  const byWpId = new Map<number, AuthorEntry>();
  for (const r of rows.slice(1)) {
    const wpId = Number(r[0]?.trim());
    if (!Number.isInteger(wpId)) continue; // 見出し行や空行
    const role = parseRole(r[7] ?? '');
    if (role === null) continue; // アカウントを作らない著者（番号1）はスキップ
    const entry: AuthorEntry = {
      wpId,
      displayName: (r[1] ?? '').trim(), // 現行の表示名（ペンネーム）
      loginName: (r[2] ?? '').trim(),
      email: (r[3] ?? '').trim(),
      role,
      seriesName: (r[8] ?? '').trim(),
      language: (r[9] ?? '').trim(),
      createAccount: true,
    };
    entries.push(entry);
    byWpId.set(wpId, entry);
  }
  return { entries, byWpId };
}

// ── 連載対応表 ────────────────────────────────────────────
export type SeriesEntry = {
  wpTermId: number;
  name: string;
  slug: string;
  parentLabel: string; // 「（親なし）」「度々の旅(226)」など原文
  create: boolean; // 新システムで作るか（未分類は作らない）
};

export type SeriesMap = {
  entries: SeriesEntry[];
  byTermId: Map<number, SeriesEntry>;
  byName: Map<string, SeriesEntry>; // 連載名 → エントリ（担当連載名からの逆引き用）
};

export function loadSeriesMap(): SeriesMap {
  const rows = parseCsv(readFileSync(join(MIGRATION_DIR, 'series-map.csv'), 'utf8'));
  const entries: SeriesEntry[] = [];
  const byTermId = new Map<number, SeriesEntry>();
  const byName = new Map<string, SeriesEntry>();
  for (const r of rows.slice(1)) {
    const wpTermId = Number(r[0]?.trim());
    if (!Number.isInteger(wpTermId)) continue;
    const create = (r[7] ?? '').trim() !== '作らない';
    const entry: SeriesEntry = {
      wpTermId,
      name: (r[1] ?? '').trim(),
      slug: (r[2] ?? '').trim(),
      parentLabel: (r[3] ?? '').trim(),
      create,
    };
    entries.push(entry);
    byTermId.set(wpTermId, entry);
    byName.set(entry.name, entry);
  }
  return { entries, byTermId, byName };
}

// 担当連載名（「度々の旅＞山陰編」のような階層表記もありうる）→ 連載エントリ。
// 「＞」区切りのときは最後の要素（実際に記事が入る末端の連載）で引く。
export function resolveSeriesByLabel(
  label: string,
  series: SeriesMap,
): SeriesEntry | null {
  const name = label.split('＞').pop()?.trim() ?? '';
  if (!name || name === '（なし）') return null;
  return series.byName.get(name) ?? null;
}

// ── 記事の著者解決 ────────────────────────────────────────
// 戻り値: 解決後の著者番号（wpId）／ 'EXCLUDE'（移行しない）。
// 適用順: ①除外リスト → ②記事単位の上書き → ③番号の統合ルール → ④そのまま。
export function resolveArticleAuthorWpId(
  articleWpId: number,
  postAuthor: number,
): number | 'EXCLUDE' {
  if (EXCLUDED_ARTICLE_WP_IDS.has(articleWpId)) return 'EXCLUDE';
  if (articleWpId in ARTICLE_AUTHOR_OVERRIDES) return ARTICLE_AUTHOR_OVERRIDES[articleWpId];
  if (postAuthor in AUTHOR_MERGE) return AUTHOR_MERGE[postAuthor];
  return postAuthor;
}
