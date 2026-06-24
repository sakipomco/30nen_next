# 全記事の書き出し手順（現行WordPress → 手元のファイル）

作成日: 2026-06-24 ／ 対象: 30nen.com の公開記事 **約7,999件**（移行時にID282を除外して7,998件）

> このファイルは「**現行サイトから全記事を、移行スクリプトが読める形で取り出す**」ための手順書です。
> ここに書いた作業は **すべて「読み取りのみ」**＝現行サイト（30nen.com）には何も書き込まず・止めず・壊しません。
> ※ この手順書は**段取りの説明**です。実際の書き出しは、SAKIさんの「やってOK」を合図に別途実行します。

---

## 0. いまどこの話？

記事の移行は、大きく2段階に分かれます。

```
 ①書き出し（このファイル）          ②取り込み（別の段階）
 現行WPを読むだけ → 手元にコピー  →  手元のスクリプトで新システムDBへ
 （現行サイトは無傷）                （新システム側に書くだけ）
```

- **①書き出し＝現行サイトを「読むだけ」**。記事のコピーを手元のパソコンに集める作業。サイトには影響なし。
- **②取り込み＝今日(2026-06-24)作った移行スクリプト**（`scripts/migrate-articles.ts`）を流す作業。①で集めたファイルを新システムに入れる。練習用DBに入れる間は完全に安全。

このファイルは **①書き出し** の手順です。

---

## 1. 用意するもの（前提）

- **現行サーバーへのSSH接続**（設定済み）: `ssh xserver-30nen`
  - 接続先: `the30nen@the30nen.xsrv.jp`（ポート10022・鍵 `~/.ssh/30nen_xserver`）
  - WordPress本体: `/home/the30nen/30nen.com/public_html`
  - WP-CLI（記事を読み出す道具）: `php7.4 /usr/bin/wp …`（既定のphpは古いので必ず `php7.4` を付ける）
- **書き出しスクリプト**: `migration/export-wp.sh`（高速版。サーバーへ送って実行＝**まとめ取り2回**）
- **分割**: `migration/split-export.ts`（手元で実行＝まとめファイルを1記事ごとに分ける）
- **補助ファイル生成**: `migration/derive-aux-files.ts`（手元で実行する後処理）

---

## 2. しくみ（速いやり方＝まとめ取り）

1件ずつ聞くと8,101件で数時間かかるため、**サーバーへのアクセスは2回だけ**にして、
細かい分割は手元(ローカル)で行います。

| 段階 | 何を作る | 場所 |
|---|---|---|
| ① 書き出し | `all-posts.json`（記事本体の配列）／`all-categories.tsv`（連載対応） | サーバー（export-wp.sh・**2回のまとめ取り**） |
| ② 分割 | `<ID>.json`／`<ID>.categories.json`（1記事ごと） | 手元（split-export.ts） |
| ③ 補助 | `<ID>.author_id.txt`／`<ID>.imagelist.txt` | 手元（derive-aux-files.ts） |

③まで終わると、サンプル `reference/sample-posts/posts/` と同じ **1記事4ファイル**構成になり、
移行スクリプト `migrate-articles.ts` がそのまま使えます。

---

## 3. 手順

### STEP 1. まず少数で試運転（おすすめ・必須）
本番サーバーなので、いきなり全件ではなく、まず20件ほどで形を確かめます。

```bash
# 手元から書き出しスクリプトをサーバーへ送る
scp migration/export-wp.sh xserver-30nen:~/export-wp.sh

# サーバーにログイン
ssh xserver-30nen

# （サーバー上で）本体は先頭20件だけ取得する試運転
LIMIT=20 bash ~/export-wp.sh
# → ~/30nen_export/ に all-posts.json（20件）と all-categories.tsv ができる
```

### STEP 2. 全件を書き出す
試運転がOKなら、件数制限なしで全件。**まとめ取り2回なので数分**で終わります。

```bash
# （サーバー上で）全件書き出し
bash ~/export-wp.sh
# → 「記事本体 約 8101 件＋カテゴリ対応表」と表示される
```

### STEP 3. 手元のパソコンへ持ち帰る（rsyncは2ファイルだけ）

```bash
# （手元のターミナルで）サーバー → 手元へ転送
mkdir -p migration/export
rsync -avz xserver-30nen:~/30nen_export/all-posts.json xserver-30nen:~/30nen_export/all-categories.tsv migration/export/
```

### STEP 4. 1記事ごとに分割（手元）

```bash
node --import tsx migration/split-export.ts migration/export
# → migration/export/posts/ に <ID>.json と <ID>.categories.json ができる
```

### STEP 5. 補助ファイル（author_id / imagelist）を手元で生成

```bash
node --import tsx migration/derive-aux-files.ts migration/export/posts
# → 各 <ID>.author_id.txt と <ID>.imagelist.txt が作られる
```

### STEP 6. 件数の確認
書き出せた件数が想定と合うかを照合します（移行直前の公開記事数。2026-06-24時点で約8,101）。

```bash
ls migration/export/posts/*.json | grep -v categories | wc -l
# → 約8,101 になればOK（移行時にID282を除外して1件少なく取り込まれる）
```

---

## 4. このあと（②取り込み＝S4リハーサルへ）

書き出しが揃ったら、今日作った移行スクリプトの入力先をこのフォルダに向けて流します（まず練習用DBへ）。

```bash
# 練習用DBを用意（初回のみ）
rm -f data/migrate-test.db
DATABASE_PATH=data/migrate-test.db npx drizzle-kit migrate

# 連載・著者を作る
DATABASE_PATH=data/migrate-test.db node --env-file=.env.local --import tsx scripts/migrate-categories.ts
DATABASE_PATH=data/migrate-test.db node --env-file=.env.local --import tsx scripts/migrate-users.ts

# まずお試し(dry-run)で件数だけ確認 → 問題なければ本実行
DATABASE_PATH=data/migrate-test.db node --env-file=.env.local --import tsx scripts/migrate-articles.ts --posts migration/export/posts --dry-run
DATABASE_PATH=data/migrate-test.db node --env-file=.env.local --import tsx scripts/migrate-articles.ts --posts migration/export/posts
```

### 画像について
- 本文の画像URLは取り込み時に自動で `/uploads/…` に書き換わります（実装済み）。
- 画像ファイル本体は、取り込み時に **`--download` を付けると現行サイトから取得**します（読み取りのみ）。
  ```bash
  … scripts/migrate-articles.ts --posts migration/export/posts --download
  ```
- 全件ぶんの画像はそれなりの量になるため、S4リハーサルで**総容量・所要時間・欠落数**を計測します（`data-migration-plan.md` §4・§S5）。
- 【未対応・要検討】「軽くして運ぶ」方針（長辺1600px縮小・項目46）の**移行時の自動縮小**は、現在の `--download` では未実装（原寸を取得する）。S4までに縮小を入れるか判断する。

---

## 5. 安全メモ（大事）
- 本手順は**読み取りのみ**。現行サイトの記事・設定・画像を変更・削除しない。
- 必ず **STEP 1（少数の試運転）から**始める。
- 書き出したデータ（`migration/export/`）と練習用DB（`data/migrate-test.db`）は **Git管理外**。
- 何度やり直しても安全（書き出しは読むだけ・取り込みは `wp_id` で冪等＝重複しない）。
