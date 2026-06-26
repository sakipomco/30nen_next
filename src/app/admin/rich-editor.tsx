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
import { ImagePickerModal } from '@/components/admin/image-picker-modal';

type Props = {
  name: string; // フォーム送信時の項目名（例: "content"）
  initialHTML?: string; // 編集時の初期本文（HTML）
};

// DataTransfer（ドラッグやコピペで運ばれてくる中身）から画像ファイルだけ取り出す。
function getImageFiles(dt: DataTransfer | null): File[] {
  if (!dt) return [];
  return Array.from(dt.files).filter((f) => f.type.startsWith('image/'));
}

// 選んだ文字にリンクを貼る／貼り直す／外す。
//  ・文字を選んでから押す → その文字がリンクになる
//  ・文字を選ばずに押す → 入力したURLがそのまま文字＋リンクとして入る
//  ・URLを空欄にして押す → リンクを解除する
function setLink(editor: Editor) {
  const prev = editor.getAttributes('link').href as string | undefined;
  const input = window.prompt(
    'リンク先のURLを入力してください（空欄にすると解除します）',
    prev ?? 'https://',
  );
  if (input === null) return; // キャンセル
  const url = input.trim();

  if (url === '') {
    editor.chain().focus().extendMarkRange('link').unsetLink().run();
    return;
  }
  // 文字を選んでいない＆今リンク上でもない → URLそのものを文字として入れてリンク化。
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
  // 選択範囲（または今のリンク全体）にリンクを設定。
  editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
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

function Toolbar({ editor }: { editor: Editor }) {
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
      {/* リンク：文字を選んでから押すと、その文字にリンクを貼れる。 */}
      <ToolbarButton
        label="リンク"
        active={editor.isActive('link')}
        onClick={() => setLink(editor)}
      />
    </div>
  );
}

export function RichEditor({ name, initialHTML }: Props) {
  const [html, setHtml] = useState(initialHTML ?? '');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
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
    extensions: [
      // StarterKit v3 はリンク機能を内蔵。編集中はクリックで飛ばない（openOnClick:false）、
      // URLは既定で https、外部リンクは新しいタブ＋安全属性で開く設定にする。
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
      {editor && <Toolbar editor={editor} />}
      <EditorContent editor={editor} />
      {/* 画像挿入ボタン（エディタの直下）。 */}
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => { if (!uploading) fileInputRef.current?.click(); }}
          disabled={uploading}
          className="rounded-md border border-zinc-400 bg-white px-4 py-1.5 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-100 disabled:opacity-50"
        >
          {uploading ? 'アップロード中…' : '画像をデバイスから選ぶ'}
        </button>
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="rounded-md border border-zinc-400 bg-white px-4 py-1.5 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-100"
        >
          画像フォルダから選ぶ
        </button>
      </div>
      {/* 操作のヒント。 */}
      <p className="mt-3 text-xs text-zinc-500">
        写真は本文へ<strong>ドラッグ＆ドロップ</strong>・
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

      {/* 画像フォルダピッカー：選ぶとカーソル位置に画像を挿入 */}
      {pickerOpen && editor && (
        <ImagePickerModal
          onSelect={(url) => {
            editor.chain().focus().setImage({ src: url }).run();
          }}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  );
}
