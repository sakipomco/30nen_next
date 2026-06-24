#!/usr/bin/env bash
# =============================================================================
# 現行WordPress（30nen.com）から公開記事を「読み取りのみ」で書き出すスクリプト。
#   - 実行する場所: 現行サーバー（Xサーバー）上。ローカルからSSHでログインして動かす。
#   - 出力形式: サンプル（reference/sample-posts/posts）と同じ <ID>.json / <ID>.categories.json。
#     ※ <ID>.author_id.txt と <ID>.imagelist.txt は、書き出したJSONから手元(ローカル)で
#       derive-aux-files.ts を使って生成する（このスクリプトは作らない＝サーバー処理を軽くするため）。
#
# 【安全について】
#   - ここで使うWP-CLIコマンドは「読み出し」のみ（post list / post get / post term list）。
#   - 現行サイトへの書き込み・更新・削除は一切しない。記事も止めない。
#   - それでも本番サーバーなので、まず少数で試してから全件に進むこと（手順書 export-procedure.md 参照）。
# =============================================================================
set -uo pipefail

# --- 設定（必要なら環境変数で上書き可）---------------------------------------
WP_PATH="${WP_PATH:-/home/the30nen/30nen.com/public_html}"  # WordPress本体の場所
WP="${WP:-php7.4 /usr/bin/wp}"                               # WP-CLI（既定phpは古いのでphp7.4指定）
OUT="${OUT:-$HOME/30nen_export/posts}"                       # 書き出し先フォルダ
LIMIT="${LIMIT:-0}"                                          # 0=全件。試運転は LIMIT=20 などで件数制限

mkdir -p "$OUT"
WPCMD=( $WP --path="$WP_PATH" )

echo "▶ 公開記事のID一覧を取得します..."
# 投稿タイプ post・状態 publish のIDを取得（--format=ids はスペース区切り1行 → 改行に直す）
"${WPCMD[@]}" post list --post_type=post --post_status=publish --field=ID --format=ids \
  | tr ' ' '\n' | sed '/^$/d' > "$OUT/../ids.txt"

TOTAL=$(wc -l < "$OUT/../ids.txt" | tr -d ' ')
echo "  公開記事: $TOTAL 件"
if [ "$LIMIT" -gt 0 ]; then
  head -n "$LIMIT" "$OUT/../ids.txt" > "$OUT/../ids.run.txt"
  echo "  ※ 試運転: 先頭 $LIMIT 件だけ書き出します"
else
  cp "$OUT/../ids.txt" "$OUT/../ids.run.txt"
fi

i=0
fail=0
while read -r ID; do
  [ -z "$ID" ] && continue
  i=$((i+1))
  # ① 記事本体（サンプルと同じフィールド構成）
  if ! "${WPCMD[@]}" post get "$ID" \
      --fields=ID,post_author,post_date,post_content,post_title,post_excerpt,post_status,post_name \
      --format=json > "$OUT/$ID.json"; then
    echo "  ⚠ 記事 $ID の取得に失敗" >&2; fail=$((fail+1))
  fi
  # ② 連載（カテゴリ）
  if ! "${WPCMD[@]}" post term list "$ID" category \
      --fields=term_id,name,slug,parent --format=json > "$OUT/$ID.categories.json"; then
    echo "  ⚠ 記事 $ID のカテゴリ取得に失敗" >&2; fail=$((fail+1))
  fi
  if [ $((i % 200)) -eq 0 ]; then echo "  ...$i 件目"; fi
done < "$OUT/../ids.run.txt"

echo "✅ 完了: $i 件を $OUT に書き出しました（失敗 $fail 件）"
echo "   次は手元(ローカル)へ持ち帰り、derive-aux-files.ts で補助ファイルを生成します。"
