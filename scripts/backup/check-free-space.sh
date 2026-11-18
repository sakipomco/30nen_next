#!/usr/bin/env bash
# Google Drive の空きが少なくなったら、あふれる前にメールで知らせる見張り役。
# backup-db.sh の最後から毎日1回呼ばれる。
#
# なぜ必要か:
#   容量があふれるとバックアップが止まる。失敗してからでも通知は届くが、
#   「止まってから気づく」より「止まる前に気づく」ほうが当然よい。
#   これがあれば「何月にプランを上げるか」をカレンダーで決めなくて済む。
#
# しきい値の考え方（2026-11-18時点の実測）:
#   増えるペースは月 約0.41GB。既定の 1.5GB で知らせれば、満杯まで約3.5か月の余裕がある。
#   写真のペースが倍になっても約2か月は残る。
#
# ★ここで何が起きてもバックアップ本体は止めない（set -e は使わない。呼び元も || true）。
#
# 設定（必要なら .env.local や cron で上書きできる）:
#   BACKUP_MIN_FREE_GB  … 何GBを切ったら知らせるか（既定 1.5）
#   ABOUT_REMOTE        … 空きを調べる相手（既定 gdrive:。暗号化レイヤではなくDrive本体）
#   BACKUP_LOWSPACE_COOLDOWN_DAYS … 一度知らせたら何日は黙るか（既定 7。毎日届くのを防ぐ）

APP="${APP:-/var/www/30nen_next}"
ABOUT_REMOTE="${ABOUT_REMOTE:-gdrive:}"
MIN_FREE_GB="${BACKUP_MIN_FREE_GB:-1.5}"
STATE_FILE="${BACKUP_LOWSPACE_STATE:-/var/lib/30nen-backup/lowspace-notified}"
COOLDOWN_DAYS="${BACKUP_LOWSPACE_COOLDOWN_DAYS:-7}"

# ① 空きを調べる（--json ＝バイト数で返る。表示用の "3.289 GiB" を読むより確実）
json="$(rclone about "$ABOUT_REMOTE" --json 2>/dev/null)" || json=""
free_bytes="$(printf '%s' "$json" | tr -d ' \t' | grep -o '"free":[0-9]*' | head -1 | cut -d: -f2)"

if [ -z "${free_bytes:-}" ]; then
  # 調べられなくても騒がない（ネットの一時不調など）。バックアップ自体は成功している。
  echo "[$(date)] 空き容量を調べられませんでした（見張りはスキップ）"
  exit 0
fi

free_gb="$(awk -v b="$free_bytes" 'BEGIN{printf "%.2f", b/1024/1024/1024}')"
min_bytes="$(awk -v g="$MIN_FREE_GB" 'BEGIN{printf "%d", g*1024*1024*1024}')"

# ② まだ余裕があるなら、何もしない
if [ "$free_bytes" -ge "$min_bytes" ]; then
  echo "[$(date)] Drive空き ${free_gb}GB（しきい値 ${MIN_FREE_GB}GB）＝余裕あり"
  # 余裕が戻ったら控えを消す＝次に減ったときは待たずにすぐ知らせる
  rm -f "$STATE_FILE" 2>/dev/null
  exit 0
fi

# ③ 少ない。ただし毎日同じメールが届くと読まれなくなるので、COOLDOWN_DAYS は黙る
now="$(date +%s)"
if [ -f "$STATE_FILE" ]; then
  last="$(cat "$STATE_FILE" 2>/dev/null)"
  case "$last" in
    ''|*[!0-9]*) last=0 ;;
  esac
  elapsed_days=$(( (now - last) / 86400 ))
  if [ "$elapsed_days" -lt "$COOLDOWN_DAYS" ]; then
    echo "[$(date)] ⚠ Drive空き ${free_gb}GB（少ない）。${elapsed_days}日前に知らせ済みのため今回は送りません"
    exit 0
  fi
fi

echo "[$(date)] ⚠ Drive空き ${free_gb}GB がしきい値 ${MIN_FREE_GB}GB を下回りました。知らせを送ります"

BACKUP_ALERT_FREE_GB="$free_gb" \
BACKUP_ALERT_MIN_GB="$MIN_FREE_GB" \
APP="$APP" \
  "$APP/node_modules/.bin/tsx" "$APP/scripts/backup/notify-backup-failure.ts" --lowspace \
  && { mkdir -p "$(dirname "$STATE_FILE")" 2>/dev/null; printf '%s' "$now" > "$STATE_FILE"; } \
  || echo "[$(date)] ⚠⚠ 空き容量の知らせを送れませんでした。手で確認してください"

exit 0
