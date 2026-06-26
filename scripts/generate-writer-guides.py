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
#   本文・見出し = HeiseiKakuGo-W5（ゴシック）
from reportlab.pdfbase.cidfonts import UnicodeCIDFont  # noqa: E402

JP_FONT = "HeiseiKakuGo-W5"
JP_FONT_BOLD = "HeiseiKakuGo-W5"
pdfmetrics.registerFont(UnicodeCIDFont(JP_FONT))
pdfmetrics.registerFontFamily(
    JP_FONT, normal=JP_FONT, bold=JP_FONT_BOLD, italic=JP_FONT, boldItalic=JP_FONT_BOLD
)

pdfmetrics.registerFont(TTFont("GuideLatin", LATIN_FONT))
pdfmetrics.registerFont(TTFont("GuideLatin-Bold", LATIN_BOLD_FONT))


INK   = colors.HexColor("#24302C")
MUTED = colors.HexColor("#888888")
RULE  = colors.HexColor("#CCCCCC")
BOX_BG = colors.HexColor("#F5F5F5")


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
    "title":    cjk_style("ja_title",    fontSize=20, leading=26, alignment=TA_CENTER, textColor=INK, spaceAfter=8),
    "subtitle": cjk_style("ja_subtitle", fontSize=10.5, leading=16, alignment=TA_CENTER, textColor=MUTED, spaceAfter=14),
    "h1":       cjk_style("ja_h1",       fontSize=13, leading=18, textColor=INK, spaceBefore=8, spaceAfter=5),
    "h2":       cjk_style("ja_h2",       fontSize=11.5, leading=16, textColor=INK, spaceBefore=6, spaceAfter=4),
    "body":     cjk_style("ja_body",     fontSize=10, leading=16, spaceAfter=5),
    "small":    cjk_style("ja_small",    fontSize=8.8, leading=13, textColor=MUTED),
    "note":     cjk_style("ja_note",     fontSize=9.2, leading=14, textColor=INK),
    "subtle":   cjk_style("ja_subtle",   fontSize=8.5, leading=13, textColor=MUTED, leftIndent=4),
    "bullet":   cjk_style("ja_bullet",   fontSize=10, leading=15),
    "num":      cjk_style("ja_num",      fontSize=10, leading=15, leftIndent=0),
    "chip":     cjk_style("ja_chip",     fontSize=9.2, leading=12, textColor=INK, alignment=TA_CENTER),
}


ES = {
    "title":    latin_style("es_title",    fontSize=20, leading=26, alignment=TA_CENTER, textColor=INK, spaceAfter=8),
    "subtitle": latin_style("es_subtitle", fontSize=10.5, leading=16, alignment=TA_CENTER, textColor=MUTED, spaceAfter=14),
    "h1":       latin_style("es_h1",       fontSize=13, leading=18, textColor=INK, spaceBefore=8, spaceAfter=5),
    "h2":       latin_style("es_h2",       fontSize=11.5, leading=16, textColor=INK, spaceBefore=6, spaceAfter=4),
    "body":     latin_style("es_body",     fontSize=10, leading=15, spaceAfter=5),
    "small":    latin_style("es_small",    fontSize=8.8, leading=12.8, textColor=MUTED),
    "note":     latin_style("es_note",     fontSize=9.2, leading=14, textColor=INK),
    "subtle":   latin_style("es_subtle",   fontSize=8.5, leading=13, textColor=MUTED, leftIndent=4),
    "bullet":   latin_style("es_bullet",   fontSize=10, leading=14.7),
    "num":      latin_style("es_num",      fontSize=10, leading=14.7, leftIndent=0),
    "chip":     latin_style("es_chip",     fontSize=9.2, leading=12, textColor=INK, alignment=TA_CENTER),
}


def header_footer(canvas, doc, lang: str):
    canvas.saveState()
    width, height = A4
    canvas.setStrokeColor(RULE)
    canvas.setLineWidth(0.5)
    canvas.line(18 * mm, height - 17 * mm, width - 18 * mm, height - 17 * mm)
    canvas.setFillColor(MUTED)
    font = JP_FONT if lang == "ja" else "GuideLatin"
    canvas.setFont(font, 8)
    canvas.drawString(18 * mm, height - 13 * mm, "30nen.com")
    canvas.drawRightString(width - 18 * mm, height - 13 * mm, f"{doc.page}")
    canvas.setStrokeColor(RULE)
    canvas.line(18 * mm, 14 * mm, width - 18 * mm, 14 * mm)
    footer = "困ったときは、店主とのメッセンジャーグループ／グループLINEへ" if lang == "ja" else "Si necesitas ayuda, escribe al grupo LINE / Messenger con Tenshu"
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


def note_box(text: str, styles: dict[str, ParagraphStyle]) -> Table:
    table = Table([[p(text, styles["note"])]], colWidths=[174 * mm])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), BOX_BG),
                ("BOX", (0, 0), (-1, -1), 0.5, RULE),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
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
                ("BOX", (0, 0), (-1, -1), 0.5, RULE),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, RULE),
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
        "書き手のみなさんへ。切替前に、ゆっくり試して慣れるための案内です。",
        ["ログイン", "試し書き", "プロフィール確認", "7/29から本番"],
    )

    story.append(note_box(
        f"<b>大事な日付</b><br/>{SWITCH_DATE_JA} までは練習期間です。新システムで書いた内容はプレビューできますが、30nen.com の本番サイトには反映されません。切替日以降は、新しい投稿画面から投稿します。",
        s,
    ))
    story.append(Spacer(1, 6 * mm))

    story.append(p("まずお願いしたいこと", s["h1"]))
    story.append(bullets([
        "店主からの<b>招待メール</b>のリンクを踏んで、パスワードを自分で設定する。",
        "設定できたら <b>https://30nen.com/login</b> に入ってみる。",
        "プロフィール画面を開き、表示名・プロフィール文・写真などを確認する。",
        "<b>西暦を含めた誕生日を入力する。</b>例: 1980年4月3日。",
        "新規投稿で短い試し書きをして、画像アップロード、下書き保存、プレビューを試す。",
        "うまくいかないところ、わかりにくいところは、店主とのメッセンジャーグループ／グループLINEで知らせる。",
    ], s["bullet"]))

    story.append(p("ログインについて", s["h1"]))
    story.append(p("店主がアカウントを作ると、登録メールアドレス宛に<b>招待メール</b>が届きます。メール内のリンクを踏んで、自分でパスワードを設定してください。店主はパスワードを知りません。", s["body"]))
    story.append(bullets([
        "招待メール（件名：【三十年商店】アカウントのご案内）のリンクを踏む。",
        "パスワードを自分で決めて設定する（8文字以上）。",
        "設定完了すると、そのまま投稿管理画面が開く。",
        "次回以降は <b>https://30nen.com/login</b> からメールアドレスとパスワードで入る。",
        "パスワードを忘れたときは、ログイン画面の「パスワードを忘れた方」から再設定できる。",
        "何度試しても入れないときは、画面の様子をそのままメッセンジャー／LINEに送ってください。",
    ], s["bullet"]))

    story.append(p("プロフィール確認で大事なこと", s["h1"]))
    story.append(p("新しいサイトでは、書き手のプロフィールを少し整えて表示します。初回ログイン後に、できる範囲で確認をお願いします。", s["body"]))
    story.append(bullets([
        "表示名",
        "プロフィール文",
        "写真またはアイコン",
        "メールアドレス",
        "<b>西暦を含めた誕生日</b>",
    ], s["bullet"]))
    story.append(p("誕生日そのものは公開されません。公開ページでは「◎歳」のように年齢として表示するために使います。", s["subtle"]))
    story.append(Spacer(1, 3 * mm))
    story.append(bullets([
        "SNSやWebサイトのリンク（ある人／いれたい人だけ）",
    ], s["bullet"]))

    story.append(PageBreak())

    story.append(p("試し書きの流れ", s["h1"]))
    story.append(p("切替日までは練習用です。失敗しても大丈夫です。下書き保存とプレビューまで試してみてください。", s["body"]))
    story.append(bullets([
        "管理画面で「新規投稿」を開く。",
        "タイトル、本文を入れる。",
        "画像をアップロードして本文に入れる。",
        "プレビューで見え方を確認する。",
    ], s["num"], "1"))

    story.append(p("画像アップロードについて", s["h1"]))
    story.append(p("写真を本文に入れる方法は3つあります。", s["body"]))
    story.append(bullets([
        "<b>画像フォルダから選ぶ</b>：先に「画像フォルダ」に写真をまとめてアップロードしておき、投稿画面から選んで入れる。",
        "<b>デバイスから直接選ぶ</b>：投稿画面の「画像をデバイスから選ぶ」ボタンで、その場でアップロードして入れる。",
        "<b>ドラッグ＆ドロップ</b>：写真ファイルを本文エリアにドラッグして入れる（コピーした写真の貼り付けも可）。",
    ], s["bullet"]))
    story.append(p("うまく入らない・向きがおかしい・重すぎる気がするときは、メッセンジャー／LINEでそのまま相談してください。", s["body"]))

    story.append(p("切替日までの注意", s["h1"]))
    story.append(note_box(
        f"{SWITCH_DATE_JA} までは、あくまで練習期間です。新システム内でプレビューはできますが、本番の 30nen.com には反映されません。いつもの投稿が必要な場合は、切替日まではこれまで通りの方法を使ってください。",
        s,
    ))

    story.append(p("こまかい話（読み飛ばしても投稿はできます）", s["h2"]))
    story.append(bullets([
        "<b>自動保存</b>：書いている途中の新規・下書きは、自動で保存されます。公開済みの記事を直したときだけ、最後に「投稿する」を押してください。",
        "<b>下書き保存と投稿する</b>：「下書き保存」はまだ公開されません（あとで続けられます）。「投稿する」を押すとサイトに公開されます。",
        "<b>連載のえらび方</b>：ふつうは自分の連載が自動で入っています。複数の連載を担当している人だけ、連載欄で選んでください。",
        "<b>写真の形式</b>：使えるのは JPEG・PNG・GIF・WebP。重い写真もサイト側で自動的に軽くします。うまくいかない時は1枚ずつ、Wi-Fiで試してください。",
        "<b>アイキャッチ画像</b>：「投稿する」のとき、アイキャッチ画像（記事の代表写真）が未設定だと確認が出ます。アイキャッチ画像は必須です。必ず設定してください。",
        "<b>公開の日時</b>：公開日時は日本時間です。空欄のまま投稿すると「今すぐ公開」になります。よくわからなければ空欄で大丈夫です。",
    ], s["small"]))

    story.append(p("困ったとき", s["h1"]))
    story.append(p("店主とのメッセンジャーグループ／グループLINEに、次のどれかを送ってください。", s["body"]))
    story.append(bullets([
        "どの画面で止まったか",
        "表示されたメッセージ",
        "スマホなら画面のスクリーンショット",
        "「ログインできない」「画像が入らない」など一言だけでもOK",
    ], s["bullet"]))

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
    ))
    story.append(Spacer(1, 6 * mm))

    story.append(p("Lo primero que te pedimos", s["h1"]))
    story.append(bullets([
        "Abre el correo de invitación que recibirás y haz clic en el enlace para crear tu contraseña.",
        "Una vez configurada, entra a <b>https://30nen.com/login</b>.",
        "Abre tu perfil y revisa tu nombre, texto de presentación y foto.",
        "<b>Completa tu fecha de nacimiento con el año.</b> Ejemplo: 3 de abril de 1980.",
        "Haz una entrada de prueba: escribe algo corto, sube una imagen, guarda como borrador y mira la vista previa.",
        "Si algo no funciona o no se entiende, avisa en el grupo LINE / Messenger con Tenshu.",
    ], s["bullet"]))

    story.append(p("Sobre el inicio de sesión", s["h1"]))
    story.append(p("Cuando Tenshu cree tu cuenta, recibirás un <b>correo de invitación</b>. Haz clic en el enlace del correo y elige tu propia contraseña. Tenshu no sabrá tu contraseña.", s["body"]))
    story.append(bullets([
        "Abre el correo con asunto「【三十年商店】アカウントのご案内」y haz clic en el enlace.",
        "Escoge una contraseña (mínimo 8 caracteres) y guárdala.",
        "Al terminar, se abrirá directamente la pantalla de administración.",
        "La próxima vez: entra desde <b>https://30nen.com/login</b> con tu correo y contraseña.",
        "Si olvidas la contraseña, usa el enlace「パスワードを忘れた方」en la pantalla de login.",
        "Si no puedes entrar, envía al LINE / Messenger una captura o describe qué aparece.",
    ], s["bullet"]))

    story.append(p("Revisa tu perfil", s["h1"]))
    story.append(p("En el nuevo sitio, el perfil de cada escritora o escritor se mostrará de una forma un poco más ordenada. Después de entrar por primera vez, revisa lo siguiente cuando puedas.", s["body"]))
    story.append(bullets([
        "Nombre que se mostrará en el sitio",
        "Texto de perfil",
        "Foto o icono",
        "Correo electrónico",
        "<b>Fecha de nacimiento con el año</b>",
    ], s["bullet"]))
    story.append(p("Tu fecha completa de nacimiento no aparecerá en la página pública. Se usará para mostrar la edad, por ejemplo \"◎ años\".", s["subtle"]))
    story.append(Spacer(1, 3 * mm))
    story.append(bullets([
        "Enlaces a redes sociales o sitio web, solo si los tienes o quieres añadir",
    ], s["bullet"]))

    story.append(PageBreak())

    story.append(p("Como hacer una prueba", s["h1"]))
    story.append(p("Hasta la fecha de cambio, puedes practicar sin miedo. Prueba a guardar como borrador y revisar la vista previa.", s["body"]))
    story.append(bullets([
        "Abre \"Nueva entrada\" en la pantalla de administracion.",
        "Escribe un titulo y el texto.",
        "Sube una imagen y colócala en el texto.",
        "Abre la vista previa y revisa como se ve.",
    ], s["num"], "1"))

    story.append(p("Sobre las imagenes", s["h1"]))
    story.append(p("Hay tres formas de añadir fotos al texto:", s["body"]))
    story.append(bullets([
        "<b>Desde la carpeta de imágenes</b>: sube las fotos antes a la \"Carpeta de imágenes\" y luego elige desde la pantalla de edición.",
        "<b>Desde el dispositivo</b>: usa el botón \"Elegir desde el dispositivo\" para subir y colocar la foto en el momento.",
        "<b>Arrastrar y soltar</b>: arrastra el archivo de foto al área de texto (también puedes pegar con Ctrl/Cmd+V).",
    ], s["bullet"]))
    story.append(p("Si no entra bien, queda girada o parece demasiado pesada, consulta por LINE / Messenger.", s["body"]))

    story.append(p("Atencion durante el periodo de practica", s["h1"]))
    story.append(note_box(
        f"Hasta el {SWITCH_DATE_ES}, el nuevo sistema es solo para practicar. Podrás ver tus pruebas con la vista previa, pero no se publicarán en el 30nen.com real. Si necesitas publicar algo antes del cambio, usa el método de siempre.",
        s,
    ))

    story.append(p("Detalles (puedes saltarlos: igual podrás publicar)", s["h2"]))
    story.append(bullets([
        "<b>Guardado automático</b>: mientras escribes una entrada nueva o un borrador, se guarda solo. Solo cuando edites una entrada ya publicada, pulsa \"Publicar\" al final.",
        "<b>Borrador y Publicar</b>: \"Guardar borrador\" no publica nada (puedes seguir después). \"Publicar\" la muestra en el sitio.",
        "<b>La serie (categoría)</b>: normalmente tu serie ya viene elegida. Solo quienes llevan varias series deben elegirla en el campo de serie.",
        "<b>Formatos de foto</b>: puedes usar JPEG, PNG, GIF y WebP. El sitio aligera solo las fotos pesadas. Si falla, sube una por una y prueba con Wi-Fi.",
        "<b>Imagen destacada</b>: al pulsar \"Publicar\" sin imagen destacada aparece una confirmación. La imagen destacada es obligatoria; asegúrate de añadirla.",
        "<b>Fecha y hora</b>: la fecha de publicación usa la hora de Japón. Si la dejas en blanco, se publica de inmediato. Si dudas, déjala en blanco.",
    ], s["small"]))

    story.append(p("Si necesitas ayuda", s["h1"]))
    story.append(p("En el grupo LINE / Messenger con Tenshu puedes enviar cualquiera de estas cosas.", s["body"]))
    story.append(bullets([
        "En qué pantalla te quedaste",
        "El mensaje que aparece",
        "Una captura de pantalla desde el telefono",
        "Una frase corta como \"no puedo entrar\" o \"no puedo subir la imagen\"",
    ], s["bullet"]))

    doc.build(story)
    return filename


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    ja = build_ja()
    es = build_es()
    print(ja)
    print(es)
