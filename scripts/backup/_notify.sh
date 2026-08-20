# バックアップ用の「失敗したらメールで知らせる」しかけ。
# backup-db.sh / backup-uploads.sh の冒頭から読み込んで（source して）使う。
#
# しくみ:
#   bash の ERR トラップ＝「途中でコマンドが失敗したら、この処理を呼ぶ」という仕掛け。
#   set -e で止まる直前に割り込んで、店主あてにメールを出してからスクリプトを終える。
#
# 使い方（呼ぶ側）:
#   BACKUP_JOB_NAME="DBバックアップ"
#   source "$(dirname "$0")/_notify.sh"
#
# 注意: 知らせ自体が送れない場合（キー未設定・ネット不通など）もログには必ず1行残す。

APP="${APP:-/var/www/30nen_next}"
BACKUP_LOG="${BACKUP_LOG:-/var/log/30nen-backup.log}"
BACKUP_JOB_NAME="${BACKUP_JOB_NAME:-バックアップ}"

backup_notify_failure() {
  local code="$1" line="$2"
  echo "[$(date)] ⚠ ${BACKUP_JOB_NAME}が失敗しました（終了コード ${code}・${line}行目）。知らせを送ります。"

  # ログの末尾を証拠として添える（原因の手がかり。長すぎないよう30行だけ）。
  local log_tail
  log_tail="$(tail -n 30 "$BACKUP_LOG" 2>/dev/null || echo '(ログを読めませんでした)')"

  BACKUP_ALERT_JOB="$BACKUP_JOB_NAME" \
  BACKUP_ALERT_CODE="$code" \
  BACKUP_ALERT_LINE="$line" \
  BACKUP_ALERT_LOG="$log_tail" \
  APP="$APP" \
    "$APP/node_modules/.bin/tsx" "$APP/scripts/backup/notify-backup-failure.ts" \
    || echo "[$(date)] ⚠⚠ 知らせのメールも送れませんでした。手で確認してください。"
}

# set -E ＝ 関数やサブシェルの中で転んだときも ERR トラップを効かせる（これが無いと見逃す）。
set -E
trap 'backup_notify_failure "$?" "$LINENO"' ERR
