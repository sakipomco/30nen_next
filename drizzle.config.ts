// drizzle-kit（マイグレーションを作る/流す道具）への設定。
// - schema: 設計図ファイルの場所
// - out:    生成されるマイグレーション（組み立て手順書）の出力先フォルダ
// - dbCredentials.url: 実際のSQLiteファイルの場所
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'sqlite',
  schema: './src/db/schema.ts',
  out: './drizzle',
  dbCredentials: {
    url: process.env.DATABASE_PATH ?? 'data/30nen.db',
  },
});
