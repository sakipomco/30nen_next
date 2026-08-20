# バックアップ計画（30nen_next）

決定日: 2026-06-25（SAKIさんと合意）／ 実装タイミング: VPS本契約後

> 目的: VPS（借りたサーバー）が壊れる・乗っ取られる・操作ミスで消す が起きても、**サイトを元に戻せる**ようにする。
> 現行WordPressはXサーバーが自動バックアップしていたが、新システムは自前VPSなので**自分で備える**。

---

## 0. 何を守るか（おさらい）

| 守るもの | 場所 | 大きさ | 中身 |
|---|---|---|---|
| **DB**（台帳） | `data/30nen.db` | 約23MB | 全記事の文章・全アカウント・連載・設定 |
| **画像**（実物） | `public/uploads/` | 約6.5GB | 写真・動画 |
| 秘密設定 | `.env.local` | ごく小 | 鍵（SESSION_SECRET 等） |
| サーバー設定 | Nginx・PM2 | ごく小 | 構成（`docs/deploy-notes.md` にも記録あり） |

合言葉は **3-2-1**（コピーを2〜3個・置き場所2か所以上・うち1個はサーバーの外）。

---

## 1. 合意した方針

- **保存先（サーバーの外）＝ Google Drive**（SAKIさんの**自分だけの非公開フォルダ**）。
- **暗号化する**＝送る前に暗号化し、鍵（パスワード）がないと中身を開けない。DBに書き手さんの**メール・誕生日などの個人情報**が入るため。
- **頻度**:
  - **DB ＝ 毎日**（軽いので負担ゼロ。30日分を保持）
  - **画像 ＝ 週1回の差分**（増えるのは1日数枚なので、変わったぶんだけ追加）
- ツール: VPSに **rclone**（クラウドへ自動転送する無料ツール）を入れ、**rclone の暗号化(crypt)** で暗号化アップロード。

> ⚠ **最重要の注意**: 暗号化のパスワードを失うと、バックアップは二度と開けません。
> パスワードは **VPSの外**（SAKIさんのパスワード管理アプリ＋紙などにも）必ず控える。VPSが消えても鍵だけは手元に残す。

---

## 2. セットアップ（VPSで1回だけ・本契約後）

1. rclone を入れる: `sudo apt install rclone`（または公式スクリプト）。
2. `rclone config` で2つの保存先を作る:
   - `gdrive` … Google Drive 本体（ブラウザでGoogleにログインして許可＝OAuth、1回だけ）。
   - `gdrive-crypt` … `gdrive` を包む**暗号化レイヤ**（`type=crypt`・`remote=gdrive:30nen-backup`・パスワード設定）。
     → 以後 `gdrive-crypt:` に送るものは自動で暗号化され、ファイル名も隠れる。
3. パスワード（crypt の password / password2）を**パスワード管理アプリに保存**（復旧時に必須）。
4. バックアップ用フォルダを Google Drive 側に用意（rcloneが自動作成でも可）。

---

## 3. 自動実行（cron）

VPSの cron に2本を登録（時刻は負荷の少ない深夜・日本時間想定。サーバーTZに合わせる）。

```cron
# DB: 毎日 4:00
0 4 * * *  /var/www/30nen_next/scripts/backup/backup-db.sh      >> /var/log/30nen-backup.log 2>&1
# 画像: 毎週日曜 4:30（差分）
30 4 * * 0 /var/www/30nen_next/scripts/backup/backup-uploads.sh >> /var/log/30nen-backup.log 2>&1
```

スクリプト本体は `scripts/backup/` にある（このリポジトリで管理）。中身:
- `backup-db.sh` … SQLiteを**安全にスナップショット**（`.backup`＝稼働中でも整合性OK）＋`.env.local`も同梱 → 暗号化してDriveへ → 30日より古い世代を削除。
- `backup-uploads.sh` … `public/uploads/` を **rclone copy**（追加のみ・消さない）で暗号化Driveへ。

---

## 4. 復旧（リストア）手順 ＝ ★Go条件のテスト

「取れている」だけでは不十分。**空のVPSに戻してサイトが立ち上がるか**を、本番Go前に1回実演する（レビューR-02）。

1. 新しい（空の）VPSを用意し、`docs/deploy-notes.md` の手順でアプリを建てる（Node→コード配置→`npm ci`→`npm run build`）。
2. rclone を入れ、`gdrive-crypt` を**同じパスワードで**再設定（鍵が要る！）。
3. 最新のバックアップを取り出す:
   - DB: `rclone copy gdrive-crypt:30nen-backup/db/<最新>.db ./data/30nen.db`
   - 画像: `rclone copy gdrive-crypt:30nen-backup/uploads ./public/uploads`
   - 秘密設定: `env.local-<最新>` を `.env.local` に戻す
4. PM2で起動 → Nginx経由で表示 → **記事・画像・ログインが正常か確認**。
5. ここまで通ればGo条件クリア。手順の詰まりはこのファイルに追記する。

---

## 5. 運用の確認ポイント（定期）

- [x] バックアップが**毎日できているか** → **失敗したらメールで知らせる仕組みを導入済み（2026-08-20）**。
  失敗した瞬間に `BACKUP_ALERT_TO` 宛へメールが飛ぶ（`scripts/backup/_notify.sh` ＋ `notify-backup-failure.ts`）。
  ⚠ ただし **cron ごと止まった場合・サーバーが落ちた場合は誰にも届かない**（動いてこその通知）。念のため時々 `/var/log/30nen-backup.log` を見る。
- [ ] Google Drive の**残量**（無料15GBで足りるか／不足なら100GBプラン等）。
- [ ] **半年〜1年に1回**、復旧テストを再実施（手順が今も通るか）。
- [ ] 暗号化パスワードの控えが**手元に残っているか**。

---

## 6. なぜGitHubに置かないか
DBは**個人情報を含む**うえ、画像は**重い**。Gitはソースコード管理用で、こうしたデータの保管先には不向き。暗号化したうえで**Google Drive（非公開）**に置くのが目的に合う。
