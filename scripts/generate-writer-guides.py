# 書き手向けガイド（日本語・スペイン語）のPDFを作るスクリプト。
#   出力: output/pdf/30nen-writer-guide-ja.pdf / -es.pdf
#   実行: python3 scripts/generate-writer-guides.py
#   必要: pip install reportlab   （日本語は reportlab 内蔵の CID フォントを使うので追加フォント不要）
#   切替日などの文言は下の SWITCH_DATE_* 等の定数を編集して作り直す。
from __future__ import annotations

from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    Image,
    KeepTogether,
    ListFlowable,
    ListItem,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "output" / "pdf"
LOGO = ROOT / "public" / "30nen_logo.png"

SITE_URL = "https://30nen.com"
LOGIN_URL = "https://30nen.com/login"
SWITCH_DATE_JA = "2026年7月29日（仮）"
SWITCH_DATE_ES = "29 de julio de 2026 (provisional)"


LATIN_FONT = "/System/Library/Fonts/Supplemental/Arial.ttf"
LATIN_BOLD_FONT = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"

# 日本語は reportlab 内蔵の CID フォントを使う（システムの TTF に依存せず必ず描画される）。
#   本文＝HeiseiMin-W3（明朝・サイトの Zen Old Mincho と相性がよい）
#   強調(<b>)＝HeiseiKakuGo-W5（ゴシック・少し重く見える）
from reportlab.pdfbase.cidfonts import UnicodeCIDFont  # noqa: E402

JP_FONT = "HeiseiMin-W3"
JP_FONT_BOLD = "HeiseiKakuGo-W5"
pdfmetrics.registerFont(UnicodeCIDFont(JP_FONT))
pdfmetrics.registerFont(UnicodeCIDFont(JP_FONT_BOLD))
# <b> タグが効くように「本文→強調」のひもづけを登録する。
pdfmetrics.registerFontFamily(
    JP_FONT, normal=JP_FONT, bold=JP_FONT_BOLD, italic=JP_FONT, boldItalic=JP_FONT_BOLD
)

pdfmetrics.registerFont(TTFont("GuideLatin", LATIN_FONT))
pdfmetrics.registerFont(TTFont("GuideLatin-Bold", LATIN_BOLD_FONT))


BRAND = colors.HexColor("#2F5D50")
INK = colors.HexColor("#24302C")
MUTED = colors.HexColor("#66736D")
PALE = colors.HexColor("#EFF6F2")
LINE = colors.HexColor("#D8E5DD")
WARM = colors.HexColor("#F8F3E8")
ACCENT = colors.HexColor("#B85C38")


def cjk_style(name: str, **kwargs) -> ParagraphStyle:
    return ParagraphStyle(
        name=name,
        fontName=kwargs.pop("fontName", JP_FONT),
        textColor=kwargs.pop("textColor", INK),
        leading=kwargs.pop("leading", 15),
        wordWrap=kwargs.pop("wordWrap", "CJK"),
        **kwargs,
    )


def latin_style(name: str, **kwargs) -> ParagraphStyle:
    return ParagraphStyle(
        name=name,
        fontName=kwargs.pop("fontName", "GuideLatin"),
        textColor=kwargs.pop("textColor", INK),
        leading=kwargs.pop("leading", 15),
        **kwargs,
    )


JA = {
    "title": cjk_style("ja_title", fontSize=22, leading=28, alignment=TA_CENTER, textColor=BRAND, spaceAfter=8),
    "subtitle": cjk_style("ja_subtitle", fontSize=11, leading=17, alignment=TA_CENTER, textColor=MUTED, spaceAfter=14),
    "h1": cjk_style("ja_h1", fontSize=14, leading=19, textColor=BRAND, spaceBefore=8, spaceAfter=6),
    "h2": cjk_style("ja_h2", fontSize=12.5, leading=17, textColor=BRAND, spaceBefore=6, spaceAfter=4),
    "body": cjk_style("ja_body", fontSize=10.2, leading=16, spaceAfter=6),
    "small": cjk_style("ja_small", fontSize=8.8, leading=13, textColor=MUTED),
    "note": cjk_style("ja_note", fontSize=9.5, leading=15, textColor=INK),
    "bullet": cjk_style("ja_bullet", fontSize=10, leading=15),
    "num": cjk_style("ja_num", fontSize=10, leading=15, leftIndent=0),
    "chip": cjk_style("ja_chip", fontSize=9.2, leading=12, textColor=BRAND, alignment=TA_CENTER),
}


ES = {
    "title": latin_style("es_title", fontSize=22, leading=28, alignment=TA_CENTER, textColor=BRAND, spaceAfter=8),
    "subtitle": latin_style("es_subtitle", fontSize=11, leading=17, alignment=TA_CENTER, textColor=MUTED, spaceAfter=14),
    "h1": latin_style("es_h1", fontSize=14, leading=19, textColor=BRAND, spaceBefore=8, spaceAfter=6),
    "h2": latin_style("es_h2", fontSize=12.5, leading=17, textColor=BRAND, spaceBefore=6, spaceAfter=4),
    "body": latin_style("es_body", fontSize=10.2, leading=15.4, spaceAfter=6),
    "small": latin_style("es_small", fontSize=8.8, leading=12.8, textColor=MUTED),
    "note": latin_style("es_note", fontSize=9.5, leading=14.5, textColor=INK),
    "bullet": latin_style("es_bullet", fontSize=10, leading=14.7),
    "num": latin_style("es_num", fontSize=10, leading=14.7, leftIndent=0),
    "chip": latin_style("es_chip", fontSize=9.2, leading=12, textColor=BRAND, alignment=TA_CENTER),
}


def header_footer(canvas, doc, lang: str):
    canvas.saveState()
    width, height = A4
    canvas.setStrokeColor(LINE)
    canvas.setLineWidth(0.5)
    canvas.line(18 * mm, height - 17 * mm, width - 18 * mm, height - 17 * mm)
    canvas.setFillColor(MUTED)
    font = JP_FONT if lang == "ja" else "GuideLatin"
    canvas.setFont(font, 8)
    canvas.drawString(18 * mm, height - 13 * mm, "30nen.com")
    canvas.drawRightString(width - 18 * mm, height - 13 * mm, f"{doc.page}")
    canvas.setStrokeColor(LINE)
    canvas.line(18 * mm, 14 * mm, width - 18 * mm, 14 * mm)
    footer = "困ったときは、店主とのグループLINEへ" if lang == "ja" else "Si necesitas ayuda, escribe al grupo LINE con Tenshu"
    canvas.drawString(18 * mm, 9.5 * mm, footer)
    canvas.restoreState()


class GuideDoc(BaseDocTemplate):
    def __init__(self, filename: str, lang: str):
        super().__init__(
            filename,
            pagesize=A4,
            leftMargin=18 * mm,
            rightMargin=18 * mm,
            topMargin=22 * mm,
            bottomMargin=18 * mm,
        )
        frame = Frame(self.leftMargin, self.bottomMargin, self.width, self.height, id="main")
        self.addPageTemplates([PageTemplate(id="guide", frames=[frame], onPage=lambda c, d: header_footer(c, d, lang))])


def p(text: str, style: ParagraphStyle) -> Paragraph:
    return Paragraph(text, style)


def bullets(items: list[str], style: ParagraphStyle, bullet_type: str = "bullet") -> ListFlowable:
    return ListFlowable(
        [ListItem(p(item, style), leftIndent=8) for item in items],
        bulletType=bullet_type,
        start="1" if bullet_type == "1" else None,
        leftIndent=14,
        bulletFontSize=8,
        bulletOffsetY=1,
    )


def note_box(text: str, styles: dict[str, ParagraphStyle], bg=PALE) -> Table:
    table = Table([[p(text, styles["note"])]], colWidths=[174 * mm])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), bg),
                ("BOX", (0, 0), (-1, -1), 0.6, LINE),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 7),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
            ]
        )
    )
    return table


def chips(items: list[str], styles: dict[str, ParagraphStyle]) -> Table:
    row = [[p(item, styles["chip"]) for item in items]]
    table = Table(row, colWidths=[42 * mm] * len(items), hAlign="CENTER")
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.white),
                ("BOX", (0, 0), (-1, -1), 0.6, LINE),
                ("INNERGRID", (0, 0), (-1, -1), 0.6, LINE),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("LEFTPADDING", (0, 0), (-1, -1), 4),
                ("RIGHTPADDING", (0, 0), (-1, -1), 4),
            ]
        )
    )
    return table


def cover(story, styles, title: str, subtitle: str, chips_text: list[str]):
    if LOGO.exists():
        img = Image(str(LOGO), width=42 * mm, height=23 * mm)
        img.hAlign = "CENTER"
        story.append(img)
        story.append(Spacer(1, 7 * mm))
    story.append(p(title, styles["title"]))
    story.append(p(subtitle, styles["subtitle"]))
    story.append(chips(chips_text, styles))
    story.append(Spacer(1, 9 * mm))


def build_ja():
    filename = OUT / "30nen-writer-guide-ja.pdf"
    doc = GuideDoc(str(filename), "ja")
    s = JA
    story = []

    cover(
        story,
        s,
        "30nen.com 新しい投稿画面の手引き",
        "書き手のみなさんへ。切り替え前に、ゆっくり試して慣れるための案内です。",
        ["ログイン", "試し書き", "プロフィール確認", "7/29から本番"],
    )

    story.append(note_box(
        f"<b>大事な日付</b><br/>{SWITCH_DATE_JA} までは練習期間です。新システムで書いた内容はプレビューできますが、30nen.com の本番サイトには反映されません。切り替え日以降は、新しい投稿画面から投稿します。",
        s,
        WARM,
    ))
    story.append(Spacer(1, 6 * mm))

    story.append(p("まずお願いしたいこと", s["h1"]))
    story.append(bullets([
        "店主から届くログイン情報で、<b>https://30nen.com/login</b> に入ってみる。",
        "プロフィール画面を開き、表示名・プロフィール文・写真などを確認する。",
        "西暦を含めた誕生日を入力する。例: 1980年4月3日。",
        "新規投稿で短い試し書きをして、画像アップロード、下書き保存、プレビューを試す。",
        "うまくいかないところ、わかりにくいところは、店主とのグループLINEで知らせる。",
    ], s["bullet"]))

    story.append(p("ログインについて", s["h1"]))
    story.append(p("ログインに使うメールアドレスとパスワードは、店主から個別にお知らせします。できるだけこれまでと変わらない形で使えるよう準備していますが、入れない場合はあわてずグループLINEで知らせてください。", s["body"]))
    story.append(bullets([
        "ログイン画面: <b>https://30nen.com/login</b>",
        "メールアドレスとパスワードを入力します。",
        "ログインできたら、投稿管理画面が開きます。",
        "何度か試しても入れないときは、画面の様子をそのままLINEに送ってください。",
    ], s["bullet"]))

    story.append(p("プロフィール確認で大事なこと", s["h1"]))
    story.append(p("新しいサイトでは、書き手のプロフィールを少し整えて表示します。初回ログイン後に、できる範囲で確認をお願いします。", s["body"]))
    story.append(bullets([
        "表示名",
        "プロフィール文",
        "写真またはアイコン",
        "メールアドレス",
        "西暦を含めた誕生日",
        "SNSやWebサイトのリンク（ある人だけ）",
    ], s["bullet"]))
    story.append(note_box("誕生日は、誕生日そのものを公開するためではありません。公開ページでは「◎歳」のように年齢として表示するために使います。生年月日そのものは公開されません。", s))

    story.append(PageBreak())

    story.append(p("試し書きの流れ", s["h1"]))
    story.append(p("切り替え日までは練習用です。失敗しても大丈夫です。文章を少し入れて、画像を1枚入れて、下書き保存とプレビューまで試してみてください。", s["body"]))
    story.append(bullets([
        "管理画面で「新規投稿」を開く。",
        "タイトルに「テスト投稿: 自分の名前」などと入れる。",
        "本文に短い文章を書く。例: 新しい投稿画面の練習です。",
        "必要なら画像をアップロードして本文に入れる。",
        "いきなり公開せず、まず「下書き保存」をする。",
        "プレビューで見え方を確認する。",
    ], s["num"], "1"))

    story.append(p("画像アップロードについて", s["h1"]))
    story.append(p("スマホで撮った写真も使えます。写真を選んでアップロードし、本文の入れたい場所に入れてください。うまく入らない、向きがおかしい、重すぎる気がする、という時はそのままLINEで相談してください。", s["body"]))
    story.append(bullets([
        "自分で撮った写真、または使用してよい写真を使ってください。",
        "人が写っている写真は、公開してよいものか少しだけ確認してください。",
        "練習期間中は、写真を入れる練習もぜひしてみてください。",
    ], s["bullet"]))

    story.append(p("切り替え日までの注意", s["h1"]))
    story.append(note_box(
        f"{SWITCH_DATE_JA} までは、あくまで練習期間です。新システム内でプレビューはできますが、本番の 30nen.com には反映されません。いつもの投稿が必要な場合は、切り替え日まではこれまで通りの方法を使ってください。",
        s,
        WARM,
    ))

    story.append(p("こまかい話（読み飛ばしても投稿はできます）", s["h2"]))
    story.append(bullets([
        "<b>自動保存</b>：書いている途中の新規・下書きは、自動で保存されます。公開済みの記事を直したときだけ、最後に「投稿する」を押してください。",
        "<b>下書き保存と投稿する</b>：「下書き保存」はまだ公開されません（あとで続けられます）。「投稿する」を押すとサイトに公開されます。",
        "<b>連載のえらび方</b>：ふつうは自分の連載が自動で入っています。複数の連載を担当している人だけ、連載欄で選んでください。",
        "<b>写真の形式</b>：使えるのは JPEG・PNG・GIF・WebP。重い写真もサイト側で自動的に軽くします。うまくいかない時は1枚ずつ、Wi-Fiで試してください。",
        "<b>写真なしの確認</b>：「投稿する」のとき写真が無いと確認が出ますが、エラーではありません。写真なしでよければそのまま進めます。",
        "<b>公開の日時</b>：公開日時は日本時間です。空欄のまま投稿すると「今すぐ公開」になります。よくわからなければ空欄で大丈夫です。",
    ], s["small"]))

    story.append(p("困ったとき", s["h1"]))
    story.append(p("うまくいかない時は、説明しようとがんばりすぎなくて大丈夫です。店主とのグループLINEに、次のどれかを送ってください。", s["body"]))
    story.append(bullets([
        "どの画面で止まったか",
        "表示されたメッセージ",
        "スマホなら画面のスクリーンショット",
        "「ログインできない」「画像が入らない」など一言だけでもOK",
    ], s["bullet"]))
    story.append(note_box("新しい道具に慣れるまで、少し時間がかかるのは普通です。急がなくて大丈夫なので、切り替え前に一度さわってみてください。わかりにくいところは、案内や画面の方を直していきます。", s))

    doc.build(story)
    return filename


def build_es():
    filename = OUT / "30nen-writer-guide-es.pdf"
    doc = GuideDoc(str(filename), "es")
    s = ES
    story = []

    cover(
        story,
        s,
        "Guia para escribir en el nuevo 30nen.com",
        "Una guía amable para probar el nuevo entorno antes del cambio.",
        ["Iniciar sesion", "Probar una entrada", "Revisar perfil", "Desde el 29/7"],
    )

    story.append(note_box(
        f"<b>Fecha importante</b><br/>Hasta el {SWITCH_DATE_ES}, el nuevo sistema será solo para practicar. Podrás ver una vista previa de tus pruebas, pero no aparecerán en el sitio público de 30nen.com. Desde la fecha de cambio, las publicaciones se harán desde el nuevo sistema.",
        s,
        WARM,
    ))
    story.append(Spacer(1, 6 * mm))

    story.append(p("Lo primero que te pedimos", s["h1"]))
    story.append(bullets([
        "Entra a <b>https://30nen.com/login</b> con los datos que te enviará Tenshu.",
        "Abre tu perfil y revisa tu nombre, texto de presentación y foto.",
        "Completa tu fecha de nacimiento con el año. Ejemplo: 3 de abril de 1980.",
        "Haz una entrada de prueba: escribe algo corto, sube una imagen, guarda como borrador y mira la vista previa.",
        "Si algo no funciona o no se entiende, avisa en el grupo LINE con Tenshu.",
    ], s["bullet"]))

    story.append(p("Sobre el inicio de sesión", s["h1"]))
    story.append(p("Tenshu enviará a cada persona el correo y la contraseña para entrar. Estamos preparando todo para que el cambio sea lo más sencillo posible. Si no puedes entrar, no te preocupes: avisa en el grupo LINE.", s["body"]))
    story.append(bullets([
        "Página de login: <b>https://30nen.com/login</b>",
        "Escribe tu correo y contraseña.",
        "Si el login funciona, se abrirá la pantalla de administración.",
        "Si no puedes entrar después de intentarlo, envía al LINE una captura o cuenta qué aparece en la pantalla.",
    ], s["bullet"]))

    story.append(p("Revisa tu perfil", s["h1"]))
    story.append(p("En el nuevo sitio, el perfil de cada escritora o escritor se mostrará de una forma un poco más ordenada. Después de entrar por primera vez, revisa lo siguiente cuando puedas.", s["body"]))
    story.append(bullets([
        "Nombre que se mostrará en el sitio",
        "Texto de perfil",
        "Foto o icono",
        "Correo electrónico",
        "Fecha de nacimiento con ano",
        "Enlaces a redes sociales o sitio web, solo si los tienes",
    ], s["bullet"]))
    story.append(note_box("La fecha de nacimiento no se publicará tal cual. Se usará para mostrar la edad, por ejemplo \"◎ años\". Tu fecha completa de nacimiento no aparecerá en la página pública.", s))

    story.append(PageBreak())

    story.append(p("Como hacer una prueba", s["h1"]))
    story.append(p("Hasta la fecha de cambio, puedes practicar sin miedo. Te recomendamos escribir algo breve, agregar una imagen, guardar como borrador y revisar la vista previa.", s["body"]))
    story.append(bullets([
        "Abre \"Nueva entrada\" en la pantalla de administracion.",
        "Pon un titulo como \"Prueba: tu nombre\".",
        "Escribe una frase corta. Por ejemplo: Estoy probando el nuevo sistema.",
        "Si quieres, sube una imagen y colócala en el texto.",
        "No hace falta publicar: primero guarda como borrador.",
        "Abre la vista previa y revisa como se ve.",
    ], s["num"], "1"))

    story.append(p("Sobre las imagenes", s["h1"]))
    story.append(p("Puedes usar fotos tomadas con el teléfono. Elige la imagen, súbela y colócala donde quieras dentro del texto. Si no entra bien, queda girada o parece demasiado pesada, consulta por LINE.", s["body"]))
    story.append(bullets([
        "Usa fotos tuyas o imágenes que tengas permiso de usar.",
        "Si aparecen personas, revisa un momento si está bien publicarlas.",
        "Durante el periodo de práctica, también vale la pena probar cómo subir imágenes.",
    ], s["bullet"]))

    story.append(p("Atencion durante el periodo de practica", s["h1"]))
    story.append(note_box(
        f"Hasta el {SWITCH_DATE_ES}, el nuevo sistema es solo para practicar. Podrás ver tus pruebas con la vista previa, pero no se publicarán en el 30nen.com real. Si necesitas publicar algo antes del cambio, usa el método de siempre.",
        s,
        WARM,
    ))

    story.append(p("Detalles (puedes saltarlos: igual podrás publicar)", s["h2"]))
    story.append(bullets([
        "<b>Guardado automático</b>: mientras escribes una entrada nueva o un borrador, se guarda solo. Solo cuando edites una entrada ya publicada, pulsa \"Publicar\" al final.",
        "<b>Borrador y Publicar</b>: \"Guardar borrador\" no publica nada (puedes seguir después). \"Publicar\" la muestra en el sitio.",
        "<b>La serie (categoría)</b>: normalmente tu serie ya viene elegida. Solo quienes llevan varias series deben elegirla en el campo de serie.",
        "<b>Formatos de foto</b>: puedes usar JPEG, PNG, GIF y WebP. El sitio aligera solo las fotos pesadas. Si falla, sube una por una y prueba con Wi-Fi.",
        "<b>Aviso sin foto</b>: al pulsar \"Publicar\" sin imagen destacada aparece un aviso; no es un error. Si está bien sin foto, continúa.",
        "<b>Fecha y hora</b>: la fecha de publicación usa la hora de Japón. Si la dejas en blanco, se publica de inmediato. Si dudas, déjala en blanco.",
    ], s["small"]))

    story.append(p("Si necesitas ayuda", s["h1"]))
    story.append(p("No hace falta explicar todo perfectamente. En el grupo LINE con Tenshu puedes enviar cualquiera de estas cosas.", s["body"]))
    story.append(bullets([
        "En qué pantalla te quedaste",
        "El mensaje que aparece",
        "Una captura de pantalla desde el telefono",
        "Una frase corta como \"no puedo entrar\" o \"no puedo subir la imagen\"",
    ], s["bullet"]))
    story.append(note_box("Es normal necesitar un poco de tiempo para acostumbrarse a una herramienta nueva. Pruébala una vez antes del cambio, sin prisa. Lo que resulte confuso nos ayudará a mejorar la guía y la pantalla.", s))

    doc.build(story)
    return filename


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    ja = build_ja()
    es = build_es()
    print(ja)
    print(es)
