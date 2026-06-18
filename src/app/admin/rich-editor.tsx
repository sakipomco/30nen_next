'use client';
// 本文用のリッチエディタ（TipTap）。Googleドキュメントのような書き心地で文章を書ける。
// 中身はHTMLとして取り出し、見えない入力欄（hidden input）に入れてフォーム送信に乗せる。
// ※ App Router では最初の描画がサーバー側でも行われるため、immediatelyRender:false で
//    「画面に出てから編集機能を組み立てる」ようにする（ズレ＝hydrationエラー防止）。
//
// 画像の入れ方は3通り（どれも同じアップロードの仕組みを通る）：
//   ① ツールバーの「画像」ボタンで選ぶ
//   ② 写真ファイルを本文にドラッグ＆ドロップする
//   ③ コピーした写真を本文に貼り付ける（⌘/Ctrl+V）

import { useRef, useState } from 'react';
import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import type { EditorView } from '@tiptap/pm/view';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { uploadImage } from './upload-image';

type Props = {
  name: string; // フォーム送信時の項目名（例: "content"）
  initialHTML?: string; // 編集時の初期本文（HTML）
};

// DataTransfer（ドラッグやコピペで運ばれてくる中身）から画像ファイルだけ取り出す。
function getImageFiles(dt: DataTransfer | null): File[] {
  if (!dt) return [];
  return Array.from(dt.files).filter((f) => f.type.startsWith('image/'));
}

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

  // ドラッグ＆ドロップ／貼り付け用：写真をアップロードして指定位置（なければ今のカーソル）に挿入する。
  // ※ editor ではなく view（ProseMirror）を直接使うので、useEditor の設定内からでも安全に呼べる。
  //   function 宣言は巻き上げ（hoist）されるため、下の useEditor から参照してOK。
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
      setError(err instanceof Error ? err.message : 'アップロードに失敗しました。');
    } finally {
      setUploading(false);
    }
  }

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
      // 写真ファイルを本文にドラッグ＆ドロップしたとき。
      handleDrop(view, event) {
        const dragEvent = event as DragEvent;
        const files = getImageFiles(dragEvent.dataTransfer);
        if (files.length === 0) return false; // 画像でなければ通常動作にまかせる
        event.preventDefault();
        // 落とした位置に挿入（取れなければ末尾＝今のカーソル）。
        const dropped = view.posAtCoords({ left: dragEvent.clientX, top: dragEvent.clientY });
        for (const file of files) void uploadIntoView(view, file, dropped?.pos);
        return true;
      },
      // コピーした写真を本文に貼り付け（⌘/Ctrl+V）したとき。
      handlePaste(view, event) {
        const files = getImageFiles((event as ClipboardEvent).clipboardData);
        if (files.length === 0) return false; // 画像でなければ通常の貼り付け（文字など）にまかせる
        event.preventDefault();
        for (const file of files) void uploadIntoView(view, file);
        return true;
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
      {/* 操作のヒント（写真の入れ方は3通り）。 */}
      <p className="mt-1 text-xs text-zinc-500">
        写真は「画像」ボタンのほか、本文へ<strong>ドラッグ＆ドロップ</strong>・
        <strong>貼り付け（⌘/Ctrl+V）</strong>でも入れられます。
      </p>
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
