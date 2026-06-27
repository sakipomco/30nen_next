// DBスキーマ（設計図 docs/schema.md をコード化したもの）
// このファイルから drizzle-kit が「実際のテーブルを作る手順（マイグレーション）」を自動生成します。
// DBのカラム名は snake_case（例: author_id）、コード側のプロパティは camelCase（例: authorId）。

import { sql } from 'drizzle-orm';
import {
  sqliteTable,
  integer,
  text,
  primaryKey,
  type AnySQLiteColumn,
} from 'drizzle-orm/sqlite-core';

// ── 投稿者 ───────────────────────────────────────────────
// 権限は admin（管理者）/ author（投稿者）の2種類。ログインは email＋パスワード（ハッシュ保存）。
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(), // 表示名（ペンネーム）
  email: text('email').notNull().unique(), // ログインID（重複不可）
  passwordHash: text('password_hash').notNull(), // パスワード（ハッシュ化して保存）
  role: text('role', { enum: ['admin', 'author'] }).notNull().default('author'),
  locale: text('locale', { enum: ['ja', 'es'] }).notNull().default('ja'),
  avatarPath: text('avatar_path'), // 顔写真（任意）
  bio: text('bio'), // 自己紹介（任意）
  location: text('location'), // 居住地（例: 神奈川県藤沢市・任意）
  birthday: text('birthday'), // 誕生日（任意・'YYYY-MM-DD'）。年齢は表示時に自動計算する（手入力の年齢はやめた）。
  instagramUrl: text('instagram_url'), // Instagram URL（任意）
  xUrl: text('x_url'), // X(旧Twitter) URL（任意）
  youtubeUrl: text('youtube_url'), // YouTube URL（任意）
  websiteUrl: text('website_url'), // Webサイト URL（任意）
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  wpId: integer('wp_id').unique(), // 旧WordPressのユーザーID（移行時の突き合わせ用・二重取り込み防止の一意制約。新規ユーザーは NULL＝SQLiteでは複数OK）
});

// ── カテゴリ（連載）─────────────────────────────────────────
// 親子構造あり（parent_id が同じ表の親 id を指す。トップ階層は NULL）。
export const categories = sqliteTable('categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(), // カテゴリ名（連載名）
  slug: text('slug').unique(), // URL用の名札
  parentId: integer('parent_id').references((): AnySQLiteColumn => categories.id), // 親（トップはNULL・自己参照）
  sortOrder: integer('sort_order').notNull().default(0), // 並び順
  imagePath: text('image_path'), // 連載のイメージ画像パス（任意・右サイドバー「小商店」に表示）
  reading: text('reading'), // ヨミガナ（カタカナ・任意・記事ページのカテゴリー帯に表示）
  wpTermId: integer('wp_term_id').unique(), // 旧WordPressのterm_id（移行用・二重作成防止の一意制約。新規連載は NULL＝SQLiteでは複数OK）
});

// ── 記事 ─────────────────────────────────────────────────
// 1記事につきカテゴリは1つ。本文はHTMLで保存。公開状態は draft / published の2値。
export const articles = sqliteTable('articles', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(), // タイトル
  slug: text('slug').unique(), // URL用の名札
  content: text('content').notNull().default(''), // 本文（HTML）
  excerpt: text('excerpt'), // 抜粋（任意）
  featuredImagePath: text('featured_image_path'), // アイキャッチ画像のパス（任意・例: /uploads/2026/06/xxx.jpg）
  status: text('status', { enum: ['draft', 'published'] }).notNull().default('draft'),
  authorId: integer('author_id').references(() => users.id), // 著者 → users.id
  categoryId: integer('category_id').references(() => categories.id), // カテゴリ → categories.id
  publishedAt: text('published_at'), // 公開日時
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
  wpId: integer('wp_id').unique(), // 旧WordPressの記事ID（移行用の保険・二重取り込み防止の一意制約。新規記事は NULL＝SQLiteでは複数OK）
});

// ── サイト設定（キーと値の組）─────────────────────────────────
// トップページのリードテキストなど、管理画面から編集できる「自由テキスト」を保存する場所。
// 1行＝1設定（key が名札・value が中身）。将来ほかの編集可能テキストもここに足せる。
export const siteSettings = sqliteTable('site_settings', {
  key: text('key').primaryKey(), // 設定の名札（例: 'lead_text'）
  value: text('value').notNull().default(''), // 設定の中身（テキスト）
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
});

// ── アップロード画像の記録 ─────────────────────────────────
// 「どの写真を・誰が・いつ」上げたかを残す台帳。画像フォルダ一覧で
// 「自分の写真だけ削除できる」を実現するために使う（持ち主の判定）。
// 実ファイルは public/uploads/ に保存（Git管理外）。ここはその“ふせん”。
// 過去に上げた写真は記録が無い＝持ち主不明（その場合は管理者だけ削除可）。
export const uploads = sqliteTable('uploads', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  path: text('path').notNull().unique(), // 公開URL（例: /uploads/2026/06/xxxx.jpg）。重複防止に一意。
  uploadedBy: integer('uploaded_by').references(() => users.id), // 上げた人（users.id）
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
});

// ── 招待・パスワードリセット用のトークン ──────────────────────
// アカウント作成時の招待メール（type='invite'）と、
// パスワード忘れのリセットメール（type='reset'）で共用する使い捨てリンクの管理表。
// raw token（64文字のランダム文字列）はURLに埋め込み、DBにはSHA-256ハッシュだけ保存する。
export const authTokens = sqliteTable('auth_tokens', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull().unique(), // SHA-256(raw token)
  type: text('type', { enum: ['invite', 'reset'] }).notNull(),
  expiresAt: text('expires_at').notNull(), // UTC datetime
  usedAt: text('used_at'), // null=未使用
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
});

// ── 連載×投稿者の担当名簿（中間テーブル）─────────────────────
// 1連載＝複数担当を表す。複合主キー（category_id, user_id）で同じ組合せの二重登録を防ぐ。
export const categoryAuthors = sqliteTable(
  'category_authors',
  {
    categoryId: integer('category_id')
      .notNull()
      .references(() => categories.id),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    sortOrder: integer('sort_order').notNull().default(0), // 名簿の並び順（任意）
  },
  (table) => [primaryKey({ columns: [table.categoryId, table.userId] })],
);
