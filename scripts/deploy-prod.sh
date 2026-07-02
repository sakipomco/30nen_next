#!/usr/bin/env bash
# 本番デプロイ（GitHub経由）— 本番VPS（new.30nen.com）上で実行する。
#
# 使い方（サーバーにログインしてから）:
#   ssh -i ~/.ssh/30nen_vps root@162.43.43.144
#   bash /var/www/30nen_next/scripts/deploy-prod.sh
#
# 前提（一度きりの準備・2026-07-01実施済み）:
#   - /var/www/30nen_next が git 管理下で origin=git@github.com:sakipomco/30nen_next.git
#   - サーバーに GitHub 読み取り用の deploy key（/root/.ssh/github_deploy）登録済み
#
# この処理:
#   ① GitHub の main の最新を取得して、そのとおりに合わせる（git reset --hard）
#      ※ DB(data/)・画像(public/uploads/)・秘密設定(.env.local) は gitignore なので触れない
#   ② package(-lock).json に変更があったときだけ npm ci ＋ ネイティブ再ビルド
#   ③ DBマイグレーション（新規があれば適用・無ければ何もしない）
#   ④ 本番ビルド
#   ⑤ PM2 で再起動
set -euo pipefail

cd /var/www/30nen_next
export PATH=/usr/local/bin:$PATH

echo "① GitHub から最新を取得して合わせる..."
BEFORE=$(git rev-parse HEAD)
git fetch origin --quiet
git reset --hard origin/main
AFTER=$(git rev-parse HEAD)
if [ "$BEFORE" = "$AFTER" ]; then
  echo "   （変更なし：$AFTER のまま）"
else
  echo "   $BEFORE → $AFTER"
fi

if git diff --name-only "$BEFORE" "$AFTER" | grep -qE '(^|/)package(-lock)?\.json$'; then
  echo "② 部品（npm）に変更あり → npm ci ＋ ネイティブ再ビルド..."
  npm ci
  npm rebuild better-sqlite3 sharp --foreground-scripts
else
  echo "② 部品の変更なし → インストールは省略"
fi

echo "③ DBマイグレーション（新規があれば適用）..."
npm run db:migrate

echo "④ 本番ビルド..."
npm run build

echo "⑤ 再起動..."
pm2 restart 30nen --update-env

echo "✅ デプロイ完了: $(git rev-parse --short HEAD)  $(git log -1 --pretty=%s)"
