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

## ✅ 確定: ユーザー（投稿者）テーブル `users`

**決定事項**
- 権限(role)は **2種類**: `admin`（管理者＝全記事・全ユーザーを管理。店主/SAKIさん）/ `author`（投稿者＝自分の記事だけ書ける）。
- **プロフィールを持つ**: 顔写真 `avatar_path` と自己紹介 `bio`（どちらも任意）。現行テーマに顔写真の仕組みがあったため。
- ログインIDは **email**（メール＋パスワード）。パスワードは**ハッシュ化して保存**（元に戻せない暗号化。漏洩しても本物は分からない）。

```sql
CREATE TABLE users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT    NOT NULL,                    -- 表示名（ペンネーム）
  email         TEXT    NOT NULL UNIQUE,             -- ログインID（重複不可）
  password_hash TEXT    NOT NULL,                    -- パスワード（ハッシュ化して保存）
  role          TEXT    NOT NULL DEFAULT 'author',   -- 'admin' / 'author'
  avatar_path   TEXT,                                -- 顔写真（任意）
  bio           TEXT,                                -- 自己紹介（任意）
  created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
  wp_id         INTEGER                              -- 旧WordPressのユーザーID（post_author 突き合わせ用）
);
```

---

## ✅ 確定: カテゴリ（連載）テーブル `categories`

**決定事項**
- 親子構造あり（`parent_id` が同じ表の親 id を指す。トップ階層は NULL）。例: 度々の旅 > 山陰編。
- `sort_order` で表示順を制御（任意）。

```sql
CREATE TABLE categories (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT    NOT NULL,                       -- カテゴリ名（連載名）
  slug        TEXT    UNIQUE,                          -- URL用の名札
  parent_id   INTEGER REFERENCES categories(id),      -- 親カテゴリ（トップはNULL）
  sort_order  INTEGER NOT NULL DEFAULT 0,             -- 並び順
  wp_term_id  INTEGER                                 -- 旧WordPressのterm_id（移行用）
);
```

---

## ✅ 確定: 連載×投稿者の担当テーブル `category_authors`（中間テーブル）

**決定事項**
- **主目的: 1連載＝複数担当**。1つの連載に複数の担当投稿者を正式に登録できる（例: 風早草子＝A・B・C）。逆に1人が複数連載をかけもちも同じ表で表せる。
- 用途: 連載ページで「書き手の顔ぶれ（名簿）」を表示／将来「担当者だけ投稿可」の権限制御にも使える／まだ記事がなくても担当登録できる。
- ※ 記事単位の著者は引き続き `articles.author_id`。この表は「連載の担当者名簿」で役割が別。

```sql
CREATE TABLE category_authors (
  category_id INTEGER NOT NULL REFERENCES categories(id),
  user_id     INTEGER NOT NULL REFERENCES users(id),
  sort_order  INTEGER NOT NULL DEFAULT 0,            -- 名簿の並び順（任意）
  PRIMARY KEY (category_id, user_id)                 -- 同じ組合せの重複登録を防ぐ
);
```

> 💡 **複合主キー(composite primary key)** … `category_id` と `user_id` の**組み合わせ**を主キーにする作り。
> 「同じ連載に同じ人を二重登録」できないよう、組合せ単位で重複を防ぎます。

---

## テーブル間の関係（FOREIGN KEY）

- `articles.author_id`         → `users.id`（記事を書いた人）
- `articles.category_id`       → `categories.id`（記事が属する連載）
- `categories.parent_id`       → `categories.id`（自己参照・親子）
- `category_authors.category_id` → `categories.id`（連載の担当名簿）
- `category_authors.user_id`     → `users.id`（連載の担当名簿）

> articles を実際に作るときは、末尾に次を足してFOREIGN KEYを仕上げる:
> ```sql
> FOREIGN KEY (author_id)   REFERENCES users(id),
> FOREIGN KEY (category_id) REFERENCES categories(id)
> ```
> （作成順は users / categories を先に、articles を後に。）

---

## TODO（次回以降）
- [x] `articles` テーブル設計
- [x] `users` テーブル設計（admin/author の2権限・プロフィール任意）
- [x] `categories` テーブル設計（親子構造）
- [x] `category_authors` テーブル設計（連載×投稿者の担当名簿・中間テーブル）
- [x] SQLiteを扱う仕組み（ライブラリ）を決める → **Drizzle ORM** を採用（+ better-sqlite3 / drizzle-kit）
- [x] 実際にDBを作るマイグレーション/SQLを用意 → 生成・実行済み（`data/30nen.db` に4テーブル作成）
- [ ] CRUD API → JWT認証 の実装へ

---

## ✅ 実装メモ（DBの作り方・2026-06-02）

設計図（このファイル）を **Drizzle ORM** でコード化し、実際のSQLite DBを作成済み。

- 設計図のコード版: `src/db/schema.ts`（このschema.mdと1対1で対応）
- DB接続口: `src/db/index.ts`（アプリからは `import { db } from '@/db'` で使う）
- DB実体: `data/30nen.db`（SQLiteファイル1個。中身が育つのでGit管理外。`.gitignore` 済み）
- マイグレーション（組み立て手順書）: `drizzle/` フォルダ（Git管理する）

### よく使うコマンド
- `npm run db:generate` … schema.ts を変更したら、差分のマイグレーションを生成
- `npm run db:migrate`  … 生成済みマイグレーションをDBに適用（テーブルを作る/変える）
- `npm run db:studio`   … ブラウザでDBの中身を見るGUI（drizzle studio）

> スキーマ（schema.md / schema.ts）を直したら **generate → migrate** の順で流すと、DBが設計図に追従する。
