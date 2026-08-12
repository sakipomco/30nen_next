'use client';

import { useRef, useState } from 'react';
import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import type { EditorView } from '@tiptap/pm/view';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Youtube from '@tiptap/extension-youtube';
import { Video } from './video-node';

// YouTube拡張は標準では「エディタ自身が作った形（div[data-youtube-video]で包まれたiframe）」
// しか読み取れない。旧サイトから移行した記事は iframe が素のまま入っているため、
// そのままだと編集画面を開いて保存しただけで埋め込みが消えてしまう。
// → 素の YouTube iframe も読み取れるように解析ルールを広げる。
const YoutubeWithPlainIframe = Youtube.extend({
  parseHTML() {
    return [
      { tag: 'div[data-youtube-video] iframe' },
      { tag: 'iframe[src*="youtube.com/embed/"]' },
      { tag: 'iframe[src*="youtube-nocookie.com/embed/"]' },
    ];
  },
});
import { Spotify } from './spotify-node';
import { Gray } from './gray-mark';
import { uploadImage } from './upload-image';
import { ImagePickerModal } from '@/components/admin/image-picker-modal';
import { t, type Locale } from '@/lib/i18n';

type Props = {
  name: string;
  initialHTML?: string;
  locale?: Locale;
};

// 本文に入れられるファイル＝画像すべて＋動画はMP4のみ（/api/upload の許可リストと対応）
function isInsertableMedia(f: File): boolean {
  return f.type.startsWith('image/') || f.type === 'video/mp4';
}

function getMediaFiles(dt: DataTransfer | null): File[] {
  if (!dt) return [];
  return Array.from(dt.files).filter(isInsertableMedia);
}

// よそからコピーした文字を貼り付けたときに、太字・斜体の「飾り」を落とす。
// （SAKIさん指定 2026-08-11）
// Instagram・Google検索結果・note・メモアプリなどからコピーすると、見た目の飾りごと
// 貼り付けられ、さらにその直後に打った文字まで太字を引き継いでしまう。書き手は太字ボタンを
// 押していないのに本文が太くなる、という不具合の原因はこれ。
// 貼り付けの瞬間に <b>/<strong>/<i>/<em> と style の font-weight/font-style を取り除く。
// 中の文字・改行・リンクはそのまま残るので、文章が消えることはない。
// 自分で太字にしたいときは、貼り付けたあとに「太字」ボタンを押せばよい。
function stripBoldFromPastedHtml(html: string): string {
  // 貼り付けはブラウザの中だけで起きるが、念のためサーバー側では何もしない
  if (typeof window === 'undefined') return html;
  const doc = new DOMParser().parseFromString(html, 'text/html');
  // タグだけほどいて中身（文字）は残す
  for (const el of Array.from(doc.body.querySelectorAll('b, strong, i, em'))) {
    el.replaceWith(...Array.from(el.childNodes));
  }
  // style="font-weight:700" のような書き方（Googleドキュメント等）も消す
  for (const el of Array.from(doc.body.querySelectorAll<HTMLElement>('[style]'))) {
    el.style.removeProperty('font-weight');
    el.style.removeProperty('font-style');
    if (el.getAttribute('style')?.trim() === '') el.removeAttribute('style');
  }
  return doc.body.innerHTML;
}

// 入力箱に貼られたURLの「https:// の二重付き」を直す。
//  例: "https://https://30nen.com/posts/2783" → "https://30nen.com/posts/2783"
//  もとの原因は、入力箱にあらかじめ "https://" を入れていたこと。パソコンなら開いた瞬間に
//  文字が選択されるので上書きされるが、**スマホ・タブレットではタップした位置にカーソルが
//  立つだけ**なので、そこへURLを貼ると先入れの "https://" とつながってしまう。
//  書き手の多くがスマホ・タブレットで書いているため、この壊れリンクが繰り返し生まれていた
//  （2026-08-13 SAKIさん報告：かきぬまさんの8785から2783・7886へ飛べない）。
//  先入れはやめたうえで、念のためここでも直す。
function normalizeUrl(input: string): string {
  let url = input.trim();
  if (url === '') return '';
  // 先頭に重なった "https://" を取り除く。ブラウザのアドレス欄から写すとコロンが落ちて
  // "https://https//30nen.com/..." の形になるので、それも拾う。
  let before = '';
  while (before !== url) {
    before = url;
    url = url.replace(/^https?:\/\/(?=https?:?\/\/)/i, '');
  }
  // コロンが落ちた "https//30nen.com" を補う
  url = url.replace(/^(https?)\/\//i, '$1://');
  // サイト内リンク（/posts/123）・ページ内リンク・メール・電話はそのまま
  if (/^(\/|#|mailto:|tel:)/i.test(url)) return url;
  // http:// などの頭書きが無ければ https:// を補う
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(url)) url = `https://${url}`;
  return url;
}

function setYoutube(editor: Editor, locale: Locale) {
  const input = window.prompt(t('editor.youtubePrompt', locale), '');
  if (input === null) return;
  const url = normalizeUrl(input);
  if (url === '') return;
  // URLがYouTubeとして読み取れない場合、setYoutubeVideo は false を返す
  const ok = editor.chain().focus().setYoutubeVideo({ src: url }).run();
  if (!ok) window.alert(t('editor.youtubeInvalid', locale));
}

function setSpotify(editor: Editor, locale: Locale) {
  const input = window.prompt(t('editor.spotifyPrompt', locale), '');
  if (input === null) return;
  const url = normalizeUrl(input);
  if (url === '') return;
  // URLがSpotifyとして読み取れない場合、setSpotify は false を返す
  const ok = editor.chain().focus().setSpotify({ src: url }).run();
  if (!ok) window.alert(t('editor.spotifyInvalid', locale));
}

function setLink(editor: Editor, locale: Locale) {
  const prev = editor.getAttributes('link').href as string | undefined;
  const input = window.prompt(t('editor.linkPrompt', locale), prev ?? '');
  if (input === null) return;
  const url = normalizeUrl(input);

  if (url === '') {
    editor.chain().focus().extendMarkRange('link').unsetLink().run();
    return;
  }
  if (editor.state.selection.empty && !editor.isActive('link')) {
    editor
      .chain()
      .focus()
      .insertContent({
        type: 'text',
        text: url,
        marks: [{ type: 'link', attrs: { href: url } }],
      })
      .run();
    return;
  }
  editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
}

function ToolbarButton({
  onClick,
  active,
  label,
}: {
  onClick: () => void;
  active: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        'rounded px-2 py-1 text-sm transition-colors ' +
        (active
          ? 'bg-zinc-800 text-white'
          : 'border border-zinc-300 text-zinc-700 hover:bg-zinc-100')
      }
    >
      {label}
    </button>
  );
}

function Toolbar({ editor, locale }: { editor: Editor; locale: Locale }) {
  return (
    <div className="mb-2 flex flex-wrap gap-1">
      <ToolbarButton
        label={t('editor.bold', locale)}
        active={editor.isActive('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()}
      />
      <ToolbarButton
        label={t('editor.italic', locale)}
        active={editor.isActive('italic')}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      />
      <ToolbarButton
        label={t('editor.heading', locale)}
        active={editor.isActive('heading', { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      />
      <ToolbarButton
        label={t('editor.bulletList', locale)}
        active={editor.isActive('bulletList')}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      />
      <ToolbarButton
        label={t('editor.orderedList', locale)}
        active={editor.isActive('orderedList')}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      />
      <ToolbarButton
        label={t('editor.blockquote', locale)}
        active={editor.isActive('blockquote')}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      />
      <ToolbarButton
        label={t('editor.link', locale)}
        active={editor.isActive('link')}
        onClick={() => setLink(editor, locale)}
      />
      <ToolbarButton
        label={t('editor.youtube', locale)}
        active={editor.isActive('youtube')}
        onClick={() => setYoutube(editor, locale)}
      />
      <ToolbarButton
        label={t('editor.spotify', locale)}
        active={editor.isActive('spotify')}
        onClick={() => setSpotify(editor, locale)}
      />
      <ToolbarButton
        label={t('editor.gray', locale)}
        active={editor.isActive('gray')}
        onClick={() => editor.chain().focus().toggleGray().run()}
      />
      <ToolbarButton
        label={t('editor.horizontalRule', locale)}
        active={false}
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
      />
    </div>
  );
}

export function RichEditor({ name, initialHTML, locale = 'ja' }: Props) {
  const [html, setHtml] = useState(initialHTML ?? '');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  async function uploadIntoView(view: EditorView, file: File, pos?: number) {
    const isVideo = file.type.startsWith('video/');
    setError(null);
    setUploading(true);
    try {
      const url = await uploadImage(file);
      // 画像は image ノード、動画(MP4)は video ノードとして本文に挿入する
      const nodeType = view.state.schema.nodes[isVideo ? 'video' : 'image'];
      if (!nodeType) return;
      const node = nodeType.create({ src: url });
      const at = Math.min(pos ?? view.state.selection.from, view.state.doc.content.size);
      view.dispatch(view.state.tr.insert(at, node));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t(isVideo ? 'editor.videoUploadFailed' : 'editor.imageUploadFailed', locale),
      );
    } finally {
      setUploading(false);
    }
  }

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: {
          openOnClick: false,
          defaultProtocol: 'https',
          HTMLAttributes: { target: '_blank', rel: 'noopener noreferrer nofollow' },
        },
      }),
      Image,
      Video,
      // YouTube埋め込み。nocookie＝再生するまでCookieを置かないYouTube公式ドメインを使う。
      // ツールバーの「YouTube」ボタンのほか、本文へのURL貼り付けでも自動で埋め込みになる。
      YoutubeWithPlainIframe.configure({ nocookie: true }),
      // Spotify埋め込み。ツールバーの「Spotify」ボタンのほか、
      // 本文へのURL貼り付けでも自動でプレイヤーになる（書き手の要望 2026-07-31）。
      Spotify,
      // グレー文字（エフェメラの定型で使う。旧WPの色指定の代わり）。
      Gray,
    ],
    content: initialHTML ?? '',
    immediatelyRender: false,
    onUpdate: ({ editor }) => setHtml(editor.getHTML()),
    editorProps: {
      attributes: {
        // 文字の大きさ・行間はここでは指定しない（text-base / leading-7 は外した）。
        // 公開ページと同じ値を globals.css の .tiptap-editor でまとめて当てている。
        class:
          'tiptap-editor min-h-64 rounded-md border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-500',
      },
      handleDrop(view, event) {
        const dragEvent = event as DragEvent;
        const files = getMediaFiles(dragEvent.dataTransfer);
        if (files.length === 0) return false;
        event.preventDefault();
        const dropped = view.posAtCoords({ left: dragEvent.clientX, top: dragEvent.clientY });
        for (const file of files) void uploadIntoView(view, file, dropped?.pos);
        return true;
      },
      // 貼り付けた文字から太字・斜体の飾りを落とす（上の stripBoldFromPastedHtml 参照）
      transformPastedHTML: stripBoldFromPastedHtml,
      handlePaste(view, event) {
        const files = getMediaFiles((event as ClipboardEvent).clipboardData);
        if (files.length === 0) return false;
        event.preventDefault();
        for (const file of files) void uploadIntoView(view, file);
        return true;
      },
    },
  });

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !editor) return;

    const isVideo = file.type.startsWith('video/');
    setError(null);
    setUploading(true);
    try {
      const url = await uploadImage(file);
      if (isVideo) editor.chain().focus().setVideo({ src: url }).run();
      else editor.chain().focus().setImage({ src: url }).run();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t(isVideo ? 'editor.videoUploadFailed' : 'editor.imageUploadFailed', locale),
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      {editor && <Toolbar editor={editor} locale={locale} />}
      <EditorContent editor={editor} />
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => { if (!uploading) fileInputRef.current?.click(); }}
          disabled={uploading}
          className="rounded-md border border-zinc-400 bg-white px-4 py-1.5 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-100 disabled:opacity-50"
        >
          {uploading ? t('editor.imageUploading', locale) : t('editor.imageFromDevice', locale)}
        </button>
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="rounded-md border border-zinc-400 bg-white px-4 py-1.5 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-100"
        >
          {t('editor.imageFromFolder', locale)}
        </button>
        <button
          type="button"
          onClick={() => { if (!uploading) videoInputRef.current?.click(); }}
          disabled={uploading}
          className="rounded-md border border-zinc-400 bg-white px-4 py-1.5 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-100 disabled:opacity-50"
        >
          {uploading ? t('editor.imageUploading', locale) : t('editor.videoFromDevice', locale)}
        </button>
      </div>
      <p className="mt-3 text-xs text-zinc-500">
        {t('editor.imageHint', locale)}
      </p>
      {error && (
        <p className="mt-1 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/mp4"
        className="hidden"
        onChange={handleFileChange}
      />
      <input type="hidden" name={name} value={html} />

      {pickerOpen && editor && (
        <ImagePickerModal
          onSelect={(url) => {
            editor.chain().focus().setImage({ src: url }).run();
          }}
          onClose={() => setPickerOpen(false)}
          locale={locale}
        />
      )}
    </div>
  );
}
