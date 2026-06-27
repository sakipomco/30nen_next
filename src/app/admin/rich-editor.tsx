'use client';

import { useRef, useState } from 'react';
import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import type { EditorView } from '@tiptap/pm/view';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { uploadImage } from './upload-image';
import { ImagePickerModal } from '@/components/admin/image-picker-modal';
import { t, type Locale } from '@/lib/i18n';

type Props = {
  name: string;
  initialHTML?: string;
  locale?: Locale;
};

function getImageFiles(dt: DataTransfer | null): File[] {
  if (!dt) return [];
  return Array.from(dt.files).filter((f) => f.type.startsWith('image/'));
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
    </div>
  );
}

export function RichEditor({ name, initialHTML, locale = 'ja' }: Props) {
  const [html, setHtml] = useState(initialHTML ?? '');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function uploadIntoView(view: EditorView, file: File, pos?: number) {
    setError(null);
    setUploading(true);
    try {
      const url = await uploadImage(file);
      const imageType = view.state.schema.nodes.image;
      if (!imageType) return;
      const node = imageType.create({ src: url });
      const at = Math.min(pos ?? view.state.selection.from, view.state.doc.content.size);
      view.dispatch(view.state.tr.insert(at, node));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('editor.imageUploadFailed', locale));
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
        const files = getImageFiles(dragEvent.dataTransfer);
        if (files.length === 0) return false;
        event.preventDefault();
        const dropped = view.posAtCoords({ left: dragEvent.clientX, top: dragEvent.clientY });
        for (const file of files) void uploadIntoView(view, file, dropped?.pos);
        return true;
      },
      handlePaste(view, event) {
        const files = getImageFiles((event as ClipboardEvent).clipboardData);
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

    setError(null);
    setUploading(true);
    try {
      const url = await uploadImage(file);
      editor.chain().focus().setImage({ src: url }).run();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('editor.imageUploadFailed', locale));
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
