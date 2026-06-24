// 記事移行スクリプト本体（S3）。WordPressの書き出し一式を読み、新システムのDBへ取り込む。
//
// 入力（1記事ごとに4ファイル。既定フォルダ = reference/sample-posts/posts）:
//   <ID>.json            … 記事本体（post_author/post_date/post_content/post_title/post_status/post_name…）
//   <ID>.categories.json … 連載（term_id ほか）
//   <ID>.author_id.txt   … 著者番号（post_author と同じはず・保険）
//   <ID>.imagelist.txt   … 本文で使う画像の相対パス一覧
//
// 仕様（data-migration-plan.md §2）:
//   - wp_id で重複チェック → すでにある記事は飛ばす（冪等／何度流してもOK）
//   - 著者は author-map、連載は series-map（DBの wp_id / wp_term_id 経由）でひもづけ
//   - 記事単位の特例: ID282=除外／ID24126=Luisへ（maps.ts）
//   - dry-run（お試し）モード … DBに書かず件数だけ出す
//   - エラーは記事本体／画像で分けて記録
//   - 件数照合レポートを最後に出す
//   - 画像は本文URLを /uploads/ に書き換え、ファイルは public/uploads/ へ配置（S5）
//     既定は「サンプル画像フォルダからのコピー」。--download で本番URLから取得。
//
// 実行（お試し）:
//   DATABASE_PATH=data/migrate-test.db node --env-file=.env.local --import tsx scripts/migrate-articles.ts --dry-run
// 実行（本当に取り込む・画像はサンプルからコピー）:
//   DATABASE_PATH=data/migrate-test.db node --env-file=.env.local --import tsx scripts/migrate-articles.ts

import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { eq } from 'drizzle-orm';
import { db } from '../src/db/index';
import { users, categories, articles } from '../src/db/schema';
import { resolveArticleAuthorWpId } from '../migration/lib/maps';
import {
  transformContent,
  wpDateToUtc,
  wpStatusToStatus,
  normalizeSlug,
} from '../migration/lib/transform';
import { shrinkImage, mimeFromExtension } from '../src/lib/image';

const PROJECT_ROOT = resolve(dirname(new URL(import.meta.url).pathname), '..');

const DRY_RUN = process.argv.includes('--dry-run');
const DOWNLOAD = process.argv.includes('--download'); // 本番URLから画像取得（既定はサンプルコピー）
// 入力フォルダ（--posts <dir> で差し替え可・既定はサンプル）
const postsArgIdx = process.argv.indexOf('--posts');
const POSTS_DIR =
  postsArgIdx >= 0 && process.argv[postsArgIdx + 1]
    ? resolve(process.argv[postsArgIdx + 1])
    : join(PROJECT_ROOT, 'reference/sample-posts/posts');
const SAMPLE_IMAGES_DIR = join(PROJECT_ROOT, 'reference/sample-posts/images');
const UPLOADS_DIR = join(PROJECT_ROOT, 'public/uploads');

// PHPの警告などで先頭にゴミが付くことがあるので、最初の { または [ から読む。
function parseJsonLoose<T>(text: string): T {
  const i = text.search(/[[{]/);
  return JSON.parse(i >= 0 ? text.slice(i) : text) as T;
}

type WpPost = {
  ID: number;
  post_author: string;
  post_date: string;
  post_content: string;
  post_title: string;
  post_excerpt: string;
  post_status: string;
  post_name: string;
};
type WpCategory = { term_id: number; name: string; slug: string; parent: number };

type Report = {
  input: number;
  imported: number;
  skippedExisting: number;
  excluded: number;
  articleErrors: { wpId: number; reason: string }[];
  imageErrors: { wpId: number; path: string; reason: string }[];
  imagesPlaced: number;
};

// 本文画像1枚を public/uploads/<相対パス> へ配置する。
//  - 既定（サンプル）: reference/sample-posts/images/<パスの / を _ にした名前> を読む
//  - --download: https://30nen.com/wp-content/uploads/<相対パス> から取得
// どちらの場合も、新規投稿と同じ基準で「軽く」してから保存する（長辺1600px・圧縮）。
//   → 30年運用の前提で容量を抑える方針（data-migration-plan.md S5「軽くして運ぶ」）。
//   GIF（アニメ）と対応外の拡張子は無加工でそのまま保存。
async function placeImage(relPath: string): Promise<{ ok: boolean; reason?: string }> {
  const dest = join(UPLOADS_DIR, relPath);
  if (existsSync(dest)) return { ok: true }; // すでにある（冪等）
  mkdirSync(dirname(dest), { recursive: true });
  try {
    // ① 元データをメモリに読む（取得元はダウンロード or サンプル）
    let raw: Buffer;
    if (DOWNLOAD) {
      const url = `https://30nen.com/wp-content/uploads/${relPath}`;
      const res = await fetch(url);
      if (!res.ok) return { ok: false, reason: `HTTP ${res.status} ${url}` };
      raw = Buffer.from(await res.arrayBuffer());
    } else {
      const src = join(SAMPLE_IMAGES_DIR, relPath.replace(/\//g, '_'));
      if (!existsSync(src)) return { ok: false, reason: `サンプル画像なし: ${src}` };
      raw = readFileSync(src);
    }

    // ② 軽くする（投稿時と同じ shrinkImage）。種類が分かるものだけ縮小し、
    //    壊れた画像などで失敗したら原本のまま保存して画像欠けを防ぐ。
    const mime = mimeFromExtension(relPath);
    let bytes = raw;
    if (mime) {
      try {
        bytes = await shrinkImage(raw, mime);
      } catch {
        bytes = raw; // 縮小に失敗しても原本を残す（移行を止めない）
      }
    }

    writeFileSync(dest, bytes);
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: String(e) };
  }
}

async function migrateOne(idBase: string, report: Report): Promise<void> {
  const post = parseJsonLoose<WpPost>(readFileSync(join(POSTS_DIR, `${idBase}.json`), 'utf8'));
  const wpId = post.ID;
  const postAuthor = Number(post.post_author);

  // ① 著者解決（除外／特例／統合）
  const resolvedAuthor = resolveArticleAuthorWpId(wpId, postAuthor);
  if (resolvedAuthor === 'EXCLUDE') {
    report.excluded++;
    return;
  }

  // ② すでに取り込み済みなら飛ばす（冪等）
  const existing = db.select().from(articles).where(eq(articles.wpId, wpId)).get();
  if (existing) {
    report.skippedExisting++;
    return;
  }

  // ③ 著者番号 → users.id
  const author = db.select().from(users).where(eq(users.wpId, resolvedAuthor)).get();
  if (!author) {
    report.articleErrors.push({
      wpId,
      reason: `著者が見つからない（wp著者番号 ${resolvedAuthor}）。先にユーザー同期が必要`,
    });
    return;
  }

  // ④ 連載 term_id → categories.id（1記事1連載＝先頭を採用）
  const catsPath = join(POSTS_DIR, `${idBase}.categories.json`);
  const cats = existsSync(catsPath)
    ? parseJsonLoose<WpCategory[]>(readFileSync(catsPath, 'utf8'))
    : [];
  if (cats.length === 0) {
    report.articleErrors.push({ wpId, reason: '連載(カテゴリ)が無い' });
    return;
  }
  const termId = cats[0].term_id;
  const category = db.select().from(categories).where(eq(categories.wpTermId, termId)).get();
  if (!category) {
    report.articleErrors.push({
      wpId,
      reason: `連載が見つからない（wp_term_id ${termId} / ${cats[0].name}）`,
    });
    return;
  }

  // ⑤ 変換
  const content = transformContent(post.post_content);
  const publishedAtUtc = wpDateToUtc(post.post_date);
  const status = wpStatusToStatus(post.post_status);
  const slug = normalizeSlug(post.post_name);
  const title = (post.post_title ?? '').trim() || '（無題）';
  const excerpt = (post.post_excerpt ?? '').trim() || null;

  // ⑥ 画像の配置（dry-runでは数えるだけ）
  const imgListPath = join(POSTS_DIR, `${idBase}.imagelist.txt`);
  const imagePaths = existsSync(imgListPath)
    ? readFileSync(imgListPath, 'utf8').split('\n').map((s) => s.trim()).filter(Boolean)
    : [];
  if (!DRY_RUN) {
    for (const rel of imagePaths) {
      const r = await placeImage(rel);
      if (r.ok) report.imagesPlaced++;
      else report.imageErrors.push({ wpId, path: rel, reason: r.reason ?? '不明' });
    }
  }

  // ⑦ 取り込み
  if (DRY_RUN) {
    report.imported++;
    return;
  }
  db.insert(articles)
    .values({
      title,
      slug: slug || null,
      content,
      excerpt,
      status,
      authorId: author.id,
      categoryId: category.id,
      publishedAt: status === 'published' ? publishedAtUtc || null : null,
      wpId,
    })
    .run();
  report.imported++;
}

export async function migrateArticles(): Promise<Report> {
  // 入力フォルダから記事本体ファイル（<ID>.json・categoriesは除く）を集める
  const idBases = readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith('.json') && !f.endsWith('.categories.json'))
    .map((f) => f.replace(/\.json$/, ''));

  const report: Report = {
    input: idBases.length,
    imported: 0,
    skippedExisting: 0,
    excluded: 0,
    articleErrors: [],
    imageErrors: [],
    imagesPlaced: 0,
  };

  for (const idBase of idBases) {
    try {
      await migrateOne(idBase, report);
    } catch (e) {
      report.articleErrors.push({ wpId: Number(idBase) || -1, reason: String(e) });
    }
  }
  return report;
}

function printReport(r: Report) {
  console.log('');
  console.log('──────── 件数照合レポート ────────');
  console.log(`  入力ファイル数:        ${r.input}`);
  console.log(`  取り込み:              ${r.imported}`);
  console.log(`  既存スキップ(冪等):    ${r.skippedExisting}`);
  console.log(`  除外(特例):            ${r.excluded}`);
  console.log(`  記事エラー:            ${r.articleErrors.length}`);
  console.log(`  画像 配置:             ${r.imagesPlaced}`);
  console.log(`  画像 エラー:           ${r.imageErrors.length}`);
  const accounted = r.imported + r.skippedExisting + r.excluded + r.articleErrors.length;
  console.log(`  照合: 入力 ${r.input} = 取込+スキップ+除外+エラー ${accounted} … ${r.input === accounted ? 'OK ✅' : 'ズレあり ⚠'}`);
  if (r.articleErrors.length) {
    console.log('  ▼ 記事エラー詳細');
    for (const e of r.articleErrors) console.log(`     wpId=${e.wpId}: ${e.reason}`);
  }
  if (r.imageErrors.length) {
    console.log('  ▼ 画像エラー詳細（記事本体とは別。後追いで直せる）');
    for (const e of r.imageErrors) console.log(`     wpId=${e.wpId} ${e.path}: ${e.reason}`);
  }
  console.log('────────────────────────────────');
}

async function main() {
  console.log(`【記事移行】${DRY_RUN ? 'お試し(dry-run・DBに書きません)' : '本実行'}`);
  console.log(`  入力フォルダ: ${POSTS_DIR}`);
  console.log(`  画像取得: ${DOWNLOAD ? '本番URLからダウンロード' : 'サンプル画像からコピー'}`);
  const report = await migrateArticles();
  printReport(report);
}

if (process.argv[1] && process.argv[1].endsWith('migrate-articles.ts')) {
  main();
}
