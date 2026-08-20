#!/usr/bin/env bash
# 画像の週1バックアップ（差分・追加のみ）。VPSで cron 実行。
#   public/uploads/ を暗号化してGoogle Driveへ。copy=変わったぶんだけ追加（消さない）。
#   詳しい方針は docs/backup-plan.md を参照。
#
# 前提:
#   - rclone と remote「gdrive-crypt」を設定済み（backup-db.sh と同じ）
#   - cron 例: 30 4 * * 0 /var/www/30nen_next/scripts/backup/backup-uploads.sh >> /var/log/30nen-backup.log 2>&1
#   - 失敗したときはメールで知らせる（.env.local の BACKUP_ALERT_TO 宛）。しくみは _notify.sh
set -euo pipefail

APP="${APP:-/var/www/30nen_next}"
REMOTE="${REMOTE:-gdrive-crypt:30nen-backup}"

# 失敗したら店主あてにメールで知らせる（_notify.sh 参照）。
BACKUP_JOB_NAME="画像バックアップ"
source "$(dirname "$0")/_notify.sh"

echo "[$(date)] 画像バックアップ開始"

# copy = 増えた/変わったファイルだけ追加。削除は伝播しない（事故で消えた画像も当面バックアップに残る）。
rclone copy "$APP/public/uploads" "$REMOTE/uploads/" --fast-list --transfers 4

echo "[$(date)] 画像バックアップ完了"
