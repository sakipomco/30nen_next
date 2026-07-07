# 本番投入 手順書（本移行①・②）＝ 記事を new.30nen.com に入れる段取り

最終更新: 2026-07-06（全件リハーサル成功を受けて作成。**設計のみ・まだ実行していない**）
対象: 残課題 **H**（本番DB初期化手順の確立）／Go/No-Goチェックリストの「本移行」

> この手順書は「本番の書き手アカウントを壊さずに、8,260件の記事と画像を本番サイトへ入れる」ための段取りです。
> **まだ実行しません。** SAKIさんと日取り・段取りを確認してから、この通りに進めます。

---

## 0. いちばん大事な考え方（なぜこの方式か）

本番（new.30nen.com＝VPS）には、すでに**手作業で作った本物の書き手アカウント18名分**が入っています。
そこには **顔写真・自己紹介・誕生日・居住地・SNS**（手入力）と、まだパスワード設定前の人の
**招待リンクの引換券（招待トークン）** も入っています。**これらは絶対に消してはいけません。**

そこで本方式は「**本番DBをそっくり手元(Mac)にコピーして、そのコピーに記事だけ足し、
足し終わったDBを本番へ戻す**」という進め方にします。

- コピーから始めるので、**アカウント・プロフィール・招待トークンはそのまま引き継がれる**（守られる）。
- 記事を運ぶスクリプトは **Mac でしか動かない部品（HEIC変換の `sips`）** を使うので、組み立てはMac側で行う。
- 画像（約6.5GB）は別途 rsync で本番へ送る（記事本文の画像URLは移行時に `/uploads/…` へ書き換え済み）。

### ⚠ 作業中の約束（データを1つも失わないため）
- **手元にDBをコピーしてから、本番へ戻すまでの間（約30〜60分）は、本番サイトをいじらない。**
  - 具体的には：この時間帯は **新しい書き手の招待・プロフィール編集・試し書き投稿をしない**。
  - もしこの間に本番で何か変更すると、コピーに反映されず、戻したときに消えてしまうため。
  - 書き手には事前に「◯時〜◯時はメンテナンス中」と一言伝えておくと安心。

---

## 1. 前提（一度きりの確認）

- 本番VPS: `ssh -i ~/.ssh/30nen_vps root@162.43.43.144`
- 本番プロジェクト: `/var/www/30nen_next`
  - DB: `data/30nen.db` ／ 画像: `public/uploads/` ／ 秘密設定: `.env.local`（いずれもgit管理外＝守られる）
- **MacとVPSのコード（gitのコミット）を同じにしておく**（DBの設計図＝スキーマを一致させるため）。
  - まずMac側の変更を push → 本番で `bash /var/www/30nen_next/scripts/deploy-prod.sh` を実行して最新化。
  - ※push は必ずSAKIさんに確認してから。

---

## 2. 事前バックアップ（Go条件・必ず取る）

本番VPSにログインして、DBと画像を丸ごと控えておく（失敗しても戻せるように）。

```bash
ssh -i ~/.ssh/30nen_vps root@162.43.43.144
cd /var/www/30nen_next
# DBの安全なスナップショット（.backup＝書き込み中でも壊れないコピー）
STAMP=$(date +%Y%m%d-%H%M%S)
sqlite3 data/30nen.db ".backup data/30nen.db.bak-$STAMP"
cp .env.local .env.local.bak-$STAMP
ls -lh data/*.bak-* .env.local.bak-*
# 画像はサイズが大きいので、別ドライブ/バックアップ運用（docs/backup-plan.md）に従う
```

---

## 3. 手順（本移行①：全件を一括で入れる）

### ステップ A — 画像を先に本番へ送る（先にやってOK・止めなくてよい）
Mac側の `public/uploads/`（リハーサルで作った約6.5GB・記事の全画像入り）を本番へ同期する。
**追加するだけ**なので、本番を止めずに事前に済ませておける。

```bash
# Mac のプロジェクトフォルダで実行
cd ~/Desktop/30nen_next
rsync -avz --progress \
  -e "ssh -i ~/.ssh/30nen_vps" \
  public/uploads/ \
  root@162.43.43.144:/var/www/30nen_next/public/uploads/
```
> `logo/`（連載ロゴ）や既存画像も含めて同期される。すでにあるファイルは飛ばされる（差分転送）。

### ステップ B — 本番DBを手元にコピーする（★ここから“約束”の時間帯が始まる）
```bash
# 本番VPSで安全なスナップショットを作り（2章と同じ）、それをMacへ持ち帰る
ssh -i ~/.ssh/30nen_vps root@162.43.43.144 \
  "cd /var/www/30nen_next && sqlite3 data/30nen.db '.backup data/_forimport.db'"
scp -i ~/.ssh/30nen_vps \
  root@162.43.43.144:/var/www/30nen_next/data/_forimport.db \
  ~/Desktop/30nen_next/data/prod-import.db
```

### ステップ C — コピーのスキーマを最新化（保険）
```bash
cd ~/Desktop/30nen_next
DATABASE_PATH=data/prod-import.db npm run db:migrate
```

### ステップ D — 著者番号(wp_id)を付与 → 不足アカウントを作成
記事は wp_id で書き手にひもづくため、**必ずこの順番で**。

```bash
# ① 手作業アカウントに wp_id を付与（まずお試しで確認 → 本実行）
DATABASE_PATH=data/prod-import.db node --env-file=.env.local --import tsx scripts/backfill-wp-ids.ts --dry-run
DATABASE_PATH=data/prod-import.db node --env-file=.env.local --import tsx scripts/backfill-wp-ids.ts

# ② 対応表にいてDBに居ない人（休止中のクロウタドリ等）を作成（既存はwp_idで自動スキップ＝冪等）
DATABASE_PATH=data/prod-import.db node --env-file=.env.local --import tsx scripts/migrate-users.ts
```
> クロウタドリはメールを送らない運用（HANDOFF）。migrate-users は招待メールを飛ばさない。

### ステップ E — 記事を入れる（お試し → 本実行）
```bash
# お試し（DBに書かず件数だけ）— 照合OK ✅ を確認
DATABASE_PATH=data/prod-import.db node --env-file=.env.local --import tsx \
  scripts/migrate-articles.ts --dry-run --posts migration/export/posts

# 本実行（画像は本番へ送付済みなので、ほぼ全部“既にある”で即スキップ＝速い）
DATABASE_PATH=data/prod-import.db node --env-file=.env.local --import tsx \
  scripts/migrate-articles.ts --download --posts migration/export/posts
```
> `--download` でも、画像は既に `public/uploads/` にあるので **ダウンロードもHEIC変換も走らず**、
> 一瞬で「既にある」と飛ばす（安全）。新規の数枚だけ取りに行く。

### ステップ F — 手元で検証（本番へ戻す前の最終チェック）
```bash
sqlite3 data/prod-import.db "SELECT COUNT(*) FROM articles;"                    # ≒ 8,260
sqlite3 data/prod-import.db "SELECT COUNT(*) FROM articles WHERE author_id IS NULL;"    # 0
sqlite3 data/prod-import.db "SELECT COUNT(*) FROM articles WHERE category_id IS NULL;"  # 0
sqlite3 data/prod-import.db "SELECT COUNT(*) FROM users;"                       # アカウント数が減っていないこと
sqlite3 data/prod-import.db "SELECT COUNT(*) FROM articles WHERE content LIKE '%30nen.com/wp-content%';" # 0
sqlite3 data/prod-import.db "SELECT COUNT(*) FROM articles WHERE content LIKE '%the30nen.xsrv.jp%';" # 0
```
> **users の件数が事前より減っていないか**を必ず確認（アカウントが守られている証拠）。

### ステップ G — 仕上がったDBを本番へ戻す → 再起動
```bash
# 本番へ送る（戻す先は本番の data/30nen.db を上書き）
scp -i ~/.ssh/30nen_vps \
  ~/Desktop/30nen_next/data/prod-import.db \
  root@162.43.43.144:/var/www/30nen_next/data/30nen.db.incoming

# 本番でひと呼吸おいて差し替え＋再起動
ssh -i ~/.ssh/30nen_vps root@162.43.43.144 '
  cd /var/www/30nen_next
  mv data/30nen.db data/30nen.db.prev-$(date +%Y%m%d-%H%M%S)
  mv data/30nen.db.incoming data/30nen.db
  pm2 restart 30nen --update-env
'
```
> これで **“約束”の時間帯は終了**（以降は本番をいじってOK）。

---

## 4. 本番での確認（画面・件数）
```bash
# 外から見て動くか
curl -s -o /dev/null -w "top %{http_code}\n" https://new.30nen.com/
# 記事数（管理画面 or 下のSQLで）
ssh -i ~/.ssh/30nen_vps root@162.43.43.144 \
  "cd /var/www/30nen_next && sqlite3 data/30nen.db 'SELECT COUNT(*) FROM articles;'"
```
- ブラウザで `https://new.30nen.com/` を開き、記事一覧・記事本文・画像・書き手プロフィールが出るか目視。
- 旧URL（例 `/oosamanomimiwa/2026/06/25/45564/`）が `/posts/…` に転送されるかも数件確認。

---

## 5. うまくいかない時の切り戻し（ロールバック）
記事が変・アカウントが消えた等、少しでもおかしければ **すぐ元のDBに戻す**。
```bash
ssh -i ~/.ssh/30nen_vps root@162.43.43.144 '
  cd /var/www/30nen_next
  ls data/30nen.db.prev-*      # 直前のを確認
  cp data/30nen.db.bak-XXXXXXXX-XXXXXX data/30nen.db   # 2章で取ったバックアップに戻す
  pm2 restart 30nen --update-env
'
```
> 画像は「足しただけ」なので戻す必要はない（消していない）。

---

## 6. 本移行②（差分・切替直前にやる）
本移行①のあとも WordPress には毎日記事が増える。切替の直前に、**増えた分だけ**を同じ手順で追記する。
- スクリプトは `wp_id` で**重複を自動で飛ばす**ので、ステップ A→G をもう一度なぞるだけ（新記事だけ入る）。
- 事前にもう一度 `migration/export-wp.sh` で最新を書き出し → `split-export.ts` → `derive-aux-files.ts`。
- 画像も rsync（差分だけ転送）。

---

## 7. 注意点まとめ
- **本番DBはコピーから始める** → アカウント・プロフィール・招待トークンが守られる。
- **作業中は本番をいじらない**（コピー〜戻すまでの30〜60分）。書き手に事前告知。
- **必ず事前バックアップ**（DB `.backup` ＋ `.env.local`）。おかしければ即戻す。
- **画像は先送り可**（足すだけ・無停止）。DBの差し替えだけが短い“本番の切替”。
- MacとVPSの**コミットを一致**させてから（スキーマずれ防止）。
- 既知の画像404（3枚）は `known-issues.md` 参照＝記事本文は無事・切替前に判断。
- この作業を**いつやるか**は要相談（計画上の切替目標は 2026-07-29。本移行①はその少し前が定石）。
