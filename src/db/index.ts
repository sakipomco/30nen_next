// データベースへの接続口（このプロジェクトでDBを使うときは必ずここを import する）
// 使い方の例（サーバー側）:
//   import { db } from '@/db';
//   import { articles } from '@/db/schema';
//   const rows = await db.select().from(articles);

import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';

// SQLiteのデータベースは「ファイル1個」。場所は環境変数で差し替え可能（既定はプロジェクト直下の data/30nen.db）。
const dbPath = process.env.DATABASE_PATH ?? 'data/30nen.db';

const sqlite = new Database(dbPath);
sqlite.pragma('journal_mode = WAL'); // 読み書きの同時実行に強くする設定
sqlite.pragma('foreign_keys = ON'); // 外部キー（テーブル間のひも付け）の整合性チェックを有効化

export const db = drizzle(sqlite, { schema });
export { schema };
