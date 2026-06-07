# 引き継ぎドキュメント（30nen_next）

> このファイルは、`30nen_next` フォルダで作業を始める際に最初に読む引き継ぎ資料です。
> 新しい Claude Code セッションを **このフォルダ（`~/Desktop/30nen_next`）で起動** し、
> 「HANDOFF.md を読んで」と伝えれば、ここまでの経緯を引き継げます。

最終更新: 2026-06-07（トップページの仕上げ微調整＋足跡（パンくず）追加＝項目26・ブラウザ動作確認済み。次回もSAKIさんと対話しながら継続）

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
15. **フェーズ2：投稿日時の設定（即時投稿／日時指定）が完成（ブラウザで動作確認済み）**（コミット `（このコミット）`）。
    - 投稿フォームに「公開日時」欄(datetime-local)を追加。**空欄＝今すぐ公開**、**日時を選ぶ＝その日時で公開**（過去日付OK＝さかのぼり投稿）。
    - 日時の変換係 `src/lib/datetime.ts` を新設（DBはUTC保存・利用者は日本時間JST。サーバーのタイムゾーン設定に依存せず明示的に+9で換算）:
      - `formatJst`（UTC→表示用JST）/ `utcToJstInput`（UTC→入力欄の値）/ `jstInputToUtc`（入力欄→DBのUTC）。
    - `src/app/actions/articles.ts` … create/update が公開日時を受け取って保存（空欄なら公開時に「今」を自動補完）。
    - `src/app/admin/page.tsx` … 一覧は公開済みなら「公開: <日時>」、それ以外は「更新: <日時>」を日本時間で表示。日時整形は datetime.ts に集約。
    - ブラウザ確認済み: ①空欄→即時公開（今のJSTが入る）②過去日時(2020-01-15 09:30)指定→その日時で公開③編集ページで公開日時が正しく復元、まで全通過。
    - メモ（将来）: 「未来の日時」を指定して**自動で時が来たら公開する“予約投稿”**は未対応（status=published になり即一覧に出る）。本当の予約投稿にするには、公開ページ側で「未来日時の記事は隠す」処理が必要。公開ページ作成時に対応を検討。
16. **フェーズ2：画像アップロード（本文への画像挿入＋アイキャッチ画像）が完成（ブラウザで動作確認済み）**（コミット `（このコミット）`）。
    - 導入ライブラリ: `@tiptap/extension-image`（v3）。本文エディタに画像を差し込めるようにする部品。
    - DB変更: `articles` に `featured_image_path`（アイキャッチ画像のパス・任意）列を追加。マイグレーション `drizzle/0001_brave_anthem.sql` を生成・適用済み。
    - 作成ファイル:
      - `src/app/api/upload/route.ts` … 画像の受け取り口（POST `/api/upload`）。ログイン必須・種類（JPEG/PNG/GIF/WebP）とサイズ（10MBまで）を検査し、`public/uploads/年/月/ランダム名.拡張子` に保存して公開URL(`/uploads/...`)を返す。本文用とアイキャッチ用の両方がこの1か所を使う。
      - `src/app/admin/upload-image.ts` … 画像を `/api/upload` に送ってURLを受け取る共通関数（クライアント側）。
      - `src/app/admin/featured-image.tsx` … アイキャッチ画像の設定欄（選ぶ→プレビュー→変更／削除）。選んだパスを hidden input `featuredImage` に乗せて送信。
    - 変更ファイル:
      - `src/app/admin/rich-editor.tsx` … ツールバーに「画像」ボタンを追加。押すとファイル選択→アップロード→カーソル位置に画像を挿入。`StarterKit` に `Image` 拡張を追加。
      - `src/app/admin/article-form.tsx` … 本文の下に `<FeaturedImage>` を配置。編集時は初期値 `featuredImagePath` を渡す。
      - `src/app/actions/articles.ts` … create/update が `featuredImage` 欄を読み、空欄は null として保存。
      - `src/db/articles.ts` … 入力型と create/update に `featuredImagePath` を追加。
      - `src/app/admin/articles/[id]/edit/page.tsx` … 編集フォームに保存済みのアイキャッチを渡す。
      - `src/app/globals.css` … 本文に挿入した画像が編集枠に収まるよう見た目を追加。
      - `.gitignore` … `/public/uploads/*` を除外（投稿された画像はGit管理しない。フォルダ保持用に `public/uploads/.gitkeep`）。
    - ブラウザ確認済み: ①本文に画像挿入→`<img>`が入る ②アイキャッチを選ぶ→プレビュー表示 ③「投稿する」でDB保存（`featured_image_path`＋本文の`<img>`両方）④編集ページで両方が正しく復元 ⑤未ログインは401・画像以外は400で拒否 ⑥保存画像はURLで配信OK(200)。型チェック(tsc)・Lint(eslint)もクリーン。確認に使ったテスト記事・画像は削除済み。
    - メモ（将来・本番運用前に検討）:
      - **保存場所**: 現在は `public/uploads/` に直接保存（`next start`＝PM2運用なら実行時に書いたファイルもそのURLで配信される）。デプロイ時、`public/uploads` は**デプロイで上書きされない永続フォルダ**として扱う（git管理外なので、デプロイ手順で残す or シンボリックリンクを検討）。
      - **画像の自動軽量化**: ✅ 対応済み（`sharp` 採用）。アップロード時にサーバー側で **長辺1600pxまで縮小＋圧縮**（JPEG/PNG/WebP）。スマホの向き(EXIF)も自動補正。**GIFはアニメ保持のため無加工**。上限は安全弁の40MB（自動で軽くなるので普段は引っかからない）。動作確認: 4000×3000・約1.3MBの画像→1600×1200・約230KBに縮小されることを確認。設定値は `src/app/api/upload/route.ts` の `MAX_DIMENSION`（縮小サイズ）・`quality`（圧縮率）・`MAX_BYTES`（上限）で調整可。
      - **サムネ生成**: 一覧用の小さい版（サムネイル）の別途生成は未対応。必要になれば検討（今はアイキャッチ原寸を表示で縮めて使う想定）。
      - **不要画像の掃除**: 記事から外した画像のファイルは消さずに残る（孤児ファイル）。当面は放置で可。気になれば後で掃除する仕組みを検討。
    - 未着手: users/categories のCRUD（カテゴリ選択UI）、公開ページ、Xサーバーへのデプロイ設定。
17. **フェーズ2：アイキャッチ未設定の確認アラート（A案）が完成（ブラウザで動作確認済み）**（コミット `ee3480a`）。
    - 「投稿する」(公開)を押したとき、アイキャッチ画像が未設定なら `window.confirm` で「アイキャッチ画像が未設定です。このまま公開しますか？」と確認。OKで公開・キャンセルで送信中止。**画像なしでも公開できる（必須にはしない）**。下書き保存では確認しない。
    - 仕組み: `src/app/admin/article-form.tsx` の「投稿する」ボタンに `onClick` を付け、hidden input `featuredImage` の値が空かどうかで判定（状態を持ち回さずシンプル）。
    - ブラウザ確認: 投稿+キャンセル→送信中止／投稿+OK→公開／投稿(画像あり)→確認なし／下書き保存→確認なし、の4パターン通過。
19. **フェーズ2：公開ページの要件定義完了 + 実装の事前準備完了**（コミット未実施・要確認）。
    - 要件定義書を `docs/public-page-spec.md` に作成（現行サイトほぼ忠実再現・トップページ優先）。
    - 事前準備として以下を実施済み（ページファイル本体は未作成・Claude Design と共同作業予定）:
      - `src/db/articles.ts` … 公開ページ用のクエリ関数（`listPublishedArticles` / `countPublishedArticles` / `getPublishedArticleBySlug` / `getPublishedArticleById` / `PublicArticle` 型）を追加。著者・連載を JOIN して取得。`status=published` かつ `publishedAt <= 今` のみ（予約投稿対応）。
      - `src/lib/datetime.ts` … `formatJstDate`（”2026年6月3日” 形式の日付表示）を追加。
      - `src/app/layout.tsx` … フォント（Zen Old Mincho・Noto Serif JP）・メタデータ・`lang=”ja”` を設定。
      - `public/` … ロゴ画像（`30nen_logo_noren_plus.jpg` / `30nen_logo.png`）をコピー。
      - 旧 `src/app/page.tsx` を削除（新しい `(public)/page.tsx` との衝突を防ぐため）。
      - `src/app/(public)/posts/[slug]/` と `src/app/(public)/series/[slug]/` のフォルダを作成。
    - **次の作業（Claude Design と共同）**: `docs/public-page-spec.md` の仕様に従ってトップページを実装。
      - まず DB に連載の `image_path` 列を追加するマイグレーションが必要（仕様書 §3-1 参照）。
      - `public/` にダミー画像・line-up.png・sp_menu01.png をコピー（仕様書 §8 参照）。
      - `src/app/(public)/layout.tsx`・`page.tsx` と共通コンポーネント群を作成。
18. **フェーズ2：連載(カテゴリ)・投稿者の管理＋書き手と連載の”自動ひもづけ”が完成（ブラウザで動作確認済み）**。
    - **狙い（SAKIさんの要望）**: 「書き手が連載を選び忘れて“未分類”になる」を構造的に防ぐ。**1人＝1連載**を前提に、管理者が「この人はこの連載の担当」を名簿に登録 → 投稿画面で**担当連載が自動セット**される。
    - **連載データ層＋担当名簿の窓口**（コミット `9ae420c`）: `src/db/categories.ts` を新設（CRUD・親子ツリー `buildCategoryTree`・記事件数集計・担当名簿 `category_authors` の窓口 `getCategoriesForUser`/`setUserCategory`/`getAuthorsForCategory`）。削除は子連載や記事があれば拒否。`src/db/users.ts` に `listUsers`/`updateUser`/`countAdmins` を追加し、`deleteUser` は記事を持つ人を守るガード付き(`{ok,reason}`)に変更。スモークテスト `scripts/smoke-categories.ts` 通過。
    - **連載の管理画面**（コミット `e9e3e05`・管理者専用）: `/admin/categories`（一覧は親子を字下げ表示＋新規作成フォーム／記事・子連載があれば削除ボタンを無効化）、`/admin/categories/[id]/edit`（親候補から自分自身と子孫を除いて循環を防ぐ）。`src/app/actions/categories.ts`。認証ヘルパーに `requireAdmin()` を追加。
    - **投稿フォームに連載選択＋自動ひもづけ**（コミット `f954926`）: 連載は**必須**（未分類を作らない）。投稿者は担当が登録済みなら自動セット＆その範囲内だけ選択可、担当未登録なら全連載から選び→選んだ連載を担当として記録（次回から自動）。管理者は全連載から自由に選べる（担当固定なし）。`src/db/categories.ts` の `listSelectableCategories(user)`、`src/app/actions/articles.ts` の `resolveCategory()` で実装。
    - **投稿者の管理画面**（コミット `2b6fdcd`・管理者専用）: `/admin/users`（一覧に権限・担当連載を表示＋新規作成）、`/admin/users/[id]/edit`（パスワードは空欄なら据え置き・担当連載をここで設定）。`src/app/actions/users.ts`。安全ガード: 自分自身は削除/降格不可・最後の管理者は削除/降格不可・記事を持つ人は削除不可。
    - **動作確認に使ったテストデータ**: テスト連載「度々の旅 ＞ 山陰編」をローカルDBに作成済み（次の公開ページ等のテスト用にあえて残置）。テスト投稿者・テスト記事は作成→確認後に削除済み。テスト管理者(`test@example.com`)は引き続き残置（本番前に削除予定）。
    - **メモ（将来）**: 顔写真(avatar)のアップロードはユーザー編集画面に未実装（自己紹介 bio は実装済み）。必要になれば本文画像と同じ `/api/upload` を流用して追加する。
20. **フェーズ2：公開トップページのデザイン要件を1項目ずつ確定**（コミット `c8f19d1`・`637f69f`）。
    - SAKIさん × Claude で、現行 30nen.com（読み取りのみ）・Claude Design の新デザイン案・SAKIさんメモを突き合わせ、トップページのデザインを **A〜J の10項目**に分けて1つずつ協議・確定。結果は `docs/public-page-spec.md` の **§14「デザイン確定事項」** に全記録（§14 が §4 以前の旧仕様と食い違う場合は §14 を優先）。
    - 確定の要点:
      - A 背景=**白**（現状どおり。Claude Design のベージュ案は不採用）。文字#333・アクセント#150c0c・Zen Old Mincho。
      - B 左端メニュー=**縦書き1本帯**（当店について/沿革/書き手募集/利用規約/プライバシーポリシー・リンク先確定。各ページ本体は後回し）。
      - C 右端アイコン=Instagram/X/メール（メールは `/contact`・後回し）。
      - D ロゴ=現状の `30nen_logo_noren_plus.jpg` を流用（新デザインのロゴ＝この画像と同一だった）。
      - E リードテキスト=文言確定。**★管理画面から編集できる仕組み（サイト設定テーブル＋設定画面）を今回フェーズに追加**（年2〜3回書き換える要件）。→ 当初の「表示のみ」より範囲が少し広がった。
      - F SNSリンク「instagram｜x」/ G 「三十年商店とは？」ボタン→`/about`。
      - H 最新エリア=大画像＋カテゴリー画像（画像左下の白窓・連載の `imagePath`）＋日時（n月j日 G時i分）＋タイトル。**著者名は出さない**。
      - I 記事一覧=**PC2列**・12件/ページ・新しい順・**PCは最新1件をスキップ**（二重表示防止）。カードは画像＋【カテゴリー名】＋日付（時刻なし）＋タイトル。
      - J 右コラム=「小商店」連載画像**3列**（`imagePath` 無ければ `line-up.png`・トンボ風装飾）＋検索＋アーカイブ（検索・アーカイブは**枠だけ**で機能は後回し）。
    - **このセッションでは実装はしない方針**。前回着手しかけた実装ファイル（`src/components/` の部品・`datetime.ts` の追記・コピー画像）は消して、要件定義だけの状態に戻した。
21. **フェーズ2：スマホ表示・ハンバーガーメニューの要件を確定（K〜N）**（コミット `（このコミット）`）。`docs/public-page-spec.md` §14 の「スマホ表示・ハンバーガーメニュー」に記録。基本は現行 30nen.com の挙動を踏襲（ブレークポイント767px以下）。
    - K 全体レイアウト=縦1列。常に表示=ロゴ/リード/SNS/「三十年商店とは？」＋最新＋記事一覧。左端メニュー・右コラム（小商店/検索/アーカイブ）はハンバーガー内へ。記事一覧はスマホも2列。
    - L ハンバーガーボタン=**画面右下に固定**（濃色#150C0Cの丸・約50px）。アイコンは **`30nen_sanmaru.png`**（現状 `sp_menu01.png` から差し替え・現在 `ph_data/` にある→実装時 `public/` へ）。開くと「閉」表示。
    - M メニュー中身（上から）=「三十年商店とは？」ボタン（→/about・現状「初めての方はこちら」から文言統一）／小商店（3列）／検索（枠のみ）／アーカイブ（枠のみ）／左端5リンク。
    - N 開き方=**全画面の白いオーバーレイ**（現状どおり）＋開いている間は背景スクロール固定（小改善）。実装は Client Component で開閉管理。現状の `.en` 自動ラップJSは不要（§5の font-kerning で代替）。
    - **▶ これでトップページのデザイン要件は PC・スマホとも全確定**。次は §14 に沿って実装に着手できる状態。
22. **フェーズ2：公開トップページを実装（ブラウザ動作確認済み）**（コミット `4f6dc7d`）。仕様書 §14 に沿って実装。型チェック(tsc)・Lint(eslint)クリーン。
    - **追加した仕組み（E項目）**: サイト設定。`site_settings` テーブル（key/value）をschema追加＋マイグレーション `drizzle/0003_slimy_firedrake.sql` 適用済み。`src/db/settings.ts`（getSetting/setSetting/getLeadText・初期値=確定リード文）。管理画面 `/admin/settings`（管理者専用・`settings-form.tsx`）＋アクション `src/app/actions/settings.ts`。/admin トップに「サイト設定」リンク追加。
    - **公開ページ本体**:
      - `src/app/(public)/layout.tsx` … 3カラム＋左端縦メニュー＋右端アイコン＋ハンバーガー。連載一覧・リードテキストをDBから取得して各パーツへ。`public-root` クラスで明朝＋font-kerning（§5）。
      - `src/app/(public)/page.tsx` … 最新エリア＋記事一覧（2列・12件）＋ページネーション。`export const dynamic='force-dynamic'`（常に最新DBを表示）。
      - 共通部品 `src/components/public/`: section-heading / article-card / latest-article / pagination / series-list / sidebar-right(SidebarContent) / sidebar-left / edge-nav / edge-icons / hamburger-menu(client) / nav-links / search-form。
      - `src/db/articles.ts` の PublicArticle に `categoryImagePath` 追加（最新カードの白窓に連載画像を出すため）。
      - `src/lib/datetime.ts` に `formatJstDatetime`（"6月3日 15時26分"）追加。
      - 記事アクション（create/update/delete）に `revalidatePath('/')` 追加。
      - アセットを `public/` へコピー: dammy.jpg / line-up.png / 30nen_sanmaru.png / Icon_insta.svg / Icon_x.svg / Icon_mail.svg / obi-pattern.png。
    - **動作確認**: デスクトップはデザイン画像にほぼ一致。スマホは縦1列＋右下ハンバーガー（全画面メニュー）。コンソールエラー無し。`npm run dev` → `http://localhost:3000`。窓幅1024px以上でPC版・未満でスマホ版に自動切替。
    - **⚠ 確認用のサンプルデータ**: ローカルDBに公開記事15件＋連載数件（もしもし五島列島/ご機嫌な毎日/島縞/のちの野良）を投入済み（表示確認用）。本番前に削除する。※DB実体(`data/*.db`)はGit管理外なのでコミットには含まれない。
    - **🔧 調整の状況（SAKIさんと対話しながら微調整中）**:
      1. ✅ **3カラムの幅**: 左右を等倍・中央広めに調整済み（`1fr 1.8fr 1fr`）。
      2. ✅ **オビ（見出し）**: 帯模様 `obi-pattern.png` を薄く敷いた「テクスチャ帯」に変更済み（`.obi-band`・現行 common_title01 を再現）。
      3. **代替画像(dammy)**: アイキャッチ未設定時は現行の `dammy.jpg`（暖簾ロゴ画像）。別画像にするか要検討（未対応）。
      4. **最新エリア**: PC・スマホ共通で「最新を大きく出し、一覧から1件省く」に統一（現行WPはスマホで一覧にも最新を含めていた）。
      5. リードテキスト初期値は改行なし1段落（デザイン画像は改行入り）。`/admin/settings` で編集可。
      6. dev環境ではハンバーガー内「小商店」サムネイル(line-up.png)の画像最適化が遅く一瞬空白に見えることがある（本番ビルドで解消・実装上の問題ではない）。
    - **確認用サンプル画像**: 表示イメージ確認のため、`reference/sample-posts` の写真17枚を `public/uploads/sample/` にコピーし、サンプル15記事のアイキャッチに割り当て済み（ローカルのみ・`public/uploads`はGit管理外＝コミットに含まれない）。本番前に整理する。
    - **デザイン微調整コミット**: カラム幅＋オビをパターン化 → コミット `450de2a`。
    - **▶ 次回の続き**: SAKIさんが見て気になった点を順次調整（上記3〜5や、余白・文字サイズなど）。`npm run dev`→`localhost:3000`、PCは窓幅1024px以上。
23. **フェーズ2：トップページ左カラムのデザイン微調整（SAKIさんと対話しながら実施・ブラウザ動作確認済み）**（コミット `bc6ffef`）。型チェック(tsc)・Lint(eslint)クリーン。変更は左カラム部品 `src/components/public/sidebar-left.tsx` が中心。
    - **リンク色**: `instagram｜x` のリンクを青 `#2563eb` に（区切りの「｜」はグレーのまま）。
    - **リードテキスト**: 初期値（`src/db/settings.ts` の `DEFAULT_LEAD_TEXT`）を**1フレーズずつ改行**入りに変更（現行サイトの見た目に合わせる・`whitespace-pre-line` で改行反映）。表示は**少し太く**（`font-weight:500`／`layout.tsx` のフォント読み込みに 500 を追加）・**行間を詰め**（`leading-7`→`leading-6`）・**ひらがなの連なりだけ字間を詰める**（`renderLeadText()` でひらがなを `<span class="hira-tight">` で包む。`hira-tight` は `globals.css`・`letter-spacing:-0.09em`・数値で調整可）。
    - **「三十年商店とは？」帯**: **PC（3コラム＝`lg`以上）でのみ表示**（`hidden lg:flex`。スマホはハンバーガー内の同ボタンで代替）。帯を**約80%に**小さく（`w-44`→`w-36`・`py-2`→`py-1.5`／文字サイズ `text-sm` は据え置き）。
    - **最新エリア前の「三十年商店」テキストを削除**（`src/app/(public)/page.tsx`）。中央コラムは「最新」から始まる。
    - **スマホ版に「書き手さん、募集中！」リンクを追加**（SNSリンクの下・`lg:hidden`＝スマホのみ）。スミケイ（黒い罫線）で囲んだリンク。リンク先 `https://30nen.com/about/#wanted`。「！」だけ `<span>` で包んで **20度・時計回りに傾け**（Tailwind v4 は回転=`rotate`・縮小=`scale` の独立プロパティ）。仕上げに 文字小さく(`text-xs`)・**カコミ全体80%縮小**(`scale-[0.8]`)・**枠線を細く**(`border-[0.5px]`)・読点「、」の後ろのアキを詰め(`tracking-[-0.4em]`)・左右の内側余白を調整(`pl-1.5 pr-1`)。
      - メモ（将来）: リンク先は現状の現行サイト(30nen.com)を指す。新サイトが本番化したら `/about/#wanted`（相対）に直すと自然。
24. **フェーズ2：トップページの見出しオビ・左カラムの行間を微調整（SAKIさんと対話しながら実施・ブラウザ動作確認済み）**（コミット `f3c95f7`）。
    - **見出しオビ**（最新・記事一覧・小商店・検索・アーカイブで共通の `src/components/public/section-heading.tsx`）: 帯の高さを約70%に（`py-1.5`→`py-[2px]`＋`leading-tight`）・字間を詰める（`tracking-[0.4em]`→`tracking-normal`）・左右の余白を小さく（`px-3`→`px-1`）・文字を少し小さく（`text-[1.05rem]`→`text-[0.95rem]`）。帯模様を細かく（`globals.css` の `.obi-band` 背景 `background-size: 4px`→`2px`・現行 common_title01 と同じ細かさ）。
    - **左カラム**（`src/components/public/sidebar-left.tsx`）: リード文と `instagram｜x` の行間を詰めた（`mt-5`→`mt-3`）。
    - メモ: リードテキストの文字サイズは `text-sm`（＝0.875rem／14px相当）。変えるならここ。
25. **フェーズ2：トップページのスマホ表示と一覧カードを調整（SAKIさんと対話しながら実施・ブラウザ動作確認済み）**（コミット `92aefcf`）。
    - **スマホ（lg未満）で「最新」エリアを非表示**（`src/app/(public)/page.tsx`）: 「最新」帯＋大画像はPC専用（`hidden lg:block`）にし、スマホはいきなり「記事一覧」が最新から並ぶ。仕組み: 一覧は1ページ目も先頭(最新)を含めて12件取得し、PCでは先頭カード（大画像と重複）だけ `lg:hidden` で隠す。これで**PC・スマホとも1ページ12件**・ページ送りが一致（`totalPages=ceil(total/12)`）。※要件メモ §14-I の「スマホも2列」から方針変更した点に注意。
    - **スマホの記事一覧を1列に**（PCは2列）: グリッドを `grid-cols-1 lg:grid-cols-2` に。
    - **一覧カード画像の高さを低く**（`src/components/public/article-card.tsx`）: `aspect-[4/3]`→`aspect-[16/9]`（スマホ）。PCはさらに短く `lg:aspect-[2/1]`。
    - **PC2列カードの横間隔を狭く**: `gap-x-5`→`gap-x-1`（4px）。`gap-y-8` は据え置き。
26. **フェーズ2：トップページの仕上げ微調整 ＋ 足跡（パンくず）追加（SAKIさんと対話しながら実施・ブラウザ動作確認済み）**（コミット `（このコミット）`）。型チェック(tsc)・Lint(eslint)クリーン。
    - **一覧カードの日時色をタイトルと統一**（`src/components/public/article-card.tsx`・`latest-article.tsx`）: 日時を `#808080`（グレー）→ `#333`（タイトルと同色）に。最新エリアの日時も同様に統一。日時とタイトルの行間も詰めた（`mt-1`→`mt-0.5`）。
    - **`【` の左端そろえ**（`article-card.tsx`）: カテゴリー名の全角開きカッコ `【` は字形が右寄りで左にアキがあるため、カテゴリー有りの行だけ `text-indent:-0.68em` で左へ寄せ、カバー写真の左端と縦ラインを一致（測定で誤差0.04px）。
    - **一覧カード画像を「最新」と同じ比率に**（`article-card.tsx`）: `aspect-[16/9]`/`lg:aspect-[2/1]` → `aspect-[4/2.5]`（最新＝`latest-article.tsx`と同比率で高く）。
    - **左右カードのタイトルの近づき過ぎを解消**: 写真同士はつなげたまま（`gap-x-1`を維持）、タイトル文字だけ右にアキ（`h3` に `pr-5`）。1行16文字・2行で最大32文字（`line-clamp-2`）。※タイトルの手動改行は「自動の折り返しのまま」で確定（実装しない）。
    - **左端メニューの文字調整**（`src/components/public/edge-nav.tsx`）: 間延びの元だった `tracking-[0.15em]` を外し、ひらがなだけリード文と同じ詰め（`hira-tight`／-0.09em）に。サイズは `text-sm`（リード文と同じ14px）。ひらがな詰めの関数はリード文と共通化（新規 `src/components/public/hira-tight.tsx` に `renderHiraTight` を切り出し、`sidebar-left.tsx` も差し替え）。
    - **左右の端に縦罫（ケイ）を追加**（検索枠と同じ 1px・`#150c0c`/50）: 左メニューは内側（右どなり）に `border-r`、右SNSアイコンは内側（左どなり）に `border-l`。どちらも画面**上端(top:0)から下まで**伸ばす（`edge-nav.tsx`・`edge-icons.tsx` を `top-0 bottom-6 flex-col justify-end` に＝文字/アイコンは下寄せのまま罫だけ全高）。
    - **足跡（パンくずリスト）を新設**（新規 `src/components/public/breadcrumb.tsx`）: 訪問者の現在地表示。トップは「三十年商店」のみ・中央ぞろえ・**ゴシック体**・12px・グレー。明朝の中で部分的にゴシックにする `.gothic` クラスを `globals.css` に追加（日本語はOS標準ゴシックにフォールバック）。今後の記事/連載ページで「三十年商店 ＞ 連載 ＞ 記事」のように使い回せる。
    - **天端そろえ＆間隔調整**（`src/app/(public)/layout.tsx`・`page.tsx`）: 右コラム（小商店オビ側）に `lg:pt-2` を追加し、左のロゴ（のれん）と上ラインを一致（差0px）。最新エリアと記事一覧の間隔を `mb-12`→`mb-6` に詰めた。
    - **追い微調整**（コミット `（このコミット）`）: 右SNSアイコンを80%(22→18px)に縮小＆グループごと5px上へ（`edge-icons.tsx`）。一覧カードのタイトルを少し大きく＆太く（`text-sm`→`text-[0.95rem]`＋`font-medium`／`article-card.tsx`）。左右の縦罫を**ウィンドウ最下部(bottom:0)まで**延長（文字/アイコンは今の高さのまま＝`pb` で位置を維持／`edge-nav.tsx`・`edge-icons.tsx`）。
    - **▶ 次回**: トップページの残り微調整 or 各ページ（記事詳細・連載別一覧・著者・about等）の実装へ。足跡部品は流用可。

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
12. 投稿日時の設定（即時投稿／日時指定・さかのぼり可） … ✅ 完了（`src/lib/datetime.ts`・ブラウザ動作確認済み）
13. 画像アップロード（本文への画像挿入＋アイキャッチ画像） … ✅ 完了（`src/app/api/upload/route.ts`・`featured-image.tsx`・DBに`featured_image_path`列追加・ブラウザ動作確認済み）
14. アイキャッチ未設定の確認アラート（A案） … ✅ 完了（`ee3480a`・ブラウザ動作確認済み）
15. カテゴリ（連載）選択UI と users/categories のCRUD … ✅ 完了
    - 連載データ層＋担当名簿（`9ae420c`）／連載管理画面（`e9e3e05`）／投稿フォームの連載選択＋自動ひもづけ（`f954926`）／投稿者管理画面（`2b6fdcd`）。すべてブラウザ動作確認済み。
    - **書き手と連載の自動ひもづけ**で「未分類になる選び忘れ」を構造的に解消（1人1連載）。
16. 公開トップページのデザイン要件確定（A〜J） … ✅ 完了（`c8f19d1`・`637f69f`）。`docs/public-page-spec.md` §14 に全記録。
    - **▶ 次：このデザイン要件（§14）に沿って公開トップページを実装**（Claude Design と共同）。
      - 着手前にまず: ①ダミー画像など `public/` へコピー（`dammy.jpg`/`line-up.png`/`30nen_sanmaru.png` など。`image_path` 列追加は `dc6b5a7` で実施済み）。②E項目の「サイト設定」テーブル＋管理画面（リードテキスト編集）を追加。
      - その後: 記事詳細ページ・連載別一覧ページ・著者ページ。
      - **未確定の要件（先に詰める）**: スマホ表示・ハンバーガーメニューの詳細（§14 末尾の先取りメモ＋§6 参照）。
    - 最後: Xサーバーへのデプロイ設定（Nginx + PM2）。
    - デプロイ時の注意（画像）: `public/uploads/` はGit管理外の**永続フォルダ**。デプロイで消えない/上書きされないように扱う。

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
