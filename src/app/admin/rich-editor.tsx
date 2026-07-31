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

function setYoutube(editor: Editor, locale: Locale) {
  const input = window.prompt(t('editor.youtubePrompt', locale), 'https://');
  if (input === null) return;
  const url = input.trim();
  if (url === '') return;
  // URLがYouTubeとして読み取れない場合、setYoutubeVideo は false を返す
  const ok = editor.chain().focus().setYoutubeVideo({ src: url }).run();
  if (!ok) window.alert(t('editor.youtubeInvalid', locale));
}

function setSpotify(editor: Editor, locale: Locale) {
  const input = window.prompt(t('editor.spotifyPrompt', locale), 'https://');
  if (input === null) return;
  const url = input.trim();
  if (url === '') return;
  // URLがSpotifyとして読み取れない場合、setSpotify は false を返す
  const ok = editor.chain().focus().setSpotify({ src: url }).run();
  if (!ok) window.alert(t('editor.spotifyInvalid', locale));
}

function setLink(editor: Editor, locale: Locale) {
  const prev = editor.getAttributes('link').href as string | undefined;
  const input = window.prompt(
    t('editor.linkPrompt', locale),
    prev ?? 'https://',
  );
  if (input === null) return;
  const url = input.trim();

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
    ],
    content: initialHTML ?? '',
    immediatelyRender: false,
    onUpdate: ({ editor }) => setHtml(editor.getHTML()),
    editorProps: {
      attributes: {
        class:
          'tiptap-editor min-h-64 rounded-md border border-zinc-300 px-3 py-2 text-base leading-7 outline-none focus:border-zinc-500',
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
