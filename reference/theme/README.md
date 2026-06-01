# 現行テーマ（デザイン参照）

現行WordPress（30nen.com・本番）で使われている独自テーマ `30nen_original` を
**読み取りのみ** で持ち込んだもの。新システムのデザイン移植の参照に使う。

- 取得元: 30nen.com / wp-content/themes/30nen_original（本番・**無変更**）
- 取得日: 2026-06-01
- アクティブテーマ: `30nen_original`（独自テーマ。Cocoon系も同梱されていたが非使用）

## 構成
- `30nen_original/common/css/style.css` … **メインCSS（30KB・デザインの本体）**
- `30nen_original/style.css` … テーマ情報ヘッダーのみ（141B）
- `30nen_original/common/jpg/` … ロゴ・パターン・アイコン等のデザイン素材
- `30nen_original/common/js/` … 動き用JS（load-more 等）
- `30nen_original/*.php` … ページの骨組み（header / footer / single / front-page / 各固定ページ）

## デザイントークン（CSSから抽出）

### フォント
- 見出し・本文: **"Zen Old Mincho", serif**（和文の明朝体。上品な印象）
- 一部: **'Noto Sans JP'**（ゴシック体）
- `html { font-size: 62.5% }` … 1rem = 10px 換算で設計

### 主要カラー
| 色 | 用途の目安 |
|---|---|
| `#333` | 基本の文字色 |
| `#150c0c` | 濃い文字色（ほぼ黒・見出し等） |
| `#808080` / `#666666` | グレー（補助テキスト） |
| `#ffffff` / `#fff` | 背景の白 |
| `#eeeeee` / `#f0f0f0` / `#f5f5f5` | 薄いグレー背景・区切り |
| `#ddd` / `#ccc` | 罫線 |
| `#007cff` | リンク等のアクセント（青） |
| `#b91e23` | 赤系アクセント |
| `#fce3e3` | 淡いピンク背景 |

### その他の特徴
- 本文は両端揃え（`text-align: justify`）、字間を詰め気味（`letter-spacing` マイナス）
- リンクは下線なし＋ホバーで `opacity: 0.7`

## 主要なブランド素材（common/jpg）
- `30nen_logo.png` … ロゴ
- `30nen_logo_noren_plus.jpg` … のれん付きロゴ
- `30nen_obi_pattern.png` … 帯パターン（装飾）
- `02_10957_logo.jpg` … 連載「1/10957」ロゴ
- `ogp.png` … SNSシェア用画像（OGP）

## 注意
- これは**参照用コピー**。新システムは Next.js + Tailwind で作るため、このCSSをそのまま使うのではなく、
  上記トークン（フォント・色・余白の方針）を**手本にして再現**していく。
- PHPテンプレートは「どんなHTML構造にこのCSSが当たっているか」を読むための参考資料。
