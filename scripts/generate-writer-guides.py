# 書き手向けガイド（日本語・スペイン語）のPDFを作るスクリプト。
#   出力: output/pdf/30nen-writer-guide-ja.pdf / -es.pdf
#   実行: python3 scripts/generate-writer-guides.py
#   必要: pip install reportlab
from __future__ import annotations

from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    Image,
    ListFlowable,
    ListItem,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)
from reportlab.pdfbase.cidfonts import UnicodeCIDFont


ROOT = Path(__file__).resolve().parents[1]
OUT  = ROOT / "output" / "pdf"
LOGO = ROOT / "ph_data" / "30nen_logo_noren.jpg"

LOGIN_URL       = "https://30nen.com/login"
SWITCH_DATE_JA  = "2026年7月29日（水）"
SWITCH_DATE_ES  = "29 de julio de 2026 (miércoles)"

# 日本語フォント:
#   本文・箇条書き = HeiseiMin-W3（明朝・細め）
#   見出し・強調   = HeiseiKakuGo-W5（ゴシック・やや太）
JP_NORMAL = "HeiseiMin-W3"
JP_BOLD   = "HeiseiKakuGo-W5"
pdfmetrics.registerFont(UnicodeCIDFont(JP_NORMAL))
pdfmetrics.registerFont(UnicodeCIDFont(JP_BOLD))
# <b> タグが効くよう「本文フォント→太字はゴシック」でひもづけ。
pdfmetrics.registerFontFamily(
    JP_NORMAL, normal=JP_NORMAL, bold=JP_BOLD, italic=JP_NORMAL, boldItalic=JP_BOLD
)

LATIN       = "/System/Library/Fonts/Supplemental/Arial.ttf"
LATIN_BOLD  = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
pdfmetrics.registerFont(TTFont("Lat",  LATIN))
pdfmetrics.registerFont(TTFont("LatB", LATIN_BOLD))
pdfmetrics.registerFontFamily("Lat", normal="Lat", bold="LatB", italic="Lat", boldItalic="LatB")

INK   = colors.HexColor("#24302C")
MUTED = colors.HexColor("#999999")
RULE  = colors.HexColor("#CCCCCC")
WHITE = colors.white


def cjk(name, **kw):
    return ParagraphStyle(name, fontName=kw.pop("fontName", JP_NORMAL),
                          textColor=kw.pop("textColor", INK),
                          leading=kw.pop("leading", 15),
                          wordWrap=kw.pop("wordWrap", "CJK"), **kw)

def lat(name, **kw):
    return ParagraphStyle(name, fontName=kw.pop("fontName", "Lat"),
                          textColor=kw.pop("textColor", INK),
                          leading=kw.pop("leading", 15), **kw)


JA = {
    "title":    cjk("ja_title",    fontName=JP_BOLD,   fontSize=19, leading=25, alignment=TA_CENTER, spaceAfter=6),
    "subtitle": cjk("ja_subtitle", fontSize=10,         leading=16, alignment=TA_CENTER, spaceAfter=12),
    "h1":       cjk("ja_h1",       fontName=JP_BOLD,   fontSize=12, leading=17, spaceBefore=7, spaceAfter=3, leftIndent=-12),
    "h2":       cjk("ja_h2",       fontName=JP_BOLD,   fontSize=10.5, leading=15, spaceBefore=10, spaceAfter=3, leftIndent=-12),
    "body":     cjk("ja_body",     fontSize=10,         leading=16, spaceAfter=5),
    "small":    cjk("ja_small",    fontSize=8.8,        leading=13, textColor=MUTED),
    "note":     cjk("ja_note",     fontSize=9.5,        leading=15),
    "subtle":   cjk("ja_subtle",   fontSize=8.5,        leading=13, textColor=MUTED, leftIndent=4),
    "bullet":   cjk("ja_bullet",   fontSize=10,         leading=15),
    "num":      cjk("ja_num",      fontSize=10,         leading=15),
    "chip":     cjk("ja_chip",     fontName=JP_BOLD,   fontSize=8.5, leading=12, alignment=TA_CENTER),
}

ES = {
    "title":    lat("es_title",    fontName="LatB", fontSize=19, leading=25, alignment=TA_CENTER, spaceAfter=6),
    "subtitle": lat("es_subtitle", fontSize=10, leading=15, alignment=TA_CENTER, textColor=MUTED, spaceAfter=12),
    "h1":       lat("es_h1",       fontName="LatB", fontSize=12, leading=17, spaceBefore=10, spaceAfter=4, leftIndent=-12),
    "h2":       lat("es_h2",       fontName="LatB", fontSize=10.5, leading=15, spaceBefore=7, spaceAfter=3, leftIndent=-12),
    "body":     lat("es_body",     fontSize=10, leading=15, spaceAfter=5),
    "small":    lat("es_small",    fontSize=8.8, leading=12.8, textColor=MUTED),
    "note":     lat("es_note",     fontSize=9.5, leading=14.5),
    "subtle":   lat("es_subtle",   fontSize=8.5, leading=13, textColor=MUTED, leftIndent=4),
    "bullet":   lat("es_bullet",   fontSize=10, leading=14.7),
    "num":      lat("es_num",      fontSize=10, leading=14.7),
    "chip":     lat("es_chip",     fontName="LatB", fontSize=8.5, leading=12, alignment=TA_CENTER),
}


def footer_only(canvas, doc, lang: str):
    """ヘッダー・フッターなし。"""
    pass


class GuideDoc(BaseDocTemplate):
    def __init__(self, filename: str, lang: str):
        super().__init__(filename, pagesize=A4,
                         leftMargin=18*mm, rightMargin=18*mm,
                         topMargin=16*mm, bottomMargin=18*mm)
        frame = Frame(self.leftMargin, self.bottomMargin, self.width, self.height,
                      leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0, id="main")
        self.addPageTemplates([PageTemplate(
            id="guide", frames=[frame],
            onPage=lambda c, d: footer_only(c, d, lang)
        )])


def p(text, style): return Paragraph(text, style)

def blist(items, style, btype="bullet"):
    return ListFlowable(
        [ListItem(p(item, style), leftIndent=8) for item in items],
        bulletType=btype,
        start="1" if btype == "1" else None,
        leftIndent=14, bulletFontSize=8, bulletOffsetY=1,
    )

def note_box(text, styles):
    """実線囲み・背景なし・チップスと同じケイ・テキスト太字。"""
    # noteスタイルをベースに太字フォントを上書き
    bold_note = ParagraphStyle("note_bold", parent=styles["note"],
                               fontName=JP_BOLD if styles is JA else "LatB")
    tbl = Table([[p(text, bold_note)]], colWidths=[174*mm])
    tbl.setStyle(TableStyle([
        ("BACKGROUND",    (0,0), (-1,-1), WHITE),
        ("BOX",           (0,0), (-1,-1), 0.5, RULE),
        ("LEFTPADDING",   (0,0), (-1,-1), 8),
        ("RIGHTPADDING",  (0,0), (-1,-1), 8),
        ("TOPPADDING",    (0,0), (-1,-1), 6),
        ("BOTTOMPADDING", (0,0), (-1,-1), 6),
    ]))
    return tbl

def chips(items, styles):
    n = len(items)
    w = 174 / n
    row = [[p(item, styles["chip"]) for item in items]]
    tbl = Table(row, colWidths=[w*mm]*n, hAlign="CENTER")
    tbl.setStyle(TableStyle([
        ("BACKGROUND",    (0,0), (-1,-1), WHITE),
        ("BOX",           (0,0), (-1,-1), 0.5, RULE),
        ("INNERGRID",     (0,0), (-1,-1), 0.5, RULE),
        ("TOPPADDING",    (0,0), (-1,-1), 5),
        ("BOTTOMPADDING", (0,0), (-1,-1), 5),
        ("LEFTPADDING",   (0,0), (-1,-1), 3),
        ("RIGHTPADDING",  (0,0), (-1,-1), 3),
    ]))
    return tbl

def cover(story, styles, title, subtitle, chips_items):
    if LOGO.exists():
        img = Image(str(LOGO), width=44*mm, height=24*mm)
        img.hAlign = "CENTER"
        story.append(img)
        story.append(Spacer(1, 5*mm))
    story.append(p(title, styles["title"]))
    story.append(p(subtitle, styles["subtitle"]))
    story.append(chips(chips_items, styles))
    story.append(Spacer(1, 8*mm))


# ── 日本語版 ──────────────────────────────────────────────────────────────
def build_ja():
    filename = OUT / "30nen-writer-guide-ja.pdf"
    doc = GuideDoc(str(filename), "ja")
    s = JA
    story = []

    cover(story, s,
        "30nen.com 新しい投稿画面の手引き",
        "書き手のみなさん、いつも更新ありがとう。サイトお引越のため、たびたびお手数おかけします。<br/>わかりにくいところや不便に感じたところは、すぐに言ってねー！",
        ["ログイン", "パスワード変更", "プロフィール確認", "試し書き", "7/29から本番"],
    )

    story.append(note_box(
        f"{SWITCH_DATE_JA} までは練習期間です。新システムで書いた内容はプレビューできますが、30nen.com の本番サイトには反映されません。切替日以降は、新しい投稿画面から投稿をお願いします。",
        s,
    ))
    story.append(Spacer(1, 6*mm))

    story.append(p("まずお願いしたいこと", s["h1"]))
    story.append(blist([
        "<b>店主からの招待メール</b>のリンクを踏んで、仮パスワードでログイン後、<b>パスワードを再設定</b>する。",
        "設定できたら <b>https://30nen.com/login</b> に入ってみる。",
        "プロフィール画面 [myPROFILE] を開き、<b>西暦を含めた誕生日を入力する。</b>例: 1980年4月3日。<br/>　表示名・プロフィール文・写真、SNSのURLなどを確認する。",
        "投稿画面 [日記をかく] を開き、タイトル、本文、画像アップロード、 [下書き保存] 、 [プレビュー] を試す。",
        "うまくいかないところはメッセンジャーグループ／グループLINEで知らせる。",
    ], s["bullet"]))

    story.append(p("ログインについて", s["h1"]))
    story.append(p("店主がアカウントを作ると、登録メールアドレス宛に<b>招待メール</b>が届きます。", s["body"]))
    story.append(blist([
        "招待メール（件名：【三十年商店】アカウントのご案内）のリンクを踏む。",
        "パスワードを自分で決めて設定する（8文字以上）。",
        "設定完了すると、そのまま投稿管理画面が開く。",
        "次回以降は <b>https://30nen.com/login</b> からメールアドレスとパスワードで入る。",
        "パスワードを忘れたときは、ログイン画面の「パスワードを忘れた方」から再設定できる。",
        "何度試しても入れないときは、画面の様子をそのままメッセンジャー／LINEに送ってください。",
    ], s["bullet"]))

    story.append(p("パスワードを変更したいとき", s["h1"]))
    story.append(p("ログイン後、右上の [myPROFILE] →「パスワード」欄から変更できます。", s["body"]))

    story.append(p("プロフィール確認で大事なこと", s["h1"]))
    story.append(p("新しいシステムでは、書き手のプロフィール（とくに年齢の部分）の反映方法を変更します。初回ログイン後に確認をお願いします。", s["body"]))
    story.append(blist([
        "名前（表示名）※ 基本的には店主が登録済みの予定。ヌケ、間違いがないか確認してね！",
        "写真またはアイコン ※",
        "<b>西暦を含めた誕生日</b>",
    ], s["bullet"]))
    story.append(p("誕生日そのものは公開されません。公開ページでは「◎歳」のように年齢として表示するために使います。", s["subtle"]))
    story.append(blist([
        "居住地 ※",
        "SNSやWebサイトのリンク（ある人／いれたい人だけ）※",
    ], s["bullet"]))

    story.append(PageBreak())

    story.append(p("試し書きの流れ", s["h1"]))
    story.append(p("切替日までは練習用です。 [下書き保存] と [プレビュー] まで試してみてください。", s["body"]))
    story.append(blist([
        "管理画面で [新しい日記をかく] を開く。",
        "タイトル、本文を入れる。",
        "画像をアップロードして本文に入れる。",
        "プレビューで見え方を確認する。",
    ], s["num"], "1"))

    story.append(p("画像アップロードについて", s["h1"]))
    story.append(p("写真を本文に入れる方法は3つあります。", s["body"]))
    story.append(blist([
        "<b>画像フォルダから選ぶ</b>：先に [画像フォルダ] に写真をまとめてアップロードしておき、投稿画面から選んで入れる。",
        "<b>デバイスから直接選ぶ</b>：投稿画面の [画像をデバイスから選ぶ] ボタンで、その場でアップロードして入れる。",
        "<b>ドラッグ＆ドロップ</b>：写真ファイルを本文エリアにドラッグして入れる（コピーした写真の貼り付けも可）。",
    ], s["bullet"]))

    story.append(p("切替日までの注意", s["h1"]))
    story.append(note_box(
        f"{SWITCH_DATE_JA} までは、あくまで練習期間です。新システム内でプレビューはできますが、本番の 30nen.com には反映されません。2026年7月28日までは、WordPressで投稿してください。切替日の切替時間は午前中を予定しています。",
        s,
    ))

    story.append(p("こまかい話（読み飛ばしても投稿はできます）", s["h2"]))
    story.append(blist([
        "<b>自動保存</b>：書いている途中の新規・下書きは、自動で保存されます。公開済みの記事を直したときだけ、最後に [更新する] を押してください。",
        "<b>下書き保存と投稿する</b>： [下書き保存] はまだ公開されません（あとで続けられます）。 [投稿する] を押すとサイトに公開されます。",
        "<b>連載のえらび方</b>：あらかじめアカウントと連載を紐付けてあります。ヌケ、間違いがあったら教えてください。",
        "<b>写真の形式</b>：使えるのは JPEG・PNG・GIF・WebP。重い写真もサイト側で自動的に軽くします。うまくいかない時は1枚ずつ、Wi-Fiで試してください。",
        "<b>アイキャッチ画像</b>：「投稿する」のとき、アイキャッチ画像（記事の代表写真）が未設定だと確認が出ます。アイキャッチ画像は必須です。必ず設定してください。",
        "<b>公開の日時</b>：公開日時は日本時間です。空欄のまま投稿すると「今すぐ公開」になります。過去や未来の時間も設定可能です。",
    ], s["bullet"]))

    story.append(p("困ったとき", s["h1"]))
    story.append(p("店主とのメッセンジャーグループ／グループLINEに、次のどれかを送ってください。", s["body"]))
    story.append(blist([
        "どの画面で止まったか",
        "表示されたメッセージ",
        "スマホなら画面のスクリーンショット",
        "「ログインできない」「画像が入らない」「すぐおちる！」など一言だけでもOK！",
    ], s["bullet"]))

    doc.build(story)
    return filename


# ── スペイン語版 ──────────────────────────────────────────────────────────
def build_es():
    filename = OUT / "30nen-writer-guide-es.pdf"
    doc = GuideDoc(str(filename), "es")
    s = ES
    story = []

    cover(story, s,
        "Guia para escribir en el nuevo 30nen.com",
        "Gracias siempre por escribir. Esta es la guía de pasos para el cambio de sistema.",
        ["Login", "Cambiar clave", "Perfil", "Prueba", "Desde el 29/7"],
    )

    story.append(note_box(
        f"Hasta el {SWITCH_DATE_ES}, el nuevo sistema será solo para practicar. Podrás ver una vista previa de tus pruebas, pero no aparecerán en el sitio público. Desde la fecha de cambio, las publicaciones se harán desde el nuevo sistema.",
        s,
    ))
    story.append(Spacer(1, 5*mm))

    story.append(p("Lo primero que te pedimos", s["h1"]))
    story.append(blist([
        "Abre el correo de invitación que recibirás y haz clic en el enlace para crear tu contraseña.",
        "Una vez configurada, entra a <b>https://30nen.com/login</b>.",
        "Abre tu perfil y revisa tu nombre, texto de presentación y foto.",
        "<b>Completa tu fecha de nacimiento con el año.</b> Ejemplo: 3 de abril de 1980.",
        "Haz una entrada de prueba: escribe algo, sube una imagen y mira la vista previa.",
        "Si algo no funciona, avisa en el grupo LINE / Messenger.",
    ], s["bullet"]))

    story.append(p("Sobre el inicio de sesión", s["h1"]))
    story.append(p("Cuando Tenshu cree tu cuenta, recibirás un <b>correo de invitación</b>. Haz clic en el enlace del correo y elige tu propia contraseña.", s["body"]))
    story.append(blist([
        "Abre el correo con asunto「【三十年商店】アカウントのご案内」y haz clic en el enlace.",
        "Escoge una contraseña (mínimo 8 caracteres) y guárdala.",
        "Al terminar, se abrirá directamente la pantalla de administración.",
        "La próxima vez: entra desde <b>https://30nen.com/login</b> con tu correo y contraseña.",
        "Si olvidas la contraseña, usa el enlace「パスワードを忘れた方」en la pantalla de login.",
        "Si no puedes entrar, envía al LINE / Messenger una captura o describe qué aparece.",
    ], s["bullet"]))

    story.append(p("Cambiar la contraseña", s["h1"]))
    story.append(p("Después de entrar, ve a \"myPROFILE\" (arriba a la derecha) → campo \"Contraseña\".", s["body"]))

    story.append(p("Revisa tu perfil", s["h1"]))
    story.append(p("En el nuevo sitio, el perfil de cada escritora o escritor se mostrará de forma más ordenada. Revisa lo siguiente cuando puedas.", s["body"]))
    story.append(blist([
        "Nombre que se mostrará en el sitio",
        "Texto de perfil (presentación)",
        "Foto o icono",
        "Correo electrónico",
        "<b>Fecha de nacimiento con el año</b>",
    ], s["bullet"]))
    story.append(p("Tu fecha completa de nacimiento no aparecerá en la página pública. Se usará para mostrar la edad, por ejemplo \"◎ años\".", s["subtle"]))
    story.append(Spacer(1, 3*mm))
    story.append(blist([
        "Lugar de residencia",
        "Enlaces a redes sociales o sitio web, solo si los tienes o quieres añadir",
    ], s["bullet"]))

    story.append(PageBreak())

    story.append(p("Como hacer una entrada de prueba", s["h1"]))
    story.append(p("Hasta la fecha de cambio, puedes practicar sin miedo. Prueba guardar como borrador y revisar la vista previa.", s["body"]))
    story.append(blist([
        "Abre \"Nueva entrada\" en la pantalla de administración.",
        "Escribe un título y el texto.",
        "Sube una imagen y colócala en el texto.",
        "Abre la vista previa y revisa cómo se ve.",
    ], s["num"], "1"))

    story.append(p("Sobre las imágenes", s["h1"]))
    story.append(p("Hay tres formas de añadir fotos al texto:", s["body"]))
    story.append(blist([
        "<b>Desde la carpeta de imágenes</b>: sube las fotos antes a la \"Carpeta de imágenes\" y luego elige desde la pantalla de edición.",
        "<b>Desde el dispositivo</b>: usa el botón \"Elegir desde el dispositivo\" para subir y colocar la foto en el momento.",
        "<b>Arrastrar y soltar</b>: arrastra el archivo de foto al área de texto (también puedes pegar con Ctrl/Cmd+V).",
    ], s["bullet"]))
    story.append(p("Si no entra bien o queda girada, consulta por LINE / Messenger.", s["body"]))

    story.append(p("Atención durante el periodo de práctica", s["h1"]))
    story.append(note_box(
        f"Hasta el {SWITCH_DATE_ES}, el nuevo sistema es solo para practicar. No se publicará nada en el 30nen.com real. Si necesitas publicar algo antes del cambio, usa el método de siempre.",
        s,
    ))

    story.append(p("Detalles (puedes saltarlos)", s["h2"]))
    story.append(blist([
        "<b>Guardado automático</b>: mientras escribes un borrador nuevo, se guarda solo. Solo cuando edites algo ya publicado, pulsa \"Publicar\" al final.",
        "<b>Borrador y Publicar</b>: \"Guardar borrador\" no publica nada. \"Publicar\" lo muestra en el sitio.",
        "<b>La serie</b>: normalmente tu serie ya viene elegida. Solo quienes llevan varias series deben elegirla.",
        "<b>Formatos de foto</b>: JPEG, PNG, GIF y WebP. El sitio aligera las fotos pesadas. Si falla, sube una por una con Wi-Fi.",
        "<b>Imagen destacada</b>: al publicar sin imagen destacada aparece una confirmación. La imagen destacada es obligatoria.",
        "<b>Fecha y hora</b>: usa la hora de Japón. Si la dejas en blanco, se publica de inmediato.",
    ], s["bullet"]))

    story.append(p("Si necesitas ayuda", s["h1"]))
    story.append(p("En el grupo LINE / Messenger puedes enviar cualquiera de estas cosas.", s["body"]))
    story.append(blist([
        "En qué pantalla te quedaste",
        "El mensaje que aparece",
        "Una captura de pantalla desde el teléfono",
        "Una frase corta como \"no puedo entrar\" o \"no puedo subir la imagen\"",
    ], s["bullet"]))

    doc.build(story)
    return filename


if __name__ == "__main__":
    import shutil
    OUT.mkdir(parents=True, exist_ok=True)
    PUBLIC_PDF = ROOT / "public" / "pdf"
    PUBLIC_PDF.mkdir(parents=True, exist_ok=True)

    ja = build_ja()
    es = build_es()
    print(ja)
    print(es)

    # public/pdf/ にもコピーしてURLからダウンロードできるようにする。
    shutil.copy(ja, PUBLIC_PDF / ja.name)
    shutil.copy(es, PUBLIC_PDF / es.name)
    print(f"→ public/pdf/ にコピーしました")
