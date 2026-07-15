# バックアップ実稼働 当日の台本（チェックリスト）

作成: 2026-07-14 ／ 前提の設計は `docs/backup-plan.md`。ここは「実際に手を動かす順番」だけをまとめた当日用。

> 進め方＝上から順に消し込む。**［SAKI］**＝店主の操作が要る所／**［Claude］**＝私がサーバーで実行／**［一緒に］**＝画面を見ながら二人で。
> サーバー＝Xサーバー VPS（IP **162.43.43.144**）。現行の 30nen.com（WordPress）には一切触れない。

> **📌 進捗（2026-07-15）**: 山①・山②は**完了**（初回フル転送＝画像16,259枚・7.32GiB／DB＋.env.local がDriveに到達済みを確認。cron登録済み）。**残るは山③復旧テスト（Go条件）のみ**（パスワードの控え2か所もSAKI確認済み）。

---

## 事前に決めておく2つ

- [x] **［SAKI］保存先のGoogleアカウント**を決める（バックアップを預けるDrive。無料15GBで足りる＝DBは軽い・画像 約6.5GB）。
- [x] **［SAKI］暗号化パスワード**を用意（その場で決めてもOK）。⚠**失うと二度と開けない**→決めたら山①-Cで「サーバーの外」に2か所控える。

---

## 山①：準備（サーバーで1回だけ・約30分）✅ 完了

### A. rclone を入れる ［Claude］
- [x] `sudo apt update && sudo apt install -y rclone`
- [x] `rclone version` でインストール確認。

### B. Google Drive とつなぐ ［一緒に］
サーバーには画面がない（＝ブラウザでGoogleログインできない）ので、**SAKIさんのMacで許可 → 合言葉をサーバーに貼る**方式で行う（rcloneの正規手順「remote authorize」）。

- [x] サーバー側で `rclone config` を開始 → `n`（新規）→ 名前 `gdrive` → 種類は Google Drive を選ぶ。
- [x] client_id / secret は空Enter（既定でOK）。scope は「全アクセス(1)」。
- [x] 「ブラウザで自動認証しますか？」で **No（サーバーに画面が無いため）** を選ぶ → サーバーが `rclone authorize "drive"` というコマンドを表示。
- [x] **［SAKI］そのコマンドをMacのターミナルで実行** → ブラウザが開くので **保存先に決めたGoogleアカウントでログイン→許可** → Macに出た合言葉（長い文字列）をコピー。
- [x] その合言葉をサーバー側に貼る → `gdrive`（Drive本体）が完成。

### C. 暗号化レイヤ（gdrive-crypt）を作る ［一緒に］
- [x] `rclone config` を続け、新規 `n` → 名前 **`gdrive-crypt`** → 種類 `crypt`。
- [x] `remote` に **`gdrive:30nen-backup`** を指定（＝Drive内の 30nen-backup フォルダを暗号化で包む）。
- [x] ファイル名も暗号化する設定を選ぶ（standard）。
- [x] **［SAKI］暗号化パスワード**（password と、任意で password2＝塩）を入力。
- [x] **［SAKI］いま入れたパスワードを、パスワード管理アプリ＋紙にも控える**（サーバーの外に2か所）。✅ ただし**山③復旧テスト（7/15）で控えの不備を発見**＝控えは20文字だが、本物は初回設定時に貼り付けが2回重なった**40文字**で登録されていた（控えのままでは開けられない状態だった）。`rclone reveal` で本物をSAKIの画面にのみ表示 → **紙＋アプリの控えを40文字に修正済み**・修正後の控えから作った鍵で開くことを実証済み（2026-07-15）。
- [x] 動作確認: `rclone lsd gdrive-crypt:` がエラーなく通る（空でOK）。

---

## 山②：自動運転をセット（サーバーで1回だけ・約5分）✅ 完了（2026-07-15）

スクリプトは既に `scripts/backup/` にある（`backup-db.sh`・`backup-uploads.sh`）。登録するだけ。

- [x] まず手で1回ずつ動かして通ることを確認:
  - `bash /var/www/30nen_next/scripts/backup/backup-db.sh`（DB＋.env.local が暗号化されてDriveへ）✅ 7/14実行＝`30nen-20260714-141211.db`＋`env.local-20260714-141211` がDriveに到達
  - `bash /var/www/30nen_next/scripts/backup/backup-uploads.sh`（画像がDriveへ・初回は6.5GBで時間かかる）✅ 7/14実行＝約7時間で完走（SSHが切れても走り切った）
- [x] Drive側に中身が届いたか確認: ✅ 7/15確認＝`rclone size gdrive-crypt:30nen-backup/uploads` → **16,259個・7.321GiB**（サーバー側 16,259枚・7.4G と一致）／`db/` に `.db` と `env.local-…` あり。
- [x] cron に登録（7/15・SAKIがターミナルで実施→ `crontab -l` で2行を確認済み）:
  ```cron
  # DB: 毎日 4:00
  0 4 * * *  /var/www/30nen_next/scripts/backup/backup-db.sh      >> /var/log/30nen-backup.log 2>&1
  # 画像: 毎週日曜 4:30（差分）
  30 4 * * 0 /var/www/30nen_next/scripts/backup/backup-uploads.sh >> /var/log/30nen-backup.log 2>&1
  ```
- [x] ⚠**時刻の注意**＝cronはサーバーの時計で動く。→ ✅ ログイン画面の表示で **JST（日本時間）を確認済み**＝「4時」はそのまま日本の深夜4時。

> メモ（7/15）: サーバーに「システムの再起動が必要です」表示あり。**バックアップ時間帯（深夜4時台）を避けた日中**に、完了確認のうえ実施する。

---

## 山③：復旧テスト（★本番切替のGo条件・約30分〜1時間）［一緒に］◀ 次はここ

「預けられた」だけでなく**本当に戻せる**かを1回だけ実演する。詳細は `backup-plan.md` §4。

- [ ] 戻し先を用意（空フォルダ or 検証用の別ディレクトリ。本番 `/var/www/30nen_next` は触らない）。
- [ ] rclone に **同じ暗号化パスワードで** `gdrive-crypt` を再設定（＝鍵が要ることの実証）。
- [ ] 取り出す:
  - DB: `rclone copy gdrive-crypt:30nen-backup/db/<最新>.db ./data/30nen.db`
  - 画像: `rclone copy gdrive-crypt:30nen-backup/uploads ./public/uploads`
  - 秘密設定: `env.local-<最新>` を `.env.local` に戻す
- [ ] `npm ci` → `npm run build` → 起動 → **記事・画像・ログインが正常か確認**。
- [ ] 通ればGo条件クリア。詰まった所はこのファイルに追記する。

---

## 済んだら

- [x] `migration/remaining-tasks.md` D項（バックアップ実稼働）に✅（7/15）。復旧リハーサルの行は山③完了時に。
- [x] `HANDOFF.md` に結果を記録（7/15）。
- [ ] 定期の見守り（`backup-plan.md` §5）＝ログ確認・Drive残量・半年に1回の復旧テスト・パスワード控えの生存確認。
