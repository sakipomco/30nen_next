# 公開ページ 要件定義書

> 作成日: 2026-06-03  
> 担当: デザイン実装は Claude Design と共同作業  
> 参照: `reference/theme/30nen_original/`（現行WPテーマ一式）

---

## 0. 前提・方針

- **現行 30nen.com にほぼ忠実に再現する**（デザインの大幅な変更はしない）
- フォント: Zen Old Mincho（見出し・サイト名）+ Noto Serif JP（本文）
- カラー: テキスト `#333`、サイト名/アクセント `#150c0c`
- モバイル対応: ハンバーガーメニュー（現行と同じ方式）
- 今回のフェーズで作るのは **トップページ（記事一覧）のみ**

---

## 1. このフェーズで作るもの / 後回しにするもの

| ページ | このフェーズ | 後回し |
|--------|------------|--------|
| トップページ（記事一覧） | ✅ 作る | — |
| 記事詳細ページ | — | ✅ 後回し |
| 連載別一覧ページ | — | ✅ 後回し |
| 著者別一覧ページ | — | ✅ 後回し |

---

## 2. このセッションで完了した事前準備

コードは書き終えているが、**ページファイル自体はまだ作成していない**（中断のため）。

| 作業 | 状態 | 詳細 |
|------|------|------|
| DB クエリ関数の追加 | ✅ 完了 | `src/db/articles.ts` に `listPublishedArticles` / `countPublishedArticles` / `getPublishedArticleBySlug` / `getPublishedArticleById` を追加 |
| 日付フォーマット関数の追加 | ✅ 完了 | `src/lib/datetime.ts` に `formatJstDate`（"2026年6月3日" 形式）を追加 |
| ルートレイアウトの更新 | ✅ 完了 | フォント（Zen Old Mincho・Noto Serif JP）・メタデータ・`lang="ja"` を設定 |
| ロゴ画像のコピー | ✅ 完了 | `30nen_logo_noren_plus.jpg` / `30nen_logo.png` を `public/` にコピー |
| 旧 `page.tsx` の削除 | ✅ 完了 | 新しい `(public)/page.tsx` との衝突を防ぐために削除 |
| フォルダ構造の作成 | ✅ 完了 | `src/app/(public)/posts/[slug]/` と `src/app/(public)/series/[slug]/` を作成 |

---

## 3. まだ必要な DB 変更（要マイグレーション）

### 3-1. `categories` テーブルに画像パス列を追加

右サイドバーの「小商店（連載一覧）」に連載のイメージ画像を出すため。

```sql
ALTER TABLE categories ADD COLUMN image_path TEXT;
-- 例: /uploads/2026/06/tayori-category.jpg
```

**作業内容:**

1. `src/db/schema.ts` の `categories` テーブルに `imagePath: text('image_path')` を追加
2. `npm run db:generate` でマイグレーションファイルを生成
3. `npm run db:migrate` でDBに適用
4. `src/db/categories.ts` の型定義・CRUD関数を更新
5. `/admin/categories/[id]/edit` の編集画面に「連載画像」アップロード欄を追加（`/api/upload` を流用）

---

## 4. トップページの仕様

### 4-1. URL

```
/
```

### 4-2. 全体レイアウト（3カラム構成・現行と同様）

```
┌─────────────────────────────────────────────────────────┐
│ [ハンバーガーメニュー] ← スマホのみ表示                     │
├──────────┬────────────────────────┬────────────────────┤
│ module01 │      module02          │     module03       │
│（左列）   │  （メインコンテンツ）    │  （右サイドバー）    │
│          │                        │                    │
│ ロゴ画像  │ パンくずリスト           │ 小商店（連載一覧）   │
│          │ 最新記事エリア            │ 検索               │
│ SNSリンク │ 記事一覧グリッド          │ アーカイブ          │
│          │ ページネーション           │                    │
│ →三十年   │ コピーライト             │                    │
│   商店   │                        │                    │
│  とは？  │                        │                    │
└──────────┴────────────────────────┴────────────────────┘
```

| カラム | PC幅 | タブレット | スマホ |
|--------|------|-----------|--------|
| module01（左列） | 約200px 固定 | 非表示 | 非表示 |
| module02（中央） | 残り全て | 全幅 | 全幅 |
| module03（右列） | 約220px 固定 | 非表示→ハンバーガー内 | 非表示→ハンバーガー内 |

---

### 4-3. module01（左列）の仕様

| 要素 | 内容 |
|------|------|
| ロゴ画像 | `public/30nen_logo_noren_plus.jpg`（縦長の暖簾型ロゴ）。クリックでトップへ |
| SNS リンク | Instagram `https://www.instagram.com/30nen_syouten/` と X `https://x.com/30nensyouten` を横並び（`\|` で区切る） |
| ボタン | 「三十年商店とは？」→ `/about`（静的ページ・後回しでよい） |
| 「書き手募集」バナー | スマホのみ表示。現行の `kakite_kotira3.png` 画像リンク（`/about#wanted` へ）。**この画像は後回しでよい。** |

参照: `reference/theme/30nen_original/front-page.php` の `<section class="TOP_F_content module01">` ブロック

---

### 4-4. module02（中央）の仕様

#### パンくずリスト

```
三十年商店
```
（トップページは1段のみ）

#### 最新記事エリア（「最新」ラベル付き）

- 公開済み記事のうち最新1件だけを大きく表示
- `<h3 class="common_title01">最新</h3>` のようなラベル
- **デザインは記事カードと同じだが、大きめに表示**（現行サイトを参照）

#### 記事一覧グリッド

- ラベル: `記事一覧`
- 1ページあたり **12件**
- 新しい publishedAt 順（降順）
- グリッド: PC は 3列、タブレットは 2列、スマホは 2列

#### ページネーション（数字リンク）

- 現行と同じスタイル（`«` 前 / `»` 次 + 数字）
- `?page=2` のようなクエリパラメータで制御
- 現在ページはハイライト

#### コピーライト（PCのみ表示）

```
©30YEARS ARCADE
This site is protected by reCAPTCHA and the Google Privacy Policy and Terms of Service apply.
```

---

### 4-5. 記事カードの仕様

```
┌──────────────────────┐
│  アイキャッチ画像      │  ← featured_image_path がある場合のみ
│  （なければ代替画像）   │  ← reference/theme/…/common/jpg/dammy.jpg を参照
├──────────────────────┤
│ 【連載名】             │  ← categoryName
│ 2026年6月3日          │  ← publishedAt を JST で表示
├──────────────────────┤
│ タイトル              │  ← title
└──────────────────────┘
           👤 書き手名   ←  authorName（顔写真は後で追加。まず名前だけでも可）
```

- カード全体がクリッカブル（リンク先: `/posts/{slug}` または `/posts/{id}`）
- アイキャッチがない場合: ダミー画像 `public/dammy.jpg` を表示（`reference/…/common/jpg/dammy.jpg` をコピーして使う）

---

### 4-6. module03（右サイドバー）の仕様

#### 小商店（連載一覧）

- DB の `categories` テーブルから **親連載（parentId が NULL）** を全件取得
- 各連載を画像リンクで表示（正方形サムネイル）
  - 連載に `imagePath` が設定されていれば、その画像を表示
  - 設定されていなければ、`public/line-up.png` を代替表示（`reference/…/common/jpg/line-up.png` をコピー）
- リンク先: `/series/{slug}` または `/series/{id}`（後で記事詳細・連載ページを作るとき）

#### 検索

- フォームのみ設置（このフェーズでは検索機能は **未実装でよい**・後回し）
- `action="/search"` のテキスト入力フォームを置いておく

#### アーカイブ

- 月別アーカイブ（このフェーズでは **未実装でよい**・後回し）
- 「アーカイブ」ラベルとリストの枠だけ置いておく（中身は空でよい）

---

## 5. ハンバーガーメニューの仕様

スマホ表示のとき、右上に「≡（三本線）」ボタンを設置する。
タップすると module03（右サイドバー）の内容がスライドインまたはオーバーレイで表示される。

| 項目 | 内容 |
|------|------|
| 開くボタン | スマホ・タブレットのみ表示。アイコン画像または「≡」テキスト |
| 閉じるボタン | メニュー内に「閉」または「✕」ボタン |
| メニュー内容 | `module03` と同じ（連載一覧 / 検索 / アーカイブ） |
| スクロール | メニューが開いている間はバックグラウンドのスクロールを止める |

参照: `reference/theme/30nen_original/header.php` のハンバーガーメニュー構造

実装方針:
- Client Component（`'use client'`）として分離し、`useState` で開閉を管理
- CSS は Tailwind の `translate-x` や `hidden/block` で切り替え

---

## 6. ファイル構成（作るべきもの）

```
src/
  app/
    (public)/
      layout.tsx        ← 3カラムレイアウト + ハンバーガーメニュー
      page.tsx          ← トップページ（記事一覧）
      posts/
        [slug]/
          page.tsx      ← 記事詳細（後回し）
      series/
        [slug]/
          page.tsx      ← 連載別一覧（後回し）
  components/           ← （新設）共通UIパーツ置き場
    article-card.tsx    ← 記事カード（再利用のため分離）
    hamburger-menu.tsx  ← ハンバーガーメニュー（Client Component）
    sidebar-right.tsx   ← 右サイドバー（連載一覧・検索・アーカイブ）
    sidebar-left.tsx    ← 左サイドバー（ロゴ・SNS・ボタン）
    pagination.tsx      ← ページネーション
  app/
    globals.css         ← 公開ページの記事本文スタイル（prose）を追加
```

---

## 7. `(public)/layout.tsx` に必要な処理

- DB から親連載一覧（`imagePath` つき）を取得 → 右サイドバーへ渡す
- Server Component として実装（DB アクセスはここで行う）
- ハンバーガーメニューは Client Component に切り出す

---

## 8. コピーが必要なアセット

| コピー元（reference フォルダ内） | コピー先（public フォルダ） |
|-------------------------------|--------------------------|
| `common/jpg/dammy.jpg` | `public/dammy.jpg` |
| `common/jpg/line-up.png` | `public/line-up.png` |
| `common/jpg/sp_menu01.png` | `public/sp_menu01.png` |

---

## 9. 記事アクション（actions/articles.ts）に必要な追記

公開ページのキャッシュを更新するため、記事の作成・更新後に `revalidatePath('/')` を追加する。

```typescript
// createArticleAction・updateArticleAction の末尾に追加
revalidatePath('/'); // 公開ページのキャッシュを更新
```

---

## 10. 型チェック・Lint について

実装後は必ず以下を実行してクリーンにすること:

```bash
npx tsc --noEmit       # 型チェック
npx eslint src/        # Lint チェック
```

---

## 11. 動作確認チェックリスト

- [ ] トップページ（`/`）がブラウザで表示される
- [ ] 公開記事が新しい順に最大12件表示される
- [ ] 最新1件が上部の「最新」エリアに大きく表示される
- [ ] 未来日時の記事は表示されない（予約投稿対応）
- [ ] 2ページ目以降（`?page=2`）に遷移できる
- [ ] ページネーションの現在ページがハイライトされる
- [ ] 記事カードのリンクをクリックすると `/posts/{id}` に飛ぶ（記事詳細は後回しなので 404 でよい）
- [ ] PC: 3カラムが正しく表示される
- [ ] スマホ: 1カラム + ハンバーガーメニューが動く
- [ ] 右サイドバーに連載一覧が表示される
- [ ] アイキャッチがない記事はダミー画像が表示される

---

## 12. 後回しにしたもの（フェーズ2以降）

- 記事詳細ページ（`/posts/[slug]`）
- 連載別一覧ページ（`/series/[slug]`）
- 著者別一覧ページ
- 著者の顔写真アップロード機能
- 月別アーカイブ機能
- 全文検索機能
- `/about` などの静的ページ
