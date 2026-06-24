#!/usr/bin/env bash
# =============================================================================
# 現行WordPress（30nen.com）から公開記事を「読み取りのみ」で書き出す（高速版）。
#   - 実行する場所: 現行サーバー（Xサーバー）上。ローカルからSSHでログインして動かす。
#   - ポイント: 1件ずつ聞かず、**まとめて2回**だけ取得する（全件でも数分で終わる）。
#       ① 全公開記事の本体    … wp post list（1回・JSON配列）
#       ② 連載(カテゴリ)の対応 … wp db query の SELECT（1回・読み取りのみ・TSV）
#   - 出力（このスクリプトはサーバー上に2つのまとめファイルを作る）:
#       $OUT/all-posts.json       … 記事本体の配列
#       $OUT/all-categories.tsv   … post_id ごとの連載（タブ区切り）
#     ※ これを手元へ rsync し、split-export.ts で 1記事ごとの <ID>.json /
#       <ID>.categories.json に分け、derive-aux-files.ts で残り2ファイルを作る。
#
# 【安全について】
#   - 使うのは「読み出し」のみ（post list / db query の SELECT / db prefix）。
#   - 現行サイトへの書き込み・更新・削除は一切しない。記事も止めない。
#   - まず少数で試すなら LIMIT=20 を付ける（本体だけ件数制限・カテゴリは全件でも安価）。
# =============================================================================
set -uo pipefail

# --- 設定（必要なら環境変数で上書き可）---------------------------------------
WP_PATH="${WP_PATH:-/home/the30nen/30nen.com/public_html}"  # WordPress本体の場所
WP="${WP:-php7.4 /usr/bin/wp}"                               # WP-CLI（既定phpは古いのでphp7.4指定）
OUT="${OUT:-$HOME/30nen_export}"                             # 書き出し先フォルダ
LIMIT="${LIMIT:-0}"                                          # 0=全件。試運転は LIMIT=20 など

mkdir -p "$OUT"
WPCMD=( $WP --path="$WP_PATH" )

# 本体取得の件数オプション（LIMIT>0 のときだけ件数制限）
PPP_OPT=()
if [ "$LIMIT" -gt 0 ]; then
  PPP_OPT=( --posts_per_page="$LIMIT" )
  echo "※ 試運転: 本体は先頭 $LIMIT 件のみ取得します"
fi

echo "▶ ① 全公開記事の本体をまとめて取得（1回）..."
"${WPCMD[@]}" post list --post_type=post --post_status=publish "${PPP_OPT[@]}" \
  --fields=ID,post_author,post_date,post_content,post_title,post_excerpt,post_status,post_name \
  --orderby=ID --order=ASC --format=json > "$OUT/all-posts.json"
echo "  → $OUT/all-posts.json"

echo "▶ ② 連載(カテゴリ)の対応をまとめて取得（1回・読み取りSELECT）..."
PREFIX="$("${WPCMD[@]}" db prefix)"
SQL="SELECT tr.object_id, t.term_id, t.name, t.slug, tt.parent \
FROM ${PREFIX}term_relationships tr \
JOIN ${PREFIX}term_taxonomy tt ON tr.term_taxonomy_id = tt.term_taxonomy_id \
JOIN ${PREFIX}terms t ON tt.term_id = t.term_id \
JOIN ${PREFIX}posts p ON p.ID = tr.object_id \
WHERE tt.taxonomy='category' AND p.post_type='post' AND p.post_status='publish' \
ORDER BY tr.object_id ASC"
# --skip-column-names: 見出し行を出さず純粋なTSVにする（mysqlへ渡す読み取り用オプション）
"${WPCMD[@]}" db query "$SQL" --skip-column-names > "$OUT/all-categories.tsv"
echo "  → $OUT/all-categories.tsv"

# 件数の目安を表示（本体JSONの "ID": 出現数）
N=$(grep -o '"ID"' "$OUT/all-posts.json" | wc -l | tr -d ' ')
echo "✅ 完了: 記事本体 約 $N 件＋カテゴリ対応表を書き出しました。"
echo "   次は手元(ローカル)へ rsync で持ち帰り、split-export.ts → derive-aux-files.ts を実行します。"
