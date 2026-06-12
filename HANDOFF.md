# 引き継ぎドキュメント（30nen_next）

> このファイルは、`30nen_next` フォルダで作業を始める際に最初に読む引き継ぎ資料です。
> 新しい Claude Code セッションを **このフォルダ（`~/Desktop/30nen_next`）で起動** し、
> 「HANDOFF.md を読んで」と伝えれば、ここまでの経緯を引き継げます。

最終更新: 2026-06-12（固定ページ4本を新設＝「当店について」`/about`（項目37）・「サイトのご利用について」`/howtouse`（項目38）・「プライバシーポリシー」`/privacy`（項目39）・「沿革」`/history`（項目40）。**左端メニュー5項目がすべて完成**。あわせて本文14px・足跡10pxに統一・画像の角丸を全面廃止。切替時期は7月下旬 or 8月末を検討中）

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
27. **フェーズ2：右コラム（小商店・ワード検索・アーカイブ）の調整＋アーカイブ目次を新設（SAKIさんと対話しながら実施・ブラウザ動作確認済み）**（コミット `（このコミット）`）。型チェック(tsc)・Lint(eslint)クリーン。
    - **小商店（連載画像）にトンボ装飾**（`src/components/public/series-list.tsx`）: 画像を `p-2.5` の余白で小さくし、四隅にL字（`border-[1.5px]`・`#c0c0c0`）を絶対配置。セル間 `gap-0` で角を共有し、各Lを外向きに0.75pxずらして隣のLと1本に重ね「＋」のトンボに（ダブり防止）。
    - **ハンバーガーの三丸アイコンを150%に**（`src/components/public/hamburger-menu.tsx`）: `30nen_sanmaru.png` を 30→45px（ボタンは50px角のまま）。
    - **「検索」→「ワード検索」に改名**（`src/components/public/sidebar-right.tsx`）。送信ボタンは「検索」のまま。
    - **アーカイブ目次を新設（年月＋件数・表示のみ）**: DBに `listArchiveMonths()` を追加（`src/db/articles.ts`・公開記事をJST(+9h)の年月で集計・新しい月が上・`ArchiveMonth` 型）。部品 `src/components/public/archive-list.tsx`。`layout.tsx` で取得し `SidebarContent`/`HamburgerMenu` に `archive` を渡す（PC右コラム＆スマホ両方に表示）。**クリックで月別ページに飛ぶ機能は未実装**（月別ページ作成時に繋ぐ）。
    - **アーカイブの見た目調整**: 横線（border-b）を除去・行間を詰め（`space-y-0.5`）・文字を小さく（`text-[0.8rem]`／件数 `text-[0.7rem]`）・件数のカッコを月の直後に（`justify-between` をやめてインライン）。
    - **帯見出しの文字を全体的に小さく**（`src/components/public/section-heading.tsx`）: `text-[0.95rem]`→`text-[0.85rem]`（最新・記事一覧・小商店・ワード検索・アーカイブ共通）。さらに `gapClass` プロパティを追加し、ワード検索・アーカイブだけ帯下のアキを `mb-5`→`mb-2` に詰めた。
    - **画像のホバーをズーム→フェードに変更**（`article-card.tsx`・`latest-article.tsx`・`series-list.tsx`）: `group-hover:scale-*` をやめ `transition-opacity ... group-hover:opacity-80` に統一（マウスオーバーで少し薄くなる）。
    - **⚠ ローカル確認用サンプル**: アーカイブ目次の長さ確認のため、2024年6月〜2026年4月の各月に公開記事を計132件投入済み（タイトル先頭「サンプル」・著者ID2・連載6〜9）。DB実体はGit管理外＝コミットに含まれない。本番前に既存サンプルと一緒に削除する。
    - **のれんロゴを上端ぴったりに**（`src/components/public/sidebar-left.tsx`・コミット `（このコミット）`）: ロゴ画像の上の余白を打ち消し、ウィンドウ上端に密着（`-mt-10 lg:-mt-12`）。横位置は中央のまま（左端には寄せない）。PC・スマホ両方に適用。
    - **「三十年商店とは？」ボタンを薄く＋文字小さく**（`sidebar-left.tsx`＝PC・`hamburger-menu.tsx`＝スマホ両方／コミット `（このコミット）`）: 帯の上下アキ `py-1.5(PC)`・`py-2(スマホ)` → `py-0.5`＋`leading-tight`、文字 `text-sm`→`text-xs`。記事一覧カードのタイトルも少し小さく（`text-[0.95rem]`→`text-[0.9rem]`／`article-card.tsx`）。
    - **▶ 次回**: 月別アーカイブページ（クリック先）、または記事詳細・連載別一覧・著者・about等の実装へ。
28. **フェーズ2：記事詳細ページ＋書き手プロフィール＋お便りフォームを新設（SAKIさんと対話しながら実施・ブラウザ動作確認済み）**（コミット `（このコミット）`）。型チェック(tsc)・Lint(eslint)クリーン。
    - **記事詳細ページ**（新規 `src/app/(public)/posts/[slug]/page.tsx`）: 一覧/最新カードのリンク先。`[slug]` は slug または id（数字）両対応（`findArticle` が slug→id の順で解決）。構成＝足跡（三十年商店＞連載＞タイトル）→連載名＋日付→タイトル→アイキャッチ→本文→書き手。`generateMetadata`・`force-dynamic`。本文HTMLは `.article-body`（globals.css に追加・line-height 2 等）で表示。
    - **アイキャッチはトリミングしない**: 16:9固定をやめ、原寸比率のまま全幅表示（`<Image width={0} height={0} style={{width:'100%',height:'auto'}}>`）。正方形・縦長もそのまま。
    - **書き手プロフィール欄**（新規 `src/components/public/writer-profile.tsx`）: 帯「書き手」＋丸トリミング顔写真＋名前／居住地・年齢／SNSアイコン（Instagram・X・YouTube・Webサイト）。無い項目は省略。記事末尾に表示。
    - **投稿者データに項目追加**（`src/db/schema.ts`＋マイグレーション `0004`・`0005`）: `location`/`age`/`instagramUrl`/`xUrl`/`youtubeUrl`/`websiteUrl`。`src/db/users.ts` の入力型・create/update に反映。アイコン `public/Icon_youtube.svg`・`Icon_website.svg` を追加。
    - **管理画面の投稿者編集を拡張**（`src/app/admin/users/user-form.tsx`・`actions/users.ts`・`[id]/edit/page.tsx`）: 「書き手プロフィール（記事ページに表示）」枠＝顔写真アップロード（`featured-image.tsx` に `label` プロパティを足して流用）＋居住地・年齢・SNS4種。**自己紹介欄は削除**。
    - **お便りフォーム**（新規 `src/components/public/contact-form.tsx`＋`contact-form-slot.tsx`）: 左コラムに帯「お便りフォーム」＋お名前/Eメール/宛先(店主)/メッセージ/同意チェック/送信ボタン。**トップページ(/)では非表示・それ以外で表示**（`ContactFormSlot` が `usePathname` で出し分け）。**送信機能は未実装（枠だけ・送信ボタンは type="button"）**＝後フェーズでバックエンド接続。
    - **⚠ ローカル確認用テストデータ**: 書き手「saico34」（id6・神奈川県藤沢市/49歳/SNS仮）を作成し記事9に割り当て・記事9の本文を実サンプルに差し替え（顔写真は `public/uploads/sample/...`）。すべてローカルDBのみ＝コミットに含まれない。本番前に整理。
    - **▶ 次回**: お便りフォームの送信機能（メール送信）、連載別一覧・著者ページ・about、月別アーカイブページなど。
29. **フェーズ2：お便りフォームの送信機能が完成（ブラウザ動作確認済み）**（コミット `（このコミット）`）。型チェック(tsc)・Lint(eslint)クリーン。これまで「枠だけ」だったお便りフォームを、実際にメール送信できる形にした。
    - **送信方法＝Xサーバーのメール機能（nodemailer + SMTP）**: 月額ゼロ・SaaS不使用の方針どおり。本物のメールアカウント（例 `info@30nen.com`）は本番化のときに用意する。**ローカル開発（SMTP未設定）では、実際には送らず内容をサーバーのコンソールに出すだけ**にして、メアド無しでも画面の流れを確認できるようにした。
    - **宛先プルダウン＝「店主」＋連載名（カテゴリー）**（SAKIさんの希望）: 読者が知っている連載名（小商店と同じ親連載の一覧）を自動で並べ、**選んだ連載の担当書き手に届く**。担当がまだ居ない連載は、お便りが迷子にならないよう**店主にフォールバック**（件名・本文に「○○（担当未登録のため店主へ）」と明記）。「店主」宛は運営の受信箱（環境変数 `CONTACT_TO_EMAIL`）へ。**書き手のメールアドレスはブラウザに渡さず**、サーバー側で連載id→担当書き手のメールに安全に解決する（個人情報を漏らさない）。
    - **書き手宛のお便りは店主にも控え(BCC)を送る**（SAKIさんの希望）: 書き手に届くと同時に、店主にも同じお便りがBCC（書き手側には見えない控え）で届く。店主が全お便りを把握できる。`src/lib/mailer.ts` の `MailInput.bcc` で対応。店主が直接の宛先になるとき（店主宛・担当未登録フォールバック）は控え不要なのでBCCなし。
    - 作成/変更ファイル:
      - `src/lib/mailer.ts`（新規）… メール送信の共通部品。SMTP設定は環境変数から読む。未設定ならコンソール出力で代用。
      - `src/app/actions/contact.ts`（新規）… 送信処理(Server Action `sendContact`)。入力チェック（お名前・メール形式・メッセージ・同意チェック）＋いたずら対策（ハニーポット `website` 罠フィールド）＋宛先解決（連載→担当書き手 or 店主）＋メール送信。返信先(Reply-To)は送信者のメール。
      - `src/db/categories.ts` … `getCategoryAuthorEmails(categoryId)`（宛先解決用に連載名＋担当書き手のメール一覧を返す。メアドはサーバー側のみ）を追加。
      - `src/components/public/contact-form.tsx` … 見た目だけ → 送信機能つきに。宛先プルダウンに連載名を表示。`useActionState` で「送信中…」「完了」「エラー」表示。**入力欄は controlled（state管理）**にして、検証エラーで差し戻しても書いた文章が消えないようにした（Reactのフォーム自動リセット対策）。`ContactRecipient` 型（id・name）をここに定義。
      - `src/components/public/contact-form-slot.tsx`・`sidebar-left.tsx`・`src/app/(public)/layout.tsx` … 連載一覧（小商店と同じ）をフォームまで受け渡し。
      - `.env.example` … メール設定の見本（SMTP_HOST/PORT/SECURE/USER/PASS・MAIL_FROM・CONTACT_TO_EMAIL）を追記。`.gitignore` に `!.env.example` の例外を足してGit管理に入れた（秘密情報なしの見本のみ）。
    - 導入ライブラリ: `nodemailer`（+ `@types/nodemailer`）。純JSなのでXサーバーにそのまま載る。
    - **足跡（パンくず）のフォントを変更**: `.gothic`（足跡用）を **Noto Sans JP**（CDN読み込み・くっきり角張った角ゴシック）最優先に。以前はOS標準のヒラギノ角ゴで「丸く見える」とのことだったため、universalに角張って見える Noto Sans JP に統一。`src/app/layout.tsx` のGoogle Fonts CDNに `Noto+Sans+JP:wght@400;500` を追加・`src/app/globals.css` の `.gothic` を更新。
    - **ブラウザ確認済み**: ①担当のいる連載（もしもし五島列島）宛→担当書き手のメールへ解決 ②担当未登録の連載（ご機嫌な毎日）宛→店主へフォールバック ③同意なしで送信→エラー表示＋入力は保持 ④店主宛→運営の受信箱へ。足跡が Noto Sans JP で描画されることも確認。コンソールエラーなし。
    - **⚠ ローカル確認用テストデータ**: 担当名簿に「saico34（id6）→もしもし五島列島（連載id6）」を登録（宛先解決テスト用）。DB実体はGit管理外＝コミットに含まれない。本番前に整理。
    - **📌 本番化のときにSAKIさんがやること**:
      1. Xサーバーでメールアドレス（例 `info@30nen.com`）を1つ作り、その接続情報を本番の `.env` に書く（`.env.example` のコメント参照）。それまではローカルでも送信は擬似（ログ出力）で動く。
      2. **Xサーバーのメール自動転送を設定**：作ったアドレス（例 `info@30nen.com`）宛のメールを **`30nensyouten@gmail.com`** へ自動転送する（サーバーパネルの「メール自動転送」設定）。これで店主宛のお便りを普段のGmailで受け取れる。← SAKIさんが後で実施予定。
    - **▶ 次回**: 連載別一覧ページ・著者ページ・about・月別アーカイブページなど。
30. **フェーズ2：記事詳細ページの先頭に「カテゴリー帯」を新設（ブラウザ動作確認済み）**（コミット `（このコミット）`）。型チェック(tsc)・Lint(eslint)クリーン。SAKIさんの添付イメージに沿って実装。
    - **見た目**: 足跡（パンくず）の下に**太めのテクスチャ帯**（`.obi-band`＋細い枠線）。中に〔**白い正方形窓＋カテゴリー画像**〕＋〔**連載名（大・明朝）／ヨミガナ（小・グレー）**〕。日付の上にあった `【連載名】` 表記は帯と重複するので削除（帯の下は日付→タイトルの順）。
    - **カテゴリーに「ヨミガナ」列を追加**（`src/db/schema.ts` の `categories.reading`＋マイグレーション `drizzle/0006_overconfident_dexter_bennett.sql`）。カタカナ・任意。
    - 作成/変更ファイル:
      - `src/components/public/category-banner.tsx`（新規）… カテゴリー帯の部品（name・reading・imagePath を受け取る。画像なしは `line-up.png` で代替）。
      - `src/app/(public)/posts/[slug]/page.tsx` … 足跡の下に `<CategoryBanner>` を配置。
      - `src/db/articles.ts` … `PublicArticle` に `categoryReading` を追加（JOIN列にも `categories.reading` を追加）。
      - `src/db/categories.ts` … create/update・入力型・`getCategoriesForUser` の select に `reading` を反映。
      - `src/app/admin/categories/category-form.tsx`・`actions/categories.ts`・`[id]/edit/page.tsx` … 連載の管理画面に「ヨミガナ」入力欄を追加（保存・復元を確認済み）。
    - **ブラウザ確認済み**: ①記事ページ（/posts/9・連載=もしもし五島列島）で帯が表示され、白窓に連載画像・連載名・ヨミガナが正しく出る ②連載管理画面でヨミガナの保存→復元が往復で動く。コンソールエラーなし。
    - **⚠ ローカル確認用テストデータ**: 連載「もしもし五島列島」(id6) に reading=「モシモシゴトウレットウ」・image_path=サンプル画像を設定。DB実体はGit管理外。本番前に整理。
    - **▶ 次回**: 連載別一覧ページ（帯やカードのリンク先）・著者ページ・about・月別アーカイブページなど。
31. **記事データ移行のスケジュール案を作成（サイト構築と並行で着手）**（コミット `（このコミット）`）。新フォルダ `migration/` に集約。
    - **`migration/README.md`** … フォルダの案内（schedule / writer-onboarding / data-migration-plan の3本立て予定）。
    - **`migration/schedule.md`（メイン成果物・v1）** … 移行スケジュール案。SAKIさんと対話して以下を確定:
      - **切替目標＝7月下旬**（可能であれば）。ただし**8月末なら余裕**・7月下旬は**ぎりぎり**と見立て。お盆（8/13〜16）は書き手の反応が鈍るので切替・重要アナウンスは避ける。**6/29ごろに「行ける/延ばす」のgo-no-go判断ポイント**を提案。
      - **乗り換え方＝並行期間を設ける**。★肝の整理: **並行期間中の本番投稿は今までどおりWordPressに集約／新システムは"練習・お試し"／切替日にWPの全記事を一括移行／切替後は全員 新システムへ**。これで「WP投稿を止めない」と「手順を複雑にしない」を両立（移行元が常にWP1か所）。
      - **WP投稿はフリーズしない（差分移行）**: 移行スクリプトは**冪等**（`wp_id`で移行済みを判定しスキップ）に作り、「一括→差分（増えた分だけ同じスクリプト再実行）」の2回で対応。
      - **移行範囲の確定**: 読者コメント=**移行しない**（お便りフォームで代替）／下書き=**移行しない**（公開記事 約7,790件のみ）／記事URL(slug)=**現行と同じに保つ**（SEO・既存リンク維持）。
      - **著者の対応表**: WP著者番号↔新20名アカウントのつきあわせが必要（移行記事を正しい書き手にひもづけるため）。**SAKIさんが手動でひもづける**方針。必要時はClaude CodeがWPから著者一覧（番号・表示名・メール）を読み取りのみで取得しtたたき台を渡す。
      - **書き手の乗り換えスキーム**: アナウンス2回（①予告=並行期間開始時／②リマインド=切替1週前）・**マニュアルはスペイン語＋日本語**（非日本語話者対応）・操作動画は検討・**質問窓口**を設置（時差考慮で書き込み式）・アカウント20名は管理画面から作成（担当連載ひもづけで「未分類」防止）。
    - 全体は **A サイト仕上げ / B 記事移行 / C 書き手乗り換え** の3トラック同時並行。週ごとの目安表は schedule.md §3。
    - **▶ 次回（移行関連）**: ①`migration/writer-onboarding.md`（アナウンス文面 日西2言語・マニュアル骨子）②`migration/data-migration-plan.md`（移行スクリプト手順）③著者対応表のたたき台。並行してサイトの残りページ実装。
32. **フェーズ2：記事詳細ページに「前後の日記ナビ」＋「関連記事」を新設（ブラウザ動作確認済み）**（コミット `（このコミット）`）。型チェック(tsc)・Lint(eslint)クリーン・コンソールエラーなし。SAKIさんの要望に沿って、投稿本文の下に2つの導線を追加。
    - **① 同カテゴリーの前後の日記へ移動**（新規 `src/components/public/adjacent-nav.tsx`）: 書き手プロフィールの下に配置。同じ連載(categoryId)の公開記事の中で、公開日時の並びの前後を取得。公開日時が同じ記事があってもズレないよう id を第2基準にした。前(or次)が無い記事はその側を非表示（最新記事は「次」が出ない）。**見た目はSAKIさんの指定**＝記事タイトルは出さず、**左に「つぎの日記」（1つ新しい）／右に「まえの日記」（1つ古い）**。各文字の外側に「く」字矢印画像（左は`<`そのまま・右は反転で`>`）。①②③の各ナビとも**上の区切り罫線(border-t)は削除**（SAKIさんの「不用意にラインを入れない」方針）。
    - **② 関連記事（同カテゴリーの過去記事をランダム3点）**（新規 `src/components/public/related-articles.tsx`）: 帯見出し「関連記事」＋**縦に3つ積む**レイアウト（1件＝〔左：カバー画像(幅40%)／右：タイトル＋本文の冒頭3行〕の横並び。SAKIさんの指定で当初の3列グリッドから変更）。**毎回入れ替わり方式**＝ページを開くたびに別の3件（`random()`・SAKIさん了承済み）。本文の冒頭は excerpt があればそれ、無ければ本文HTMLから自動生成（横並びなので長め90字）。
    - **データ取得を追加**（`src/db/articles.ts`）: `getAdjacentArticles({categoryId,publishedAt,articleId})`（前後1件ずつ）・`getRandomCategoryArticles(categoryId,excludeId,limit=3)`（同カテゴリーから自分以外をランダム）。どちらも公開済み＋公開日時が今以前のみ。
    - **本文の抜粋づくり**（`src/lib/sanitize.ts`）: `textExcerpt(html, maxLength=60)` を追加。HTMLタグを全部落として文字だけにし、長すぎたら末尾に「…」。関連記事カードの本文プレビュー用。
    - **③ 三十年商店“全体”の前後の日記（カバー画像＋投稿日時つき）**（新規 `src/components/public/site-adjacent-nav.tsx`）: 関連記事の下に、連載をまたいで**全記事**の前後をたどるナビを追加（SAKIさんの追加要望）。各カードに〔カバー画像（サムネ80px）＋投稿日時（`formatJstDatetime`＝"7月15日 12時00分"）〕。**タイトルは入れない**（SAKIさんの指定。①のカテゴリー内ナビはタイトル付きのまま）。**矢印は「く」の字画像 `public/30nen_kunoji.png`**（`ph_data/` からコピー）を使用＝左(前)はそのまま`<`、右(次)は左右反転(`-scale-x-100`)で`>`。①のカテゴリー内ナビは文字矢印（← →）のまま。`getAdjacentArticles` に `categoryId` を**任意**化し、省くと全体・渡すと連載内になるよう一般化（①のカテゴリー内ナビと同じ関数を使い回し）。レスポンシブ: **640px(sm)以上で左右2分割／未満は縦積み**（375pxスマホでは日時が折り返さず全文表示。`whitespace-nowrap`）。
    - **記事詳細ページに組み込み**（`src/app/(public)/posts/[slug]/page.tsx`）: 書き手プロフィールの下に `<AdjacentNav>`（カテゴリー内）→`<RelatedArticles>`→`<SiteAdjacentNav>`（全体）の順で配置。①②は連載が紐付く記事のみ・③は全公開記事が対象。
    - **ブラウザ確認済み**: ①最新記事(/posts/9)＝「次の日記」非表示・「前の日記」のみ ②中間のサンプル記事(/posts/39)＝カテゴリー内ナビ・全体ナビとも前後両方が表示され、両者は別の記事を指す（連載内 vs 全体）③関連記事3件がカバー＋タイトル＋本文冒頭で表示（excerpt無しの記事は本文から自動抜粋）④全体ナビは1280px=左右2分割・375px/537px=縦積みで日時・タイトルとも全文表示。コンソールエラーなし。
    - **⚠ ローカル確認用サンプル**: 関連記事のカバー画像の見栄え確認のため、アイキャッチ未設定の公開サンプル記事 計132件に `public/uploads/sample/` の写真17種を順番に割り当て（ローカルDBのみ・Git管理外）。本番前に他のサンプルと一緒に整理する。
    - **▶ 次回**: 連載別一覧ページ・著者ページ・about・月別アーカイブページなど（前後ナビ・関連記事の部品は連載ページでも流用可）。
33. **フェーズ2：記事詳細ページ「前後ナビ・関連記事」の見た目を仕上げ調整（SAKIさんと対話しながら実施・ブラウザ動作確認済み）**（コミット `1d84542`）。型チェック(tsc)・Lint(eslint)・コンソールエラーなし。項目32で新設した3つの導線を、SAKIさんと一緒に細部まで整えた。
    - **① カテゴリー内の前後ナビ**（`src/components/public/adjacent-nav.tsx`）: 文字だけ（左「つぎの日記」／右「まえの日記」）＋「く」字矢印・上の区切り罫線なし・文字サイズを「書き手」見出しと同じ `0.85rem` に統一。
    - **② 関連記事**（`src/components/public/related-articles.tsx`）: カード間のアキを詰め（`space-y-8`→`space-y-4`／32→16px）・カバー画像を75%に縮小（`w-2/5`→`w-[30%]`）。
    - **③ 三十年商店“全体”の前後ナビ**（`src/components/public/site-adjacent-nav.tsx`）: 〔矢印＋写真〕の下に投稿日時を**1行**で表示（例「7月15日 12時00分」）・「前の日記／次の日記」の文字ラベルは**削除**・左右の写真の**上端を揃える**（`sm:items-start`）・日時の字間 `tracking-[0.05em]`・カバー画像を150%に拡大（`w-20`→`w-[120px]`・`sizes`も120px）・矢印と写真のあいだの余白を広げる（`gap-3`→`gap-5`）。
    - メモ: 途中で「日時を2行（日付／時刻）」にしたが、SAKIさんの指定で1行に戻した（`src/lib/datetime.ts` に一時追加した分割関数 `formatJstDatetimeParts` は削除済み＝差し引き変更なし）。
    - **▶ 次回**: 連載別一覧ページ・著者ページ・about・月別アーカイブページなど（前後ナビ・関連記事の部品は流用可）。
34. **フェーズ2：連載別一覧ページ `/series/[slug]` を新設（SAKIさんと対話しながら文字サイズ調整・ブラウザ動作確認済み）**（コミット `（このコミット）`）。型チェック(tsc)・Lint(eslint)・コンソールエラーなし。連載名をクリックした先＝「その連載の記事だけ」を並べるページ。トップページ・記事詳細ページの部品を流用し統一感を確保。
    - **ページ本体**（新規 `src/app/(public)/series/[slug]/page.tsx`）: `[slug]` は slug または id（数字）両対応（`findCategory` が slug→id の順で解決。サンプル連載は slug 未設定なので今は id でアクセス＝例 `/series/6`）。構成＝足跡（三十年商店＞連載名）→カテゴリー帯（白窓＋連載画像＋連載名＋ヨミガナ）→その連載の記事一覧（新しい順・2列・12件/ページ）→ページ送り。記事0件なら「この連載の記事はまだありません。」。`generateMetadata`・`force-dynamic`。`countPublishedArticles(categoryId)`・`listPublishedArticles({categoryId})` は既存関数をそのまま利用。
    - **連載をURLから探す関数を追加**（`src/db/categories.ts` の `getCategoryBySlug`）。
    - **入口（リンク）を配線**: ①記事詳細ページの「足跡の連載名」と「カテゴリー帯」をクリック→その連載ページへ（`src/app/(public)/posts/[slug]/page.tsx`。リンク先は `/series/{slug or id}`）。②右コラム「小商店」の連載画像（`series-list.tsx`）は以前から同じ先＝これでリンク切れ解消。
    - **カテゴリー帯を任意リンク化**（`src/components/public/category-banner.tsx`）: `href` を渡すと帯ぜんぶがリンクになる（記事ページ→連載ページ）。連載ページ自身では `href` を渡さず ただの見出しとして使う。
    - **文字サイズ微調整（SAKIさんと対話）**: カテゴリー帯の連載名 `text-sm`(14px)→**`text-base`(16px)**（`category-banner.tsx`・記事ページと連載ページの帯が共通なので両方反映）。記事一覧カードのタイトル `text-[0.9rem]`(14.4px)→**`text-[0.8rem]`(12.8px)**（`article-card.tsx`・トップと連載ページの両方に反映）。※最新エリア（`latest-article.tsx`）のタイトルは `text-lg`(18px)のまま据え置き＝「最新は大きく・一覧は小さく」のメリハリ。
    - **⚠ ローカル確認用サンプル**: もしもし五島列島(id6)で表示確認（記事37件＝4ページ・ページ送りも確認）。DB実体はGit管理外。本番前に他のサンプルと一緒に整理。
    - **メモ（将来）**: 本番の連載に `slug`（URL用の名札・例 `gotou`）を付ければ `/series/gotou` のキレイなURLにできる（ページは両対応済み）。親子連載の「親ページに子連載の記事もまとめて出す」かは未対応（今は その連載に直接ひもづく記事のみ）。必要になれば検討。
    - **▶ 次回**: 著者ページ（※SAKIさんの判断で今回は見送り）・about・月別アーカイブページなど。
35. **フェーズ2：ワード検索が完成（SAKIさんと対話しながら見た目調整・ブラウザ動作確認済み）**（コミット `（このコミット）`）。型チェック(tsc)・Lint(eslint)・コンソールエラーなし。右コラム／ハンバーガー内の「ワード検索」枠（これまで枠だけ）が、本当に検索できるようになった。
    - **検索結果ページ**（新規 `src/app/(public)/search/page.tsx`）: `/search?q=キーワード`。公開記事の**タイトル・本文・抜粋**から部分一致で検索。複数キーワード（空白区切り・全角空白OK）は「すべて含む」**AND検索**。結果はトップと同じ2列カード・12件/ページ・ページ送り付き（ページを送ってもキーワードを引き継ぐ）。構成＝足跡（三十年商店＞ワード検索）→「ワード検索」帯→件数→記事一覧。**キーワード未入力時は入力欄だけ**表示（案内文なし・結果表示中は入力欄を出さない）。0件時は「当てはまる記事は見つかりませんでした。」を表示。
    - **検索のDB関数**（`src/db/articles.ts`）: `searchPublishedArticles`／`countSearchedArticles` を追加。LIKE の特殊文字（% _）はエスケープ済み（「%」と検索しても全件ヒットしない・ブラウザで確認済み）。公開済み＋公開日時が今以前の記事のみ対象。
    - **検索フォームの見た目**（`src/components/public/search-form.tsx`・SAKIさんの指定）: 下線だけ→**お便りフォームと同じケイ（枠線）囲み**に。入力BOXと「検索」ボタンは**密着**（境目の線は1本）。プレースホルダー（「キーワードで探す」の薄文字）は削除。
    - **アキの統一**（`sidebar-right.tsx`）: 「ワード検索」帯下のアキを他の帯と同じ20pxに（旧8px。アーカイブ帯下の8pxは合意済みの例外として据え置き）。
    - **結果件数の文字**（「○○」の検索結果：n件）: 記事詳細ページのタイトルと同じ指定（18px・font-medium）。
    - **ページ送り部品の小修正**（`pagination.tsx`）: 土台URLに `?q=…` が付いていても `&` で正しくつなぐように。
    - **ブラウザタブのタイトル二重を修正**: 「記事名｜三十年商店 | 三十年商店」と店名が2回付いていた。原因＝サイト全体の自動付け足し（`src/app/layout.tsx` の template）と各ページの手書きが重複。template を全角「｜三十年商店」に統一し、記事・連載・検索ページの手書き店名を削除（`posts/[slug]/page.tsx`・`series/[slug]/page.tsx`・`search/page.tsx`）。
    - **デザインポリシーを明文化**（`docs/public-page-spec.md` §14-A）: 「**アキ（余白）は揃える**」＝同じ役割の要素の間隔はサイト全体で統一する。余白調整は必ず同種の要素と同じ値かを確認する。
    - **ブラウザ確認済み**: ①「サンプル」146件・13ページ表示 ②2ページ目へキーワード引き継ぎ ③「海辺　朝」（全角スペース2語）→AND検索で1件 ④該当なし表示 ⑤「%」検索→0件（エスケープ確認）⑥タブ表示が記事・連載・検索とも「○○｜三十年商店」。
    - **追い調整（SAKIさんと対話しながら・ブラウザ動作確認済み）**（コミット `（このコミット）`）:
      - **足跡（パンくず）のフォントを Zen角ゴシックNew に変更**（`globals.css` の `.gothic`・`layout.tsx` のCDN読み込み）: Noto Sans JP が「丸っこい」とのことで、候補4種（BIZ UDゴシック/Zen角ゴシックNew/M PLUS 1p/IBM Plex Sans JP)を画面で見比べてSAKIさんが選択。本文の Zen Old Mincho と同じZenファミリー。
      - **右コラムの検索ボックスを小さく**（`sidebar-right.tsx`・`search-form.tsx`）: 幅は帯の95%・左右センター揃え（左右のアキ6.6pxずつ均等）。高さは80%（34px→27.2px・`py-1.5`→`py-[2.6px]`。「検索」ボタンも同じ高さ）。
    - **▶ 次回**: about・月別アーカイブページ・左端メニューの固定ページ群（沿革・利用規約・プライバシーポリシー）など。
36. **フェーズ2：月別アーカイブページ `/archive/[ym]` を新設（ブラウザ動作確認済み）**（コミット `（このコミット）`）。型チェック(tsc)・Lint(eslint)・コンソールエラーなし。右コラム／ハンバーガー内の「アーカイブ」目次（これまで表示のみ）が、クリックでその月のページに飛ぶようになった。これで右コラムの3点セット（小商店・ワード検索・アーカイブ）はすべて機能する。
    - **ページ本体**（新規 `src/app/(public)/archive/[ym]/page.tsx`）: URLは `/archive/2026-05` 形式（年-月）。構成＝足跡（三十年商店＞2026年5月）→「2026年5月」帯→その月の記事一覧（新しい順・2列・12件/ページ）→ページ送り。形式が変なURL（13月・文字など）は404。タブ表示は「2026年5月の日記｜三十年商店」。`force-dynamic`。
    - **DB関数**（`src/db/articles.ts`）: `listPublishedArticlesByMonth`／`countPublishedArticlesByMonth` を追加。月の区切りは**日本時間JST**（+9時間）で判定＝アーカイブ目次 `listArchiveMonths` と同じ基準なので、目次の件数とページの中身が必ず一致する。
    - **アーカイブ目次をリンク化**（`src/components/public/archive-list.tsx`）: 各行（例「2026年 6月（3）」）を `/archive/2026-06` への Link に。ホバーで薄くなる動きは他のリンクと統一。
    - **ブラウザ確認済み**: ①目次リンクのURL生成 ②2026年5月＝その月の記事だけ12件 ③目次の件数（7）とページの件数が一致 ④`/archive/2026-13`・`/archive/abc`→404 ⑤記事のない月（1999-01）→「この月の記事はありません。」。
    - **▶ 次回**: about・左端メニューの固定ページ群（沿革・利用規約・プライバシーポリシー）・著者ページ（見送り中）など。
37. **フェーズ2：「当店について」ページ `/about` を新設（SAKIさんと対話しながら微調整・ブラウザ動作確認済み・SAKIさんOK済み）**（コミット `（このコミット）`）。型チェック(tsc)・Lint(eslint)・コンソールエラーなし。現行 30nen.com/about/ の内容を忠実に再現した固定ページ。左端メニューの大物が1つ完成。
    - **ページ本体**（新規 `src/app/(public)/about/page.tsx`）: 構成＝足跡（三十年商店＞三十年商店について）→引き戸のイラスト（幅85%・中央寄せ）→「三十年商店について」帯（本文7段落→署名「令和六年七月吉日…」→**点線の区切り**→お便りのお願い→投げ銭の案内＋イラスト＋「投げ銭する」ボタン＝外部 30nen.stores.jp）→「書き手募集」帯（`id="wanted"`・本文→小見出し「書き手にお願いしたい事」＋箇条書き→宛先メール(mailto)→POP UP店舗募集のカコミ）。本文の文字組みは記事本文と同じ `.article-body` を流用しサイト全体で統一。静的ページ（DB不使用）。
    - **画像2枚を `public/` に追加**: `30nen_hikido.jpg`（引き戸。本番サイトから読み取りのみで取得）・`30nen_nagesen.jpg`（投げ銭。参照テーマからコピー）。SAKIさんが `ph_data/` に置いた同名ファイルと中身同一（md5照合済み）。
    - **リンクの配線**: 左端メニュー「当店について」(/about)・「書き手募集」(/about#wanted)・「三十年商店とは？」ボタン(PC左カラム＋ハンバーガー内)は既存定義のままページ完成で全て機能。`#wanted` アンカーは `scroll-mt-6` で帯が上端に張り付かないように。スマホ用「書き手さん、募集中！」リンク（`sidebar-left.tsx`）を現行サイト向け絶対URL→**`/about#wanted`（新サイト内・相対）に変更**（項目23のメモの対応）。
    - **SAKIさんと調整した点**: ①署名「しげやすさき」の後にアキ＋**点線の区切り**（1px dotted `#999`・上下40px）②投げ銭イラストを直前の文章に**グッと寄せる**（`-mt-6`・画像内の白地だけが残る状態）③POP UPカコミ（左右の縦ケイ囲み）は**中央揃え**（`.article-body` の両端揃えが勝つため、枠側に article-body・中の行に text-center を当てる構造で解決）。
    - **意図的に現行と変えた点**: 小見出し「書き手にお願いしたい事」の下線（現行は薄グレーの罫線）は「不用意にラインを入れない」方針に合わせて**入れていない**（SAKIさん確認済みのページ全体OKに含む）。
    - **📌 TODO（SAKIさん確認待ち）**: 「POP UP 店舗も募集しています!」のリンク先は**仮**（現行サイトのお知らせ記事 `30nen.com/oshirase/2025/07/23/12729`）。飛び先をどの記事にするか追って確認し、記事移行後に新サイトのURLへ差し替える（コード内にTODOコメントあり）。
    - **ブラウザ確認済み**: PC（3カラム・1280px）＋スマホ相当の縦1列の両方で表示OK・`/about#wanted` のアンカー着地OK・コンソールエラーなし。
    - **▶ 次回**: 左端メニューの残り固定ページ（沿革 `/history`・利用規約 `/howtouse`・プライバシーポリシー `/privacy`）・著者ページ（見送り中）・お問い合わせ `/contact`（後回し中）など。
38. **フェーズ2：「サイトのご利用について」ページ `/howtouse` を新設＋文字サイズ2点を統一（SAKIさんと対話しながら実施・ブラウザ動作確認済み・SAKIさんOK済み）**（コミット `（このコミット）`）。型チェック(tsc)・Lint(eslint)クリーン。左端メニュー「利用規約」の行き先が完成。
    - **ページ本体**（新規 `src/app/(public)/howtouse/page.tsx`）: 構成＝足跡（三十年商店＞サイトのご利用について）→「サイトのご利用について」帯→前文→小見出し3つ（著作権について／免責事項／リンクについて）＋本文。現行 30nen.com/howtouse/ と**本文テキストを機械照合して完全一致**を確認済み。文字組みは記事本文と同じ `.article-body`。静的ページ（DB不使用）。小見出しの下線（現行は薄グレー罫線）は「不用意にラインを入れない」方針で入れていない（aboutと同じ扱い）。
    - **本文の文字サイズを14pxに統一**（`src/app/globals.css` の `.article-body`・15px→14px）: SAKIさんの指定で左コラムのリード文（14px）と同サイズに。記事本文・about・利用規約・関連記事の抜粋まで本文系がすべて14pxで統一された。
    - **足跡（パンくず）の文字サイズを10pxに**（`src/components/public/breadcrumb.tsx`・`text-xs`(12px)→`text-[10px]`）: 8px・9px・10pxを画面で見比べてSAKIさんが10pxに決定。全ページ共通。
    - **メモ**: 9px以下を試すとき、Chromeの「最小フォントサイズ」設定が効いていると画面上それより小さくならないことがある。
    - **▶ 次回**: 残りの固定ページ（沿革 `/history`・プライバシーポリシー `/privacy`）・著者ページ（見送り中）・お問い合わせ `/contact`（後回し中）など。
39. **フェーズ2：「プライバシーポリシー」ページ `/privacy` を新設（SAKIさんと対話しながら文章も更新・ブラウザ動作確認済み・SAKIさんOK済み）**（コミット `（このコミット）`）。型チェック(tsc)・Lint(eslint)クリーン。左端メニューは残り「沿革」のみ。
    - **ページ本体**（新規 `src/app/(public)/privacy/page.tsx`）: 構成＝足跡（三十年商店＞プライバシーポリシー）→「プライバシーポリシー」帯→前文→個人情報保護方針→お便りフォームについて→著作権・肖像権について→お問い合わせ。文字組みは `.article-body`。静的ページ（DB不使用）。
    - **現行 30nen.com/privacy/ から変えた点（すべてSAKIさん確認済み）**:
      - 小見出しの誤字「個人情**保**護方針」→「個人情**報保**護方針」に修正。
      - まったく同じ文章が2回続いていた段落（重複）を1回に。
      - **「当サイトへのコメントについて」の節をまるごと「お便りフォームについて」に書き換え**（新サイトにコメント欄を作る予定がないため）。新しい文章＝コメント欄はない・フォームの名前/メールの取り扱い・お便りは店主と宛先の書き手が読む・**スパム対応でIPアドレスを記録する場合がある**（将来の対策の余地として明記。現在の実装ではIPは未記録・ハニーポットのみ）。
      - 末尾の「お問い合わせフォーム」リンク（現行は `/contact`・新サイトでは未作成）→「お便りフォームよりご連絡ください」の言い換えに（リンクなし）。
    - **▶ 次回**: 残りの固定ページは「沿革 `/history`」だけ。ほか＝著者ページ（見送り中）・お問い合わせ `/contact`（後回し中）・aboutのPOP UPリンク先確認（項目37のTODO）など。
    - **追い調整（同日・SAKIさんOK済み）**（コミット `12ff932`）: ①PC（lg以上）の**のれんロゴを約80%に縮小**（`sidebar-left.tsx`・`max-w-[260px]`→`lg:max-w-[208px]`。上端ぴったりの引き上げ `-mt-12` はページ上部の余白ぶんなので変えない＝縮小後も上端ずれ0pxを計測確認）。スマホのロゴは大きいまま。②**左端の縦書きメニューの文字を12pxに**（`edge-nav.tsx`・`text-sm`(14px)→`text-xs`）。
40. **フェーズ2：「沿革」ページ `/history` を新設（SAKIさんと対話しながら調整・ブラウザ動作確認済み・SAKIさんOK済み）**（コミット `（このコミット）`）。型チェック(tsc)・Lint(eslint)クリーン。**▶ これで左端メニュー5項目（当店について・沿革・書き手募集・利用規約・プライバシーポリシー）がすべて完成**。
    - **ページ本体**（新規 `src/app/(public)/history/page.tsx`）: 構成＝足跡（三十年商店＞沿革）→「沿革」帯→年見出し（令和6年｜2024年〜令和8年｜2026年）→月ごとのできごと（説明文＋任意の写真・キャプション）。**できごとはページ内の `HISTORY` データ配列に1ブロック足すだけで追加できる**作り（静的ページ・DB不使用）。レイアウト＝写真ありは〔左60%テキスト・右40%写真〕、写真なしは全幅。スマホ（640px未満）は縦積み。項目の下は薄グレーの点線（**全項目に入れる**＝現行は各年の最後だけ線なしだが、SAKIさんの指定で最後にも入れた）。
    - **現行 30nen.com/history/ から足した内容（SAKIさん指定・新サイトにのみ掲載）**: 2025年10月「新宿区秘密基地にて商店会」（写真付き・「某」はトル）／令和8年｜2026年 6月「pop up! 初のメンバー加入」。※現行WP側には載っていない。
    - **写真6枚を `public/` に追加**: `30nen_history_01〜05.jpg`（参照テーマからコピー）＋ `30nen_history_06.jpg`（商店会の写真・SAKIさんが `ph_data/` に投入→コピー）。01のみキャプション「吉祥寺 いせや総本店にて決起会」付き。
    - **画像の角丸を全面廃止**（`globals.css`）: `.article-body :where(img)` と `.tiptap-editor :where(img)` の `border-radius: 4px` を削除（SAKIさんの指定・現行サイトに合わせカクッとした四角に）。**記事本文に挿入する画像・沿革の写真すべてに効く**。
    - **写真まわりの微調整**: 写真の余白（本文共通の `margin: 1.2em 0`）を沿革では `style={{margin:0}}` で打ち消し＝キャプションが写真のすぐ下（4px）に・写真の上端が行のテキスト上端と揃う。※クラス指定（`my-0` 等）は globals.css の共通スタイルに後勝ちで負けるため style 直指定にした（POP UPカコミの中央揃えと同じ現象）。
    - **メモ**: dev環境では画像最適化が遅く、表示直後に写真が一瞬空白に見えることがある（本番ビルドで解消・既知の挙動）。
    - **▶ 次回**: 著者ページ（見送り中）・お問い合わせ `/contact`（後回し中）・aboutのPOP UPリンク先確認（項目37のTODO）・記事データ移行の準備（`migration/` 項目31参照）など。固定ページは全部そろったので、次の大物は移行関連。

### 現在のフォルダ状態
```
~/Desktop/
├── 30nen_pj/      ← 現行WordPress（本番稼働中・移行元・温存。触らない）
└── 30nen_next/    ← ★このプロジェクト（新システム / GitHub: sakipomco/30nen_next・Private）
    ├── .git/
    ├── src/app/       ← Next.js App Router（雛形）
    ├── reference/     ← 現行WPからの参照物（sample-posts / theme / categories.json）
    ├── docs/          ← 設計・仕様（schema.md / public-page-spec.md）
    ├── migration/     ← ★記事移行の計画（schedule.md ほか・項目31）
    ├── letter_box/    ← レビュー連絡用（inbox / outbox）
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
- **【将来の検討事項】書き手向けの「投稿アプリ」化（スマホ/iPad）**：書き手みんなが毎日気軽に投稿できるよう、投稿画面をアプリのように使えるようにしたい、という要望あり（SAKIさん）。
  - **おすすめ＝① PWA（ホーム画面に追加）**：今のNext.jsに PWA の仕組みを少し足すだけで、スマホ/iPadのブラウザから「ホーム画面に追加」→アプリのアイコン化→アドレスバー無しの全画面で投稿できる。**App Store審査・年会費（Apple 年約99ドル）不要・追加コストほぼゼロ**でコストゼロ方針に合致。写真投稿・カメラ起動も可。**まずはこれで十分**。
  - ② 本物のネイティブアプリ（App Store/Google Play 配布）：React Native 等で作れるが、Apple Developer 年約99ドル＋ストア審査＋別アプリの保守が必要。①で足りなければ将来検討。
  - **着手タイミング**：投稿画面（`/admin`）が固まる頃＝デプロイ準備のあたりで PWA 対応を足すのがちょうどよい。今すぐは不要。
