# もう一人の店主さん向け「リニューアル説明資料」PDFを作るスクリプト。
#   入力: docs/owner-briefing-draft.md（参考。本スクリプト内に本文を直書きしている）
#   出力: output/pdf/30nen-owner-briefing.pdf
#   実行: python3 scripts/generate-owner-briefing.py
#   必要: pip install reportlab
#   方針: 装飾は最小限。見出しと本文・箇条書きだけ。
from __future__ import annotations

import re
from pathlib import Path

from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.cidfonts import UnicodeCIDFont
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "output" / "pdf"
OUT.mkdir(parents=True, exist_ok=True)
OUTPUT_PATH = OUT / "30nen-owner-briefing.pdf"


JP_FONT = "HeiseiMin-W3"
JP_FONT_BOLD = "HeiseiKakuGo-W5"
pdfmetrics.registerFont(UnicodeCIDFont(JP_FONT))
pdfmetrics.registerFont(UnicodeCIDFont(JP_FONT_BOLD))
pdfmetrics.registerFontFamily(
    JP_FONT, normal=JP_FONT, bold=JP_FONT_BOLD, italic=JP_FONT, boldItalic=JP_FONT_BOLD
)

# 欧文・数字は CID フォントだと半角で詰まって見えるので、プロポーショナルな Arial を別登録して
# 必要箇所だけ <font name="Latin"> で差し込む。
LATIN_FONT_NAME = "Latin"
LATIN_FONT_BOLD = "LatinBold"
pdfmetrics.registerFont(TTFont(LATIN_FONT_NAME, "/System/Library/Fonts/Supplemental/Arial.ttf"))
pdfmetrics.registerFont(TTFont(LATIN_FONT_BOLD, "/System/Library/Fonts/Supplemental/Arial Bold.ttf"))


_LATIN_RUN_RE = re.compile(r"[A-Za-z0-9][A-Za-z0-9,./\-:%!?'\"_+()\s]*[A-Za-z0-9%)]|[A-Za-z0-9]")
_TAG_SPLIT_RE = re.compile(r"(<[^>]+>)")


def latinize(text: str) -> str:
    """連続する半角英数字を Latin フォント指定で包み、欧文・数字の詰まりを和らげる。
    既存の <b> などのタグは触らない。"""
    parts = _TAG_SPLIT_RE.split(text)
    out: list[str] = []
    for part in parts:
        if part.startswith("<") and part.endswith(">"):
            out.append(part)
        else:
            out.append(
                _LATIN_RUN_RE.sub(
                    lambda m: f'<font name="{LATIN_FONT_NAME}">{m.group(0)}</font>',
                    part,
                )
            )
    return "".join(out)


def make_styles() -> dict[str, ParagraphStyle]:
    base = ParagraphStyle(
        name="Body",
        fontName=JP_FONT,
        fontSize=8.8,
        leading=13.6,
        alignment=TA_LEFT,
        spaceAfter=2,
    )
    h1 = ParagraphStyle(
        name="H1",
        parent=base,
        fontName=JP_FONT_BOLD,
        fontSize=13,
        leading=18,
        spaceBefore=0,
        spaceAfter=5,
    )
    h2 = ParagraphStyle(
        name="H2",
        parent=base,
        fontName=JP_FONT_BOLD,
        fontSize=10.5,
        leading=14.5,
        spaceBefore=5,
        spaceAfter=2,
    )
    bullet = ParagraphStyle(
        name="Bullet",
        parent=base,
        leftIndent=11,
        bulletIndent=2,
        spaceAfter=1,
    )
    note = ParagraphStyle(
        name="Note",
        parent=base,
        fontSize=8.2,
        leading=12,
        textColor="#555555",
    )
    meta = ParagraphStyle(
        name="Meta",
        parent=base,
        fontSize=8.5,
        leading=12,
        spaceAfter=1,
    )
    return {"body": base, "h1": h1, "h2": h2, "bullet": bullet, "note": note, "meta": meta}


def p(text: str, style: ParagraphStyle) -> Paragraph:
    return Paragraph(latinize(text), style)


def bullets(items: list[str], style: ParagraphStyle) -> list[Paragraph]:
    return [Paragraph(latinize(f"・{t}"), style) for t in items]


def build() -> None:
    styles = make_styles()
    doc = SimpleDocTemplate(
        str(OUTPUT_PATH),
        pagesize=A4,
        leftMargin=18 * mm,
        rightMargin=18 * mm,
        topMargin=16 * mm,
        bottomMargin=14 * mm,
        title="三十年商店リニューアルのお知らせ",
        author="SAKI",
    )

    story: list = []

    # ===== 表紙ヘッダ =====
    story.append(p("三十年商店リニューアルのお知らせ", styles["h1"]))
    story.append(p("店主向け 説明資料", styles["meta"]))
    story.append(p("2026年6月25日　SAKI", styles["meta"]))
    story.append(Spacer(1, 8 * mm))

    # ===== 1ページ目 =====
    story.append(p("1. なぜサイトを作り直すのか", styles["h2"]))

    story.append(p("いまの三十年商店（WordPress版）の困りごと", styles["h2"]))
    story.append(p(
        "三十年商店は、いま <b>WordPress（ワードプレス／世界中で使われているサイト作成ソフト）</b> で動いています。"
        "2024年の開店から書き手も20人を超え、記事は8,100本を超えました。"
        "ここまで支えてくれた頼もしい仕組みですが、長く続けていくうえで、いくつか引っかかりが出てきました。",
        styles["body"],
    ))
    story.extend(bullets([
        "<b>書き手の投稿画面がややこしい</b>：「下書き／公開」「カテゴリー」「アイキャッチ」など、初めての人にはボタンが多すぎる。",
        "<b>写真がそのまま重い</b>：WordPressは原寸の写真と複数サイズのコピーを保存するため、画像フォルダがすでに約71GB。このペースだと30年で1テラ超え。",
        "<b>管理の手間</b>：WordPress本体・プラグインのアップデート、不具合対応など、人手が要る。",
    ], styles["bullet"]))

    story.append(p("新サイトのゴール", styles["h2"]))
    story.append(p("「30年つづける」を考えて、土台から作り直すことにしました。", styles["body"]))
    story.extend(bullets([
        "自分で調整・修正しやすいサイトにする",
        "書き手のためのシンプルな投稿画面（迷うところを減らす）",
        "記事も写真もぜんぶ新しいサイトへ運ぶ（8,100本のこれまでを途切れさせない）",
        "データは自分たちの手元（Google Driveの方向で構築）に持つ（よそのサービスが終わっても困らない）",
    ], styles["bullet"]))

    story.append(Spacer(1, 4 * mm))
    story.append(p(
        "用語メモ ── <b>SaaS（サース）</b>＝月額で借りるネットサービスのこと。"
        "<b>サーバー</b>＝サイトのデータを置いておく、ネット上の置き場所。",
        styles["note"],
    ))

    story.append(PageBreak())

    # ===== 2ページ目 =====
    story.append(p("2. 何が変わるか（書き手目線で）", styles["h2"]))
    story.append(p(
        "新しい投稿画面は <b>「迷わない・ヌケがない・落ちない」</b> を意識して作りました。",
        styles["body"],
    ))

    table_data = [
        ["いままで", "これから"],
        ["連載（カテゴリー）を毎回選ぶ", "担当の連載が自動でセット（書き忘れゼロ）"],
        ["写真を一度パソコンで縮める", "そのまま貼り付け・ドラッグでOK／自動で軽くする"],
        ["書きかけが消えると涙", "10秒ごとに自動保存（タブを閉じても残る）"],
        ["「下書き」と「公開」の違いが見えにくい", "ボタンが「投稿する」「下書き保存」の2つだけ"],
        ["アイキャッチ画像を忘れて公開しがち", "未設定なら「このまま公開しますか？」と確認（必須にはせず注意だけ）"],
        ["年齢は毎年の更新が必要", "<b>誕生日</b>を一度入れれば、満年齢が自動で表示（更新不要）"],
        ["過去に上げた写真をどこに置いたか分からない", "「画像フォルダ」で一覧できる"],
    ]
    table_rows = [
        [Paragraph(latinize(c), styles["body"]) for c in row] for row in table_data
    ]
    tbl = Table(table_rows, colWidths=[80 * mm, 94 * mm])
    tbl.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, -1), JP_FONT),
        ("FONTSIZE", (0, 0), (-1, -1), 8.6),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("GRID", (0, 0), (-1, -1), 0.3, "#bbbbbb"),
        ("BACKGROUND", (0, 0), (-1, 0), "#ececec"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(tbl)
    story.append(Spacer(1, 4 * mm))

    story.append(p(
        "書き手向けには、日本語・スペイン語の2言語のガイドPDFを完成済みです。切替前に全員へお配りします。",
        styles["body"],
    ))

    story.append(p("サイト全体のデザイン", styles["h2"]))
    story.append(p(
        "見た目は、いまの三十年商店をできるだけそのまま残します。"
        "暖簾（のれん）のロゴ、明朝体、白い背景、左右3カラム ── これまでの雰囲気をそこなわずに、中身だけが新しい仕組みになります。"
        "スマートフォンの右下にハンバーガーボタン（≡）が出る点も、いまと同じです。",
        styles["body"],
    ))

    story.append(p("ここまでに済んだこと", styles["h2"]))
    story.extend(bullets([
        "設計（どんなデータをどう持つかの土台づくり）",
        "書き手の投稿画面（ログイン・記事の作成・編集・写真貼り付け など）",
        "連載と書き手の名簿（自動ひもづけの仕組み）",
        "公開ページ（トップ・記事ページ・連載ページ・スマホ表示）",
        "左メニュー5項目（当店について／沿革／書き手募集／利用規約／プライバシーポリシー）",
        "検索エンジン対策（サイトマップ・OGP・旧URLからの自動転送）",
        "記事まるごと運ぶリハーサル：本番の8,102本を練習用に取り込み、エラー0で成功",
        "新しいサーバー（Xserver VPS）に新サイトが立った（6月25日：本契約完了・本番建て直し成功）",
    ], styles["bullet"]))

    story.append(Spacer(1, 3 * mm))
    story.append(p(
        "用語メモ ── <b>VPS</b>＝自分専用の小さなサーバー。月1,500円ほど。"
        "<b>OGP</b>＝SNSで記事リンクを貼ったとき画像や見出しがきれいに出る仕組み。"
        "<b>サイトマップ</b>＝サイト内のページ一覧。検索エンジンへの案内図。",
        styles["note"],
    ))

    story.append(PageBreak())

    # ===== 3ページ目 =====
    story.append(p("3. 今後の段取り", styles["h2"]))

    story.append(p("切替の目標日", styles["h2"]))
    story.append(p(
        "<b>2026年 7月下旬</b>（具体的な日は7月上旬に確定）。"
        "うまくいかなければ <b>8月末まで延期</b>できるように余裕をもたせています。"
        "無理に7月下旬で切らず、「戻せる準備」が整ってからGOです。",
        styles["body"],
    ))

    story.append(p("切替の前にやること（7月上〜中旬）", styles["h2"]))
    story.extend(bullets([
        "バックアップの「戻せる」テストに合格（毎日DB／週1で写真をGoogleドライブへ自動保存。万一に備えて、まっさらなVPSに戻せることをテストして合格を切替の絶対条件に）",
        "httpsの鍵マークをつける（無料の証明書 Let's Encrypt）",
        "書き手のみなさんへガイド配布＋お知らせ（日本語・スペイン語のPDFを配布、「7月◯日から新サイトに切り替わります」のお知らせ）",
        "書き手2〜3名で実際に投稿テスト（本切替の前の最終リハ）",
    ], styles["bullet"]))

    story.append(p("切替日にやること（数時間で完了見込み）", styles["h2"]))
    story.extend(bullets([
        "WordPress側で新規投稿を一時停止（書き手にも前日に告知）",
        "切替日の最新記事までを、もう一度新サイトへ取り込み（差分だけ）",
        "本物のURL（30nen.com）を新サイトに向け直す",
        "旧URLでアクセスしてきた人を、新サイトの同じ記事へ自動で連れていく（301転送＝もう実装済み）",
        "Googleに新しいサイトマップを登録（Search Console）",
        "みんなで開いて確認 → 公開再開",
    ], styles["bullet"]))

    story.append(p("切替の後（7月下旬〜）", styles["h2"]))
    story.extend(bullets([
        "<b>コーダーこうちゃんに連絡する</b>（無事に切り替わったことのご報告）",
        "旧 WordPress はしばらく読み取り専用で温存（何かあったらすぐ戻せるように）",
        "1〜2ヶ月、表示や検索順位に問題がないことを見守り、落ち着いたら旧サイトを正式にお休み",
        "書き手の声を聞きながら、投稿画面の細かい改善を続ける",
    ], styles["bullet"]))

    story.append(p("書き手のみなさんにお願いすること", styles["h2"]))
    story.extend(bullets([
        "<b>7月上旬</b>：ガイドPDFを読む／新サイトのログイン情報（メール・仮パスワード）を受け取る／受取後に各自ログインし、<b>「パスワード変更」</b>と「myPROFILE」で <b>「誕生日（新項目）」</b>記入・他の項目の確認をしてください",
        "<b>7月中旬</b>：希望者2〜3名で新サイトに試し投稿（最終リハ）",
        "<b>切替前日</b>：旧サイト（WordPress）での投稿はその日まででお願いします",
        "<b>切替日の翌日〜</b>：新サイトで普段どおりの投稿を再開／引っかかった点は気軽にご連絡",
    ], styles["bullet"]))

    story.append(p("店主の二人でやること", styles["h2"]))
    story.extend(bullets([
        "切替日のGO/NO-GO判定（戻せるか／書き手のガイドが行き届いたか）を一緒に決める",
        "切替日は二人とも対応できる時間帯に行いたいです",
        "書き手へのお知らせ文は、下書きを二人で確認しましょう",
    ], styles["bullet"]))

    story.append(Spacer(1, 4 * mm))
    story.append(p("お金まわり", styles["h2"]))
    money_data = [
        ["項目", "今の料金", "将来の見込み（目安）"],
        [
            "サーバー Xserver VPS 2GB（SSD 50GB）",
            "月 約1,500円",
            "5〜6年後に容量がうまりそう → 1つ上の4GBプラン（月 約2,500円）への乗換を想定",
        ],
        [
            "ドメイン 30nen.com（お名前.com）",
            "0円",
            "変更なし（既存を継続）",
        ],
        [
            "バックアップ Google Drive（無料15GB）",
            "0円",
            "1〜1年半後に15GBを超える見込み → 100GBプラン（月 約250円）。先で 2TBプラン（月 約1,300円）",
        ],
        [
            "月額 SaaS（追加サービス）",
            "0円",
            "なし",
        ],
    ]
    money_rows = [
        [Paragraph(latinize(c), styles["body"]) for c in row] for row in money_data
    ]
    money_tbl = Table(money_rows, colWidths=[56 * mm, 26 * mm, 92 * mm])
    money_tbl.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, -1), JP_FONT),
        ("FONTSIZE", (0, 0), (-1, -1), 8.6),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("GRID", (0, 0), (-1, -1), 0.3, "#bbbbbb"),
        ("BACKGROUND", (0, 0), (-1, 0), "#ececec"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(money_tbl)

    story.append(Spacer(1, 2 * mm))
    story.append(p(
        "前提：移行直後の画像フォルダは約10GBスタート見込み（現行WP 71GB → 自動軽量化で約1/7）／"
        "新システムは投稿時にも画像を自動で軽くするため、増加ペースは年 約7GB の目安。実測しながら見直します。",
        styles["note"],
    ))

    doc.build(story)
    print(f"wrote: {OUTPUT_PATH}")


if __name__ == "__main__":
    build()
