export type Locale = 'ja' | 'es';

const dict = {
  // ── ログイン ─────────────────────────────────
  'login.title': { ja: 'ログイン', es: 'Iniciar sesión' },
  'login.email': { ja: 'メールアドレス', es: 'Correo electrónico' },
  'login.password': { ja: 'パスワード', es: 'Contraseña' },
  'login.submit': { ja: 'ログイン', es: 'Iniciar sesión' },
  'login.submitting': { ja: 'ログイン中…', es: 'Iniciando sesión…' },
  'login.forgot': { ja: 'パスワードを忘れた方', es: '¿Olvidaste tu contraseña?' },

  // ── パスワードリセット ──────────────────────────
  'forgot.title': { ja: 'パスワードの再設定', es: 'Restablecer contraseña' },
  'forgot.email': { ja: 'メールアドレス', es: 'Correo electrónico' },
  'forgot.submit': { ja: 'リセットメールを送る', es: 'Enviar correo de restablecimiento' },
  'forgot.submitting': { ja: '送信中…', es: 'Enviando…' },
  'forgot.backToLogin': { ja: '← ログイン画面に戻る', es: '← Volver al inicio de sesión' },
  'forgot.description': { ja: '登録しているメールアドレスを入力してください。パスワードを再設定するためのリンクをお送りします。', es: 'Ingresa tu correo electrónico registrado. Te enviaremos un enlace para restablecer tu contraseña.' },

  // ── 管理画面ヘッダー ─────────────────────────────
  'admin.title': { ja: '投稿', es: 'Publicaciones' },
  'admin.categories': { ja: '連載', es: 'Series' },
  'admin.users': { ja: '投稿者', es: 'Escritores' },
  'admin.settings': { ja: 'サイト設定', es: 'Configuración' },
  'admin.media': { ja: '画像フォルダ', es: 'Imágenes' },
  'admin.profile': { ja: 'myPROFILE', es: 'myPROFILE' },
  'admin.newArticle': { ja: '新しい日記をかく', es: 'Nueva entrada' },
  'admin.logout': { ja: 'ログアウト', es: 'Cerrar sesión' },
  'admin.welcome': { ja: 'ようこそ、{name} さん（{role}）。', es: '¡Bienvenido/a, {name}! ({role})' },
  'admin.roleAdmin': { ja: '管理者', es: 'Administrador' },
  'admin.roleAuthor': { ja: '投稿者', es: 'Escritor/a' },
  'admin.noArticles': { ja: 'まだ記事がありません。「{label}」から書いてみましょう。', es: 'Aún no hay artículos. Empieza a escribir desde "{label}".' },
  'admin.countSummary': { ja: '全部 {total}件（公開 {published}件・下書き {draft}件）', es: 'Total: {total} (publicados: {published} · borradores: {draft})' },
  'admin.statusPublished': { ja: '公開', es: 'Publicado' },
  'admin.statusDraft': { ja: '下書き', es: 'Borrador' },
  'admin.publishedAt': { ja: '公開: {date}', es: 'Publicado: {date}' },
  'admin.updatedAt': { ja: '更新: {date}', es: 'Actualizado: {date}' },
  'admin.edit': { ja: '編集', es: 'Editar' },
  'admin.delete': { ja: '削除', es: 'Eliminar' },
  'admin.backToList': { ja: '← 一覧へ戻る', es: '← Volver a la lista' },
  'admin.backToAdmin': { ja: '← 投稿へ戻る', es: '← Volver a publicaciones' },

  // ── 記事フォーム ────────────────────────────────
  'article.newTitle': { ja: '新しい日記をかく', es: 'Nueva entrada' },
  'article.editTitle': { ja: '記事を編集', es: 'Editar artículo' },
  'article.titleLabel': { ja: 'タイトル', es: 'Título' },
  'article.bodyLabel': { ja: '本文', es: 'Contenido' },
  'article.publishedAtLabel': { ja: '公開日時', es: 'Fecha de publicación' },
  'article.publishedAtHint': { ja: '空欄のまま「投稿する」を押すと今すぐ公開します。日時を選ぶと、その日時で公開します（過去の日付にも設定できます）。', es: 'Si lo dejas en blanco y presionas "Publicar", se publicará ahora. Si eliges una fecha y hora, se publicará en ese momento (también puedes elegir una fecha pasada).' },
  'article.categoryLabel': { ja: '連載', es: 'Serie' },
  'article.categoryEmpty': { ja: '連載がまだ登録されていません。管理者に連載の作成を依頼してください。', es: 'Aún no hay series registradas. Pide al administrador que cree una serie.' },
  'article.categoryPlaceholder': { ja: '連載を選んでください', es: 'Selecciona una serie' },
  'article.saveDraft': { ja: '下書き保存', es: 'Guardar borrador' },
  'article.saving': { ja: '保存中…', es: 'Guardando…' },
  'article.publish': { ja: '投稿する', es: 'Publicar' },
  'article.update': { ja: '更新する', es: 'Actualizar' },
  'article.submitting': { ja: '送信中…', es: 'Enviando…' },
  'article.preview': { ja: 'プレビュー', es: 'Vista previa' },
  'article.previewBusy': { ja: 'プレビュー準備中…', es: 'Preparando vista previa…' },
  'article.autosaveEnabled': { ja: '', es: '' },
  'article.autosaveSaving': { ja: '自動保存中…', es: 'Guardando automáticamente…' },
  'article.autosaveDone': { ja: '自動保存しました {time}', es: 'Guardado automáticamente {time}' },
  'article.autosaveFailed': { ja: '自動保存できませんでした（手動で保存してください）', es: 'No se pudo guardar automáticamente (guarda manualmente)' },
  'article.autosaveDisabled': { ja: '公開中の記事は自動保存されません。編集後は「更新する」で保存してください。', es: 'Los artículos publicados no se guardan automáticamente. Después de editar, guarda con "Actualizar".' },
  'article.confirmNoImage': { ja: 'アイキャッチ画像が未設定です。このまま公開しますか？', es: 'No se ha establecido una imagen destacada. ¿Publicar de todas formas?' },
  'article.featuredHint': { ja: 'アイキャッチ画像を設定しない場合、記事一覧やSNSに出る表示には、自動的に本文一番上の画像が使われます。別の画像にしたいときだけ設定してください。', es: 'Si no estableces una imagen destacada, en los listados de artículos y en redes sociales se usará automáticamente la primera imagen del cuerpo. Configúrala solo si quieres usar una imagen distinta.' },
  'article.previewEmpty': { ja: 'プレビューする内容（タイトルか本文）を入力してください。', es: 'Ingresa un título o contenido para la vista previa.' },
  'article.previewFailed': { ja: '保存に失敗したためプレビューを開けません。少し書いてから再度お試しください。', es: 'No se pudo abrir la vista previa porque falló el guardado. Escribe algo e inténtalo de nuevo.' },

  // ── アイキャッチ画像 ──────────────────────────────
  'image.featuredLabel': { ja: 'アイキャッチ画像（記事の代表画像・任意）', es: 'Imagen destacada (imagen principal del artículo, opcional)' },
  'image.previewAlt': { ja: 'アイキャッチのプレビュー', es: 'Vista previa de la imagen destacada' },
  'image.fromDevice': { ja: '画像をデバイスから選ぶ', es: 'Elegir desde el dispositivo' },
  'image.fromFolder': { ja: '画像フォルダから選ぶ', es: 'Desde la carpeta de imágenes' },
  'image.uploading': { ja: 'アップロード中…', es: 'Subiendo…' },
  'image.uploadFailed': { ja: 'アップロードに失敗しました。', es: 'Error al subir la imagen.' },
  'image.remove': { ja: '削除', es: 'Eliminar' },

  // ── 画像フォルダ ────────────────────────────────
  'media.title': { ja: '画像フォルダ', es: 'Carpeta de imágenes' },
  'media.addPhoto': { ja: '写真を追加', es: 'Añadir fotos' },
  'media.description': { ja: 'これまでに上げた写真の一覧です（全{count}枚）。写真をクリックすると大きく表示します。削除できるのは自分が上げた写真だけです', es: 'Lista de fotos subidas ({count} en total). Haz clic en una foto para ampliarla. Solo puedes eliminar las fotos que tú subiste' },
  'media.adminNote': { ja: '（管理者はすべて削除できます）', es: ' (los administradores pueden eliminar todas)' },
  'media.empty': { ja: 'まだ写真がありません。日記に写真を入れると、ここに集まります。', es: 'Aún no hay fotos. Cuando agregues fotos a un diario, aparecerán aquí.' },
  'media.confirmDelete': { ja: 'この写真を削除しますか？元に戻せません。\n（記事で使っている写真を消すと、その記事から写真が消えます）', es: '¿Eliminar esta foto? No se puede deshacer.\n(Si eliminas una foto que se usa en un artículo, desaparecerá del artículo)' },
  'media.uploadingProgress': { ja: 'アップロード中… {done} / {total}', es: 'Subiendo… {done} / {total}' },
  'media.close': { ja: '閉じる', es: 'Cerrar' },
  'media.prev': { ja: '← 前へ', es: '← Anterior' },
  'media.next': { ja: '次へ →', es: 'Siguiente →' },

  // ── 画像ピッカーモーダル ───────────────────────────
  'picker.title': { ja: '画像フォルダから選ぶ', es: 'Seleccionar de la carpeta de imágenes' },
  'picker.loading': { ja: '読み込み中…', es: 'Cargando…' },
  'picker.loadFailed': { ja: '読み込みに失敗しました。', es: 'Error al cargar.' },
  'picker.empty': { ja: 'まだ写真がありません。「写真を追加」で先に写真をアップロードしてください。', es: 'Aún no hay fotos. Sube fotos primero desde "Añadir fotos".' },

  // ── プロフィール ────────────────────────────────
  'profile.title': { ja: 'myPROFILE', es: 'myPROFILE' },
  'profile.saved': { ja: '保存しました。', es: 'Guardado.' },
  'profile.nameLabel': { ja: '名前', es: 'Nombre' },
  'profile.nameHint': { ja: '記事ページの「書き手」欄に表示される名前です。', es: 'Este nombre se mostrará como autor en la página del artículo.' },
  'profile.photoLabel': { ja: 'プロフィール写真', es: 'Foto de perfil' },
  'profile.locationLabel': { ja: '居住地（例：神奈川県藤沢市）', es: 'Ubicación (ej: Ciudad de México)' },
  'profile.birthdayLabel': { ja: '誕生日（西暦）', es: 'Fecha de nacimiento' },
  'profile.birthdayHint': { ja: '一度入れておけば、年齢は毎年自動で更新されます（書き換え不要）。誕生日そのものは公開されません。', es: 'Una vez ingresada, la edad se actualiza automáticamente cada año (no necesitas cambiarla). La fecha de nacimiento no se publica.' },
  'profile.instagram': { ja: 'Instagram', es: 'Instagram' },
  'profile.x': { ja: 'X（旧Twitter）', es: 'X (antes Twitter)' },
  'profile.youtube': { ja: 'YouTube', es: 'YouTube' },
  'profile.website': { ja: 'Webサイト', es: 'Sitio web' },
  'profile.contactAdmin': { ja: 'メールアドレス（ログインID）・パスワード・担当連載の変更は、管理者にご依頼ください。', es: 'Para cambiar correo electrónico (ID de inicio de sesión), contraseña o serie asignada, contacta al administrador.' },
  'profile.save': { ja: '保存する', es: 'Guardar' },
  'profile.saving': { ja: '保存中…', es: 'Guardando…' },
  'profile.languageLabel': { ja: '表示言語', es: 'Idioma' },

  // ── リッチエディタ ─────────────────────────────
  'editor.linkPrompt': { ja: 'リンク先のURLを入力してください（空欄にすると解除します）', es: 'Ingresa la URL del enlace (déjalo vacío para eliminarlo)' },
  'editor.bold': { ja: '太字', es: 'Negrita' },
  'editor.italic': { ja: '斜体', es: 'Cursiva' },
  'editor.heading': { ja: '見出し', es: 'Título' },
  'editor.bulletList': { ja: '箇条書き', es: 'Lista' },
  'editor.orderedList': { ja: '番号付き', es: 'Lista numerada' },
  'editor.blockquote': { ja: '引用', es: 'Cita' },
  'editor.link': { ja: 'リンク', es: 'Enlace' },
  'editor.imageFromDevice': { ja: '画像をデバイスから選ぶ', es: 'Elegir desde el dispositivo' },
  'editor.imageFromFolder': { ja: '画像フォルダから選ぶ', es: 'Desde la carpeta de imágenes' },
  'editor.imageUploading': { ja: 'アップロード中…', es: 'Subiendo…' },
  'editor.imageUploadFailed': { ja: 'アップロードに失敗しました。', es: 'Error al subir la imagen.' },
  'editor.imageHint': { ja: '写真は上のボタンから入れられます。パソコンでは本文へのドラッグ＆ドロップ・貼り付け（⌘/Ctrl+V）でもOKです。', es: 'Puedes añadir fotos con los botones de arriba. En la computadora también puedes arrastrarlas o pegarlas (⌘/Ctrl+V) en el contenido.' },

  // ── 共通 ────────────────────────────────────
  'common.error': { ja: 'エラーが発生しました。', es: 'Ocurrió un error.' },
} as const;

type TranslationKey = keyof typeof dict;

export function t(key: TranslationKey, locale: Locale): string {
  return dict[key]?.[locale] ?? dict[key]?.ja ?? key;
}

export function tReplace(key: TranslationKey, locale: Locale, replacements: Record<string, string>): string {
  let text = t(key, locale);
  for (const [placeholder, value] of Object.entries(replacements)) {
    text = text.replace(`{${placeholder}}`, value);
  }
  return text;
}
