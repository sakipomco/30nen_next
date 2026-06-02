'use client';
// 本文用のリッチエディタ（TipTap）。Googleドキュメントのような書き心地で文章を書ける。
// 中身はHTMLとして取り出し、見えない入力欄（hidden input）に入れてフォーム送信に乗せる。
// ※ App Router では最初の描画がサーバー側でも行われるため、immediatelyRender:false で
//    「画面に出てから編集機能を組み立てる」ようにする（ズレ＝hydrationエラー防止）。

import { useRef, useState } from 'react';
import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { uploadImage } from './upload-image';

type Props = {
  name: string; // フォーム送信時の項目名（例: "content"）
  initialHTML?: string; // 編集時の初期本文（HTML）
};

// ツールバーの1ボタン分。
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
      type="button" // フォーム送信ボタンと区別（押しても送信されないように）
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

function Toolbar({
  editor,
  onPickImage,
  uploading,
}: {
  editor: Editor;
  onPickImage: () => void;
  uploading: boolean;
}) {
  return (
    <div className="mb-2 flex flex-wrap gap-1">
      <ToolbarButton
        label="太字"
        active={editor.isActive('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()}
      />
      <ToolbarButton
        label="斜体"
        active={editor.isActive('italic')}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      />
      <ToolbarButton
        label="見出し"
        active={editor.isActive('heading', { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      />
      <ToolbarButton
        label="箇条書き"
        active={editor.isActive('bulletList')}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      />
      <ToolbarButton
        label="番号付き"
        active={editor.isActive('orderedList')}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      />
      <ToolbarButton
        label="引用"
        active={editor.isActive('blockquote')}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      />
      {/* 本文に画像を挿入。押すとファイル選択 → アップロード → カーソル位置に差し込む。 */}
      <ToolbarButton
        label={uploading ? 'アップロード中…' : '画像'}
        active={false}
        onClick={onPickImage}
      />
    </div>
  );
}

export function RichEditor({ name, initialHTML }: Props) {
  const [html, setHtml] = useState(initialHTML ?? '');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // 画像挿入用の隠しファイル選択欄。ボタンを押すとこれをクリックさせる。
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [StarterKit, Image],
    content: initialHTML ?? '',
    immediatelyRender: false,
    onUpdate: ({ editor }) => setHtml(editor.getHTML()),
    editorProps: {
      attributes: {
        // 編集エリアの見た目。globals.css の .tiptap-editor で中身（見出し・箇条書き）を整える。
        class:
          'tiptap-editor min-h-64 rounded-md border border-zinc-300 px-3 py-2 text-base leading-7 outline-none focus:border-zinc-500',
      },
    },
  });

  // ファイルが選ばれたら：アップロード → 返ってきたURLをカーソル位置に画像として差し込む。
  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // 同じ画像を続けて選べるようにリセット
    if (!file || !editor) return;

    setError(null);
    setUploading(true);
    try {
      const url = await uploadImage(file);
      editor.chain().focus().setImage({ src: url }).run();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'アップロードに失敗しました。');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      {editor && (
        <Toolbar
          editor={editor}
          uploading={uploading}
          onPickImage={() => {
            if (!uploading) fileInputRef.current?.click();
          }}
        />
      )}
      <EditorContent editor={editor} />
      {error && (
        <p className="mt-1 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      {/* 画像選択用の隠し入力（ボタンから間接的にクリックさせる） */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />
      {/* 本文HTMLをフォーム送信に乗せる見えない欄 */}
      <input type="hidden" name={name} value={html} />
    </div>
  );
}
