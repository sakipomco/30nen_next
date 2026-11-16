'use client';

import { useEffect, useRef, useState } from 'react';
import { uploadImage } from '@/app/admin/upload-image';
import { t, tReplace, type Locale } from '@/lib/i18n';

// 画像フォルダの「写真を追加」。ボタンで選ぶほか、
// 画面のどこにでも写真をドラッグ＆ドロップして追加できる。
export function UploadButton({ locale = 'ja' }: { locale?: Locale }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<
    | { status: 'idle' }
    | { status: 'uploading'; done: number; total: number }
    | { status: 'error'; message: string }
  >({ status: 'idle' });
  // ファイルを画面の上に持ってきている最中か（ドロップ先の案内を出す）。
  const [dragging, setDragging] = useState(false);

  const uploading = state.status === 'uploading';

  async function uploadFiles(files: File[]) {
    if (files.length === 0) return;

    setState({ status: 'uploading', done: 0, total: files.length });

    const errors: string[] = [];
    for (let i = 0; i < files.length; i++) {
      try {
        await uploadImage(files[i]);
      } catch (err) {
        errors.push(files[i].name + ': ' + (err instanceof Error ? err.message : t('common.error', locale)));
      }
      setState({ status: 'uploading', done: i + 1, total: files.length });
    }

    if (inputRef.current) inputRef.current.value = '';

    if (errors.length > 0) {
      setState({ status: 'error', message: errors.join('\n') });
    } else {
      window.location.reload();
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    uploadFiles(Array.from(e.target.files ?? []));
  }

  // 最新の uploadFiles / uploading をイベント処理から参照するための入れ物。
  const uploadRef = useRef(uploadFiles);
  const uploadingRef = useRef(uploading);
  useEffect(() => {
    uploadRef.current = uploadFiles;
    uploadingRef.current = uploading;
  });

  // 画面全体でドラッグ＆ドロップを受け付ける。
  useEffect(() => {
    // 子要素の出入りでも dragenter/dragleave が飛ぶので、回数を数えて判定する。
    let depth = 0;
    const hasFiles = (e: DragEvent) =>
      Array.from(e.dataTransfer?.types ?? []).includes('Files');

    function onEnter(e: DragEvent) {
      if (!hasFiles(e)) return;
      e.preventDefault();
      depth++;
      if (!uploadingRef.current) setDragging(true);
    }
    function onOver(e: DragEvent) {
      if (!hasFiles(e)) return;
      // これがないとブラウザが画像を別タブで開いてしまう。
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = uploadingRef.current ? 'none' : 'copy';
    }
    function onLeave(e: DragEvent) {
      if (!hasFiles(e)) return;
      depth = Math.max(0, depth - 1);
      if (depth === 0) setDragging(false);
    }
    function onDrop(e: DragEvent) {
      if (!hasFiles(e)) return;
      e.preventDefault();
      depth = 0;
      setDragging(false);
      if (uploadingRef.current) return;
      // 画像以外（PDFなど）は無視する。
      const files = Array.from(e.dataTransfer?.files ?? []).filter(
        (f) => f.type === '' || f.type.startsWith('image/'),
      );
      uploadRef.current(files);
    }

    window.addEventListener('dragenter', onEnter);
    window.addEventListener('dragover', onOver);
    window.addEventListener('dragleave', onLeave);
    window.addEventListener('drop', onDrop);
    return () => {
      window.removeEventListener('dragenter', onEnter);
      window.removeEventListener('dragover', onOver);
      window.removeEventListener('dragleave', onLeave);
      window.removeEventListener('drop', onDrop);
    };
  }, []);

  return (
    <div className="flex items-center gap-3">
      {dragging && (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 p-6">
          <div className="rounded-xl border-4 border-dashed border-white px-10 py-12 text-center text-lg font-semibold text-white">
            {t('media.dropHere', locale)}
          </div>
        </div>
      )}

      {state.status === 'error' && (
        <p className="whitespace-pre-line text-sm text-red-600">
          {state.message}
          <button
            type="button"
            onClick={() => setState({ status: 'idle' })}
            className="ml-2 underline"
          >
            {t('media.close', locale)}
          </button>
        </p>
      )}

      {uploading && (
        <span className="text-sm text-zinc-500">
          {tReplace('media.uploadingProgress', locale, {
            done: String(state.done),
            total: String(state.total),
          })}
        </span>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleChange}
        disabled={uploading}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        title={t('media.dropHint', locale)}
        className="rounded-md bg-zinc-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {t('media.addPhoto', locale)}
      </button>
    </div>
  );
}
