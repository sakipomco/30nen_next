#!/usr/bin/env bash
# DBの毎日バックアップ（VPSで cron 実行）。
#   SQLiteを安全にスナップショット → .env.local も同梱 → 暗号化してGoogle Driveへ → 古い世代を整理。
#   詳しい方針は docs/backup-plan.md を参照。
#
# 前提（本契約後にセットアップ）:
#   - rclone をインストール済み
#   - rclone remote「gdrive-crypt」（暗号化・中身はGoogle Driveの 30nen-backup）を設定済み
#   - cron 例: 0 4 * * * /var/www/30nen_next/scripts/backup/backup-db.sh >> /var/log/30nen-backup.log 2>&1
#   - 失敗したときはメールで知らせる（.env.local の BACKUP_ALERT_TO 宛）。しくみは _notify.sh
set -euo pipefail

APP="${APP:-/var/www/30nen_next}"
REMOTE="${REMOTE:-gdrive-crypt:30nen-backup}"
KEEP_DAYS="${KEEP_DAYS:-30}"   # 何日分残すか

# 失敗したら店主あてにメールで知らせる（_notify.sh 参照）。
BACKUP_JOB_NAME="DBバックアップ"
source "$(dirname "$0")/_notify.sh"

STAMP="$(date +%Y%m%d-%H%M%S)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

echo "[$(date)] DBバックアップ開始: $STAMP"

# ① 稼働中でも整合性のあるスナップショットを作る（.backup は WAL を考慮する）
sqlite3 "$APP/data/30nen.db" ".backup '$TMP/30nen-$STAMP.db'"

# ② 復旧に必須の秘密設定も同梱（小さい）
if [ -f "$APP/.env.local" ]; then
  cp "$APP/.env.local" "$TMP/env.local-$STAMP"
fi

# ③ 暗号化してアップロード（rclone crypt が転送時に暗号化＝Drive上は中身もファイル名も読めない）
rclone copy "$TMP/" "$REMOTE/db/"

# ④ 古い世代を整理（KEEP_DAYS より古いものを削除）
rclone delete "$REMOTE/db/" --min-age "${KEEP_DAYS}d" || true

echo "[$(date)] DBバックアップ完了: $STAMP"
