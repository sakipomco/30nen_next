# 修正指示：本文画像URLの書き換え漏れ（the30nen.xsrv.jp）

作成: 2026-07-07（別セッションの調査で発見）
**⚠️ 期限: 2026-07-08（火）朝6:00 の本移行①より前に完了させること**
（本移行は `migration/production-import-procedure.md` の手順でMac上の移行スクリプトを使う。
このバグを直さずに移行すると、1,477記事の画像URLが旧サーバー宛のまま本番DBに入る）

## 背景（何が起きているか）

- 記事本文の画像URLは、移行時に `migration/lib/transform.ts` の `rewriteImageUrls` が
  旧サイトの絶対URL → 新サイトの相対パス `/uploads/…` に書き換える。
- ところが書き換え対象の正規表現 `WP_UPLOADS_RE`（transform.ts 13行目付近）は
  `30nen.com/wp-content/uploads/` しかマッチせず、
  **`http://the30nen.xsrv.jp/wp-content/uploads/…` 形式を見逃している**。
  （the30nen.xsrv.jp は現行WordPressが載っているXサーバーの初期ドメイン。
  一部期間の記事がこのドメインで画像を埋め込んでいた）
- このままだと移行後も本文の `<img src>` が旧サーバーを指し続け、
  今は表示できるが**旧サーバー解約と同時に全部リンク切れ**になる。

## 調査済みの事実（再調査不要）

`migration/export/all-posts.json`（全8,261記事・2026-07-07書き出し）を全数調査した結果：

- 該当URLは **2,152箇所・1,477記事**。
- ホストのバリエーションは **`http://the30nen.xsrv.jp` の1種類だけ**
  （https版・www付きは0件。30nen.com 系は既に正しく書き換わる）。
- 全2,152箇所とも `/wp-content/uploads/` 配下（画像・動画の埋め込み）。
- **画像ファイル自体は移行済みなので追加の転送は不要**：
  `migration/derive-aux-files.ts` の抽出正規表現はドメインを見ない
  （`wp-content\/uploads\/(…)` ）ため、xsrv宛画像も各記事の `imagelist.txt` に
  含まれており、リハーサルで配置済み・本番VPSへも rsync 済み（項目84）。
  例：記事ID 30 の `2025/01/IMG_6658-scaled.jpg` は imagelist に入っていることを確認済み。
- つまり**直すのは「本文URLの書き換え」だけ**。

## 修正内容（2ファイル）

### 1. `migration/lib/transform.ts`

`WP_UPLOADS_RE` を the30nen.xsrv.jp にもマッチするよう拡張する。例：

```ts
// 旧サイトの画像ベースURL（http/https・www有無・Xサーバー初期ドメインを吸収）。
const WP_UPLOADS_RE =
  /https?:\/\/(?:(?:www\.)?30nen\.com|the30nen\.xsrv\.jp)\/wp-content\/uploads\//gi;
```

- `rewriteImageUrls` 内の HEIC→jpg 変換は `/uploads/` 置換の**後**に走るので、
  xsrv宛の HEIC も追加対応なしで自動的に効くようになる（変更不要）。
- `transformContent`（migrate-articles.ts が呼ぶ入口）も変更不要。

### 2. `migration/production-import-procedure.md`（検証コマンドの追記）

124行目付近に移行後の残存チェックがある：

```
sqlite3 data/prod-import.db "SELECT COUNT(*) FROM articles WHERE content LIKE '%30nen.com/wp-content%';" # 0
```

`LIKE '%30nen.com/wp-content%'` は `the30nen.xsrv.jp` を拾えない（別文字列）ので、
すぐ下に xsrv 版のチェックを1行追加する：

```
sqlite3 data/prod-import.db "SELECT COUNT(*) FROM articles WHERE content LIKE '%the30nen.xsrv.jp%';" # 0
```

## 検証手順

1. 単発スクリプトで書き換え結果を直接確認（使い捨て・コミットしない）：
   - `migration/export/posts/30.json` の `post_content` を `transformContent` に通し、
     出力に `the30nen.xsrv.jp` が**残っていない**こと、
     `/uploads/2025/01/IMG_6658-scaled.jpg` が**含まれる**ことを確認。
   - 既存の書き換え（`30nen.com/wp-content` → `/uploads/`）が壊れていないことも
     30nen.com 形式を含む適当な記事で1件確認（回帰チェック）。
2. `npx tsc --noEmit` と `npm run lint` を通す。
3. （任意・時間があれば）練習用DBを新規に作って
   `migrate-articles --posts migration/export/posts` を数十件で流し、
   `content LIKE '%the30nen.xsrv.jp%'` が0件になることを確認。
   ※ フルリハーサル（8,260件・約1時間）のやり直しは不要。

## 注意・約束ごと

- **git push はユーザー確認なしに絶対しない**（コミットまではOK。CLAUDE.md 参照）。
- 現行WordPress（`~/Desktop/30nen_pj`・本番 `the30nen.xsrv.jp`・30nen.com）は読み取りのみ。
- この修正は**Mac上で動く移行スクリプトだけ**の変更なので、本番VPSへのデプロイは不要
  （明日の本移行はMacで取り込み→DBファイルを本番へ戻す方式。Webアプリのコードは無関係）。
  HANDOFF に「MacとVPSは 62c9c85 で一致」とあるが、この修正でMacが先行してもOK。
- `data/rehearsal.db` は練習用なので直さなくてよい（明日は本番DBのコピーに新規取り込み）。

## 完了後

- コミットメッセージ例：「移行の画像URL書き換えに the30nen.xsrv.jp を追加（2,152箇所の書き換え漏れ修正）」
- `HANDOFF.md` の先頭サマリーに1行追記を提案する
  （明日の本移行①の前提修正が完了した旨＋コミットハッシュ）。

## 参考（このバグと別件・今回は触らない）

STUDIO時代の記事間リンク（`30nen.com/posts/旧スラッグ` 形式・194リンク/151記事）も
リンク切れだが、こちらは対応表づくりが必要な別作業として後日実施予定。
このセッションでは手を出さないこと。
