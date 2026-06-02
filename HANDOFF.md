# 引き継ぎドキュメント（30nen_next）

> このファイルは、`30nen_next` フォルダで作業を始める際に最初に読む引き継ぎ資料です。
> 新しい Claude Code セッションを **このフォルダ（`~/Desktop/30nen_next`）で起動** し、
> 「HANDOFF.md を読んで」と伝えれば、ここまでの経緯を引き継げます。

最終更新: 2026-06-02（フェーズ2：記事CRUD→JWT認証（ログイン）の土台まで完了）

---

## 0. このプロジェクトは何か

30nen.com を **WordPress から自前システムへ移行** するための新規プロジェクト。
現行の WordPress サイト（`~/Desktop/30nen_pj`）は **一切触らず温存** し、
本プロジェクトは別リポジトリとしてクリーンな履歴で構築する（移行方針＝「B：新規リポジトリ」）。

### サイトの性格（設計の前提）
- **20名以上の書き手が毎日投稿している日記サイト**。記事は日々どんどん増える（現状 約7,790件）。
- ただし「同時書き込み」は軽い（各人が1日数回 投稿ボタンを押す程度）→ SQLite で十分余裕。記事件数の増加も問題なし。将来 数百人規模の高頻度同時書き込みになれば MySQL/PostgreSQL 等へ移行を検討（articles.wp_id を保険として保持）。

### なぜ移行するか（ゴール）
- 管理・運用の手間を減らす
- **20名以上**の投稿者（ITリテラシー低め）が使いやすい **シンプルな投稿画面** を実現
- 月額 SaaS 費用ゼロ（サーバー代のみ）
- 既存記事を **全件移行**

---

## 1. ここまでにやったこと（2026-06-01時点）

1. 移行方針を検討し、**B（新規リポジトリ）** を採用。
   - A（GitHubフォーク）は履歴に巨大な削除差分が残り、技術スタックも別物なので不採用。
   - 共有したいのは「①記事データ ②デザイン(CSS) ③画像」だけなので、参照用に選択コピーする方針。
2. `~/Desktop/30nen_next` を作成し、`git init`（main ブランチ・履歴クリーン）。
3. `README.md` と `.gitignore` を作成し、初回コミット済み（`8e8b29f`）。
4. **Node.js を導入**（nvm 経由・node v24.16.0 / npm 11.13.0）。`~/.zprofile` に nvm 読み込み追記済み。
5. **Next.js 雛形を作成**（`create-next-app` / Next 16.2.6 + React 19 + TypeScript + App Router + Tailwind + ESLint + `src/`）。dev サーバー起動・HTTP 200 を確認済み（コミット `7036bad`）。
6. **GitHub に新リポジトリを作成して push**：`sakipomco/30nen_next`（Private）。SSH 鍵 `~/.ssh/30nen_github` で認証（`origin` 追跡済み）。
7. **フェーズ1（サンプル取得）＋参照物の持ち込み**を実施（コミット `6315ff3`）。本番 30nen.com から **読み取りのみ** で取得：
   - `reference/sample-posts/` … 種類を散らしたサンプル記事10件（JSON＋使用画像17枚）。詳細は同フォルダの README 参照。
   - `reference/theme/30nen_original/` … 現行の独自テーマ一式（CSS・テンプレ・デザイン素材）＋デザインメモ（フォント「Zen Old Mincho」、色 `#333`/`#150c0c` 等）。
   - `reference/categories.json` … カテゴリ全体構造（22件・親子: 度々の旅 > 山陰編。※この階層の記事は現状0件）。
   - 本番の公開記事は **約7,790件**（全件移行はフェーズ4）。著者は WordPress の user ID で保持（表示名対応は後工程・ユーザー情報の取り扱いは要確認）。
8. **フェーズ2：DBスキーマ設計が完成**（`docs/schema.md` に全テーブル記録）。
   - 実データ確認: 本文はHTML（タグはシンプル）、画像は絶対URL埋め込み（移行時にパス書き換えが必要）、著者は数字ID。
   - 確定した4テーブル:
     - `articles`（記事）… 1記事1カテゴリ／本文はHTML保存／status は `draft`・`published`。
     - `users`（投稿者）… 権限2種（`admin`/`author`）、プロフィール（顔写真 `avatar_path`・自己紹介 `bio`）は任意、ログインは email＋パスワード（ハッシュ化保存）。
     - `categories`（連載）… 親子構造（`parent_id` 自己参照）＋並び順。
     - `category_authors`（中間テーブル）… **1連載＝複数担当**を表す担当名簿（複合主キー）。
   - FOREIGN KEY 関係も整理済み。テーブル作成順: users → categories → category_authors → articles。
9. **フェーズ2：DBライブラリ選定〜実DB作成が完了**（コミット `（このコミット）`）。
   - **ライブラリは Drizzle ORM を採用**（+ better-sqlite3 / drizzle-kit）。理由＝設計図をほぼそのままコード化でき、打ち間違いに強く、軽くてXサーバーにそのまま載るため。
   - 設計図(`docs/schema.md`)を `src/db/schema.ts` にコード化。DB接続口 `src/db/index.ts`（アプリからは `import { db } from '@/db'`）。
   - マイグレーション生成＆実行済み → **`data/30nen.db`（SQLiteファイル）に4テーブル作成完了**。列・デフォルト値・外部キー・複合主キーが設計どおりであることを確認済み。
   - コマンド: `npm run db:generate`（差分マイグレーション生成）/ `npm run db:migrate`（適用）/ `npm run db:studio`（GUI閲覧）。
   - DB実体(`data/*.db`)はGit管理外（`.gitignore`済み）。マイグレーション(`drizzle/`)はGit管理する。
10. **フェーズ2：記事(articles)のCRUD APIが完成**（コミット `（このコミット）`）。
    - データアクセス層 `src/db/articles.ts` … 記事の読み書き窓口を1か所に集約。
      - Create: `createArticle`（公開なら公開日時を自動セット）
      - Read: `listArticles`（status絞り込み・新しい順）/ `getArticleById` / `getArticleBySlug`
      - Update: `updateArticle`（渡した項目だけ更新・updated_at自動更新・下書き→公開で公開日時を補完）
      - Delete: `deleteArticle`
    - 型は schema から自動生成（`$inferSelect`）。設計を変えても型がズレない。
    - 動作確認: `scripts/smoke-articles.ts`（`npx tsx scripts/smoke-articles.ts`）で C/R/U/D 全通過を確認。型チェック(tsc)・Lint(eslint)もクリーン。
    - メモ: 日時はUTC保存（DB既定の `datetime('now')` と揃えた）。日本時間への変換は表示を作るときに行う。
11. **フェーズ2：JWT認証（ログイン）の土台が完成**（コミット `（このコミット）`）。
    - **JWT＝署名付きの「会員証」トークン**。中身（userId・role）＋サーバーだけが作れる署名のセット。Cookieに保存し、毎回サーバーで本物か検証する。
    - 技術選定: 署名は **`jose`**（Next.js公式推奨・純JS・Xサーバーにそのまま載る）。パスワードのハッシュ化は **Node標準の `crypto.scrypt`**（追加ライブラリ不要・OWASP推奨方式）。`jose` を `npm install` 済み。
    - 作成ファイル:
      - `src/auth/password.ts` … パスワードのハッシュ化(`hashPassword`)と照合(`verifyPassword`)。生パスワードはDBに保存しない。
      - `src/auth/jwt.ts` … JWTの発行(`signSession`)と検証(`verifySession`)。有効期限7日。秘密鍵は環境変数 `SESSION_SECRET`。
      - `src/auth/session.ts` … 会員証をCookieに保存/削除(`createSession`/`deleteSession`)・読み出し(`getSession`)・今ログイン中のユーザー取得(`getCurrentUser`)。
      - `src/db/users.ts` … 投稿者のデータ層（`createUser`/`getUserByEmail`/`getUserById`/`verifyCredentials`/`deleteUser`）。`passwordHash` を除いた公開用 `PublicUser` を返す。
      - `src/app/actions/auth.ts` … Server Action の `login`（成功で `/admin` へ）/`logout`（`/login` へ）。
    - 環境変数: `.env.local`（Git管理外）に `SESSION_SECRET` を生成済み。見本は `.env.example`（Git管理）。秘密鍵は `openssl rand -base64 32` で生成。
    - 動作確認: `node --env-file=.env.local --import tsx scripts/smoke-auth.ts` で 登録→照合→JWT→改ざん検知→削除 まで全通過。型チェック(tsc)・Lint(eslint)もクリーン。
12. **フェーズ2：ログイン画面・投稿管理画面のUIが完成（ブラウザで動作確認済み）**（コミット `（このコミット）`）。
    - 作成ファイル:
      - `src/app/login/page.tsx` … ログインページ（`/login`）。ログイン済みなら `/admin` へ自動転送。
      - `src/app/login/login-form.tsx` … 入力フォーム（Client Component・`useActionState` で「処理中…」表示やエラー表示）。
      - `src/app/admin/page.tsx` … 投稿管理画面（`/admin`）。`getCurrentUser` でログイン確認し、未ログインなら `/login` へ転送（ルート保護）。ログアウトボタン付き。
    - ブラウザ確認済み（プレビュー機能）: ①ログイン画面表示 → ②誤パスワードでエラー表示 → ③正パスワードでログイン成功→`/admin`へ → ④未ログインで`/admin`は`/login`へ転送 → ⑤ログアウトでCookie削除→`/login`へ、を全通過。
    - ユーザー作成ツール: `scripts/create-user.ts`（管理画面でのユーザー管理ができるまでの暫定）。実行例:
      `NAME="名前" EMAIL="me@example.com" PASSWORD="ひみつ" ROLE=admin node --env-file=.env.local --import tsx scripts/create-user.ts`
    - 動作確認用のテスト管理者を1件登録済み（`test@example.com` / `Test1234!`・role=admin）。※ローカルDBのみ（`data/*.db`はGit管理外）。本番運用前に削除し、本物のアカウントを作る想定。
13. **フェーズ2：投稿UI（記事の作成・編集・削除）が完成（ブラウザで動作確認済み）**（コミット `（このコミット）`）。
    - 作成ファイル:
      - `src/app/actions/articles.ts` … 記事の Server Action（`createArticleAction`/`updateArticleAction`/`deleteArticleAction`）。全て先頭で `requireUser()` を呼びログイン必須。「下書き保存」=draft・「投稿する」=published（ボタンの `intent` 値で判定）。
      - `src/app/admin/article-form.tsx` … 記事入力フォーム（新規・編集で共用）。タイトル＋本文（今は textarea）＋2ボタン。`useActionState` でエラー表示。
      - `src/app/admin/page.tsx` … 記事一覧（新しい順）。状態バッジ（公開/下書き）・更新日時（日本時間表示）・編集リンク・削除ボタン・「新規作成」リンク。
      - `src/app/admin/new/page.tsx` … 新規作成ページ。
      - `src/app/admin/articles/[id]/edit/page.tsx` … 編集ページ（`params` は Next 16 では非同期＝`await params`）。
    - 認証ヘルパー追加: `src/auth/session.ts` に `requireUser()`（未ログインなら `/login` へ）。管理ページ・記事Actionの保護に使用。
    - ブラウザ確認済み: 新規作成（公開）→一覧反映→編集（タイトル変更＋下書き化）→削除、を全通過。未ログインでは `/admin`・`/admin/new`・編集ページすべて `/login` へ転送。
14. **フェーズ2：本文エディタを TipTap（リッチエディタ）に差し替え（ブラウザで動作確認済み）**（コミット `（このコミット）`）。
    - 導入ライブラリ: `@tiptap/react` `@tiptap/starter-kit` `@tiptap/pm`（いずれも v3）。React 19 と相性OK・追加のnativeビルド不要。
    - 作成ファイル: `src/app/admin/rich-editor.tsx` … TipTapエディタ部品。簡単なツールバー（太字・斜体・見出し・箇条書き・番号付き・引用）。本文HTMLを見えない入力欄(hidden input)に同期させ、既存の `content` 項目としてフォーム送信に乗せる。
    - `src/app/admin/article-form.tsx` の本文欄を textarea → `<RichEditor>` に差し替え。
    - `src/app/globals.css` にエディタ内の見た目（見出し・箇条書き等。Tailwindのリセットを編集エリア内だけ復活）を追加。
    - App Router 対策: `useEditor({ immediatelyRender: false })`（サーバー描画とのズレ＝hydrationエラー防止）。
    - ブラウザ確認済み: 文章入力→見出し書式→「投稿する」で保存→一覧反映→編集ページで本文HTML(`<h2>…`)が正しく復元、までの往復を確認。
    - メモ: StarterKit v3 には Placeholder は含まれない（空欄の案内文は未実装）。本文は引き続き HTML で保存。
    - 未着手: **画像アップロード**（本文への画像挿入）、users/categories のCRUD（カテゴリ選択UI）、公開ページ、Xサーバーへのデプロイ設定。

### 現在のフォルダ状態
```
~/Desktop/
├── 30nen_pj/      ← 現行WordPress（本番稼働中・移行元・温存。触らない）
└── 30nen_next/    ← ★このプロジェクト（新システム / GitHub: sakipomco/30nen_next・Private）
    ├── .git/
    ├── src/app/       ← Next.js App Router（雛形）
    ├── reference/     ← 現行WPからの参照物（sample-posts / theme / categories.json）
    ├── public/ , package.json , tsconfig.json , next.config.ts ほか
    ├── README.md
    ├── .gitignore
    └── HANDOFF.md  ← このファイル
```

### サーバー接続メモ（読み取りのみで使用）
- SSH: `ssh xserver-30nen`（`~/.ssh/config` に設定済み・鍵 `~/.ssh/30nen_xserver`）
- WordPress 本番: `/home/the30nen/30nen.com/public_html`
- WP-CLI は `php7.4 /usr/bin/wp ...` の形で実行（既定の php は 5.4 で古く WP を解釈できない）

---

## 2. 技術スタック（採用済み）

| 役割 | 技術 |
|------|------|
| 公開サイト・投稿UI | Next.js (App Router) |
| リッチテキストエディタ | TipTap（OSS・無料） |
| データベース | SQLite（Xサーバー上） |
| 認証 | JWT（メール＋パスワード） |
| ホスティング | Xサーバー（Nginx + PM2） |

### 投稿UIのイメージ（投稿者向け・シンプル最優先）
ブラウザで開くと表示されるのは次の3点のみ：
1. タイトル入力欄
2. 本文（TipTapエディタ：Googleドキュメントに近い操作感）
3. 画像アップロード

ボタンは「**下書き保存**」「**投稿する**」の2つだけ。

---

## 3. ✅ 開発環境（導入済み）

- **Node.js 導入済み**（nvm 経由・node v24.16.0 / npm 11.13.0）。新しいターミナルでは `~/.zprofile` で自動有効。
  - もし `node: command not found` が出たら: `export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use default`
- 確認コマンド: `node -v` / `npm -v`
- 開発サーバー起動: `npm run dev`（http://localhost:3000）
  - ※ 起動前に必ず nvm 経由の node を有効化しておく（上記コマンド）。Tailwind/PostCSS が内部で `node` を呼ぶため、PATH に node が無いと起動時にエラーになる。

---

## 4. 次のステップ（おすすめ順）

ステップ1〜4（環境構築〜参照物の持ち込み）は **完了済み**。次はフェーズ2（新システム構築）へ。

1. ~~Node.js をインストール~~ … ✅ 完了
2. ~~Next.js 雛形を作成~~ … ✅ 完了（`7036bad`）
3. ~~GitHub に新リポジトリ作成 → push~~ … ✅ 完了（`sakipomco/30nen_next`・Private）
4. ~~`reference/` に現行の参照物を持ち込む~~ … ✅ 完了（`6315ff3`）
5. DBスキーマ設計 … ✅ 完成（4テーブル確定。設計は `docs/schema.md`）
6. SQLiteライブラリ選定＋実DB作成 … ✅ 完了（**Drizzle ORM** 採用・`data/30nen.db` に4テーブル作成）
7. 記事(articles)のCRUD API … ✅ 完了（`src/db/articles.ts`・動作確認済み）
8. JWT認証（ログイン）の土台 … ✅ 完了（`src/auth/*`・`src/db/users.ts`・`src/app/actions/auth.ts`・動作確認済み）
9. ログイン画面・投稿管理画面のUI … ✅ 完了（`/login`・`/admin`・ルート保護・ブラウザ動作確認済み）
10. 投稿UI（記事の作成・編集・削除） … ✅ 完了（`/admin/new`・`/admin/articles/[id]/edit`・ブラウザ動作確認済み）
11. 本文エディタ TipTap（リッチエディタ） … ✅ 完了（`src/app/admin/rich-editor.tsx`・ブラウザ動作確認済み）
    - **▶ 次：画像アップロード**（本文への画像挿入。投稿UIの3点目）。
    - あわせて **カテゴリ（連載）選択UI** と users/categories のCRUD。
    - その後: 公開ページ（reference/theme を手本に Tailwind でデザイン移植）→ Xサーバーへのデプロイ設定。

---

## 5. 移行フェーズ全体像

### フェーズ1：サンプルデータのエクスポート（Claude Code担当）
- XサーバーにSSH接続
- MySQLから `wp_posts`・`wp_postmeta`・`wp_users` の **サンプル数件** をJSON出力
- `wp-content/uploads` からサンプル画像を取得

### フェーズ2：新システム構築
- **Claude Code担当：** DBスキーマ設計（記事・ユーザー・カテゴリ）／CRUD API／JWT認証／Xサーバーへのデプロイ設定（Nginx + PM2）
- **SAKIさん × Claude担当：** 投稿UI（タイトル・本文・画像・カテゴリ・下書き/公開）／公開サイトのデザイン・レイアウト

### フェーズ3：動作確認・調整
- サンプルデータで表示・投稿・編集・削除を確認
- 投稿者向けUIの使いやすさを調整

### フェーズ4：全記事の本番移行（Claude Code担当）
- WordPressの全記事・画像を一括エクスポート
- 新DBへのインポートスクリプト実行
- 画像パスの書き換えを自動処理

### フェーズ5：本番切り替え
- 新サイトをXサーバーにデプロイ
- ドメイン（30nen.com）を新サイトへ向ける
- WordPress停止

> ※ フェーズ1〜3完了・動作確認後にフェーズ4を実施。移行完了までWordPressは並行稼働。

---

## 6. 役割分担

| 作業 | 担当 |
|------|------|
| DBスキーマ・API・認証・デプロイ | Claude Code |
| データエクスポート・移行スクリプト | Claude Code |
| 投稿UI・公開サイトデザイン | SAKIさん × Claude |

---

## 7. 重要な前提・制約メモ
- 現行 `30nen_pj`（WordPress）は本番稼働中。移行完了まで **並行稼働** させる。触らない。
- Xサーバーには Claude Code が SSH 接続済み（フェーズ1で利用）。
- サーバー構成は Nginx + PM2。SaaS は使わない（コストゼロ方針）。
- 現行サイトの参考: `~/Desktop/30nen_pj`（WordPressテーマ。カテゴリー構造「度々の旅」親子対応済み）。
- **【将来の検討事項】プロジェクトの置き場所**：現在は `~/Desktop/30nen_next`（デスクトップ内）。macOS はデスクトップ/書類/ダウンロードを保護対象とするため、開発時に `node` から「デスクトップ内のファイルにアクセスしてよいか」の確認ダイアログが出る（「許可」でOK・安全）。煩わしくなったら、保護対象外の場所（例 `~/30nen_next`）へ移すと確認が出なくなる。**今すぐ移す必要はない**が、適切なタイミング（例：デプロイ準備の前など）で移動するか検討する。
