# DBスキーマ設計（フェーズ2）

新システム（SQLite）のデータベース設計図。現行WordPressのサンプルデータ
（`reference/sample-posts/`）を確認して設計している。

最終更新: 2026-06-01

## サイトの性格（設計の前提）
- **20名以上の書き手が毎日投稿する日記サイト**。記事は日々増える（現状 約7,790件 → 1年で約+7,300件ペース）。
- DB選定への影響: 記事の件数増加は SQLite で全く問題なし（何万〜何十万件でも余裕）。注意点は「同時書き込み」だが、20名超が1日数回 保存する程度なら軽く、SQLite で十分。
- 将来、書き手が数百人規模で高頻度に同時書き込みする状況になれば MySQL/PostgreSQL への移行を検討（`articles.wp_id` を移行の保険として保持済み）。

---

## 用語メモ
- **スキーマ** … データベースの「設計図」（どんなデータをどんな形でしまうか）。語源はギリシャ語 skhēma＝形・骨組み。
- **テーブル** … データを入れる「表」。1行＝1件。
- **カラム** … 表の「列＝項目」。
- **主キー(PRIMARY KEY)** … 各行を区別する重複しない背番号。
- **外部キー(FOREIGN KEY)** … 別テーブルとひも付ける項目（例: 著者番号 → users）。
- SQLiteの型は主に **TEXT（文字）/ INTEGER（整数）**。日時もTEXTで `2026-05-31 13:51:57` 形式で持つのが定番。

---

## 実データ確認で分かったこと（サンプル10件）
- 記事の項目: `ID / post_title / post_content(HTML) / post_excerpt(ほぼ空) / post_author(数字ID) / post_date / post_status(publish|draft) / post_name(スラッグ・日本語URLエンコード)`
- 本文はHTML。使用タグはシンプル（span / img / p / a / hr / h1 / strong 程度）。
- **画像は絶対URL**で埋め込み（`src="https://30nen.com/wp-content/uploads/..."`）→ 移行時にパス書き換えが必要。
- 著者は数字ID → usersテーブルとひも付け。
- カテゴリは `parent` を持ち親子構造あり（度々の旅 > 山陰編）。
- 本番の公開記事は約7,790件（全件移行はフェーズ4）。

---

## ✅ 確定: 記事テーブル `articles`

**決定事項**
- 1記事につきカテゴリは**1つ**（`category_id` を1つ持つ。サンプルも全件1つ）。
- 本文は**HTMLで保存**（現行のまま移せTipTapでも読み書き可）。
- 公開状態は `draft`（下書き）/ `published`（公開）の2値に正規化（WPの `publish` → `published`）。

```sql
CREATE TABLE articles (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,  -- 記事の背番号
  title        TEXT    NOT NULL,                   -- タイトル
  slug         TEXT    UNIQUE,                      -- URL用の名札
  content      TEXT    NOT NULL DEFAULT '',         -- 本文（HTML）
  excerpt      TEXT,                                -- 抜粋（任意）
  status       TEXT    NOT NULL DEFAULT 'draft',    -- 'draft' / 'published'
  author_id    INTEGER,                             -- 著者 → users.id（紐付けは後）
  category_id  INTEGER,                             -- カテゴリ → categories.id（紐付けは後）
  published_at TEXT,                                -- 公開日時
  created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT    NOT NULL DEFAULT (datetime('now')),
  wp_id        INTEGER                              -- 旧WordPressのID（移行用の保険）
);
```

| カラム | 型 | 意味 | 元データ |
|---|---|---|---|
| id | INTEGER | 主キー（背番号） | 新規採番 |
| title | TEXT | タイトル | post_title |
| slug | TEXT | URL用の名札 | post_name |
| content | TEXT | 本文(HTML) | post_content |
| excerpt | TEXT | 抜粋（任意） | post_excerpt |
| status | TEXT | 公開状態 | post_status |
| author_id | INTEGER | 著者(→users) | post_author |
| category_id | INTEGER | カテゴリ(→categories) | カテゴリ |
| published_at | TEXT | 公開日時 | post_date |
| created_at | TEXT | 作成日時 | 自動 |
| updated_at | TEXT | 更新日時 | 自動 |
| wp_id | INTEGER | 旧WP記事ID | ID |

---

## TODO（次回以降）
- [ ] `users` テーブル設計（投稿者 約20名。ログインはメール＋パスワード/JWT。著者IDの対応付け）
- [ ] `categories` テーブル設計（親子構造。articles.category_id とのFOREIGN KEY）
- [ ] articles の author_id / category_id に FOREIGN KEY 制約を仕上げる
- [ ] SQLiteを扱う仕組み（ライブラリ選定: better-sqlite3 / Drizzle / Prisma 等）を決める
- [ ] 実際にDBを作るマイグレーション/SQLを用意
