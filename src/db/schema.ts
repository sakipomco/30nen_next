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
  avatarPath: text('avatar_path'), // 顔写真（任意）
  bio: text('bio'), // 自己紹介（任意）
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  wpId: integer('wp_id'), // 旧WordPressのユーザーID（移行時の突き合わせ用）
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
  wpTermId: integer('wp_term_id'), // 旧WordPressのterm_id（移行用）
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
  wpId: integer('wp_id'), // 旧WordPressの記事ID（移行用の保険）
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
