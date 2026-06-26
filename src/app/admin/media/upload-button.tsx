'use client';
// 画像フォルダ画面の「写真を追加」ボタン。
// ファイルを選ぶ（複数可）→ /api/upload に順番に送る→ 終わったらページを再読み込みして一覧に反映。

import { useRef, useState } from 'react';
import { uploadImage } from '@/app/admin/upload-image';

export function UploadButton() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<
    | { status: 'idle' }
    | { status: 'uploading'; done: number; total: number }
    | { status: 'error'; message: string }
  >({ status: 'idle' });

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    setState({ status: 'uploading', done: 0, total: files.length });

    const errors: string[] = [];
    for (let i = 0; i < files.length; i++) {
      try {
        await uploadImage(files[i]);
      } catch (err) {
        errors.push(files[i].name + ': ' + (err instanceof Error ? err.message : '失敗'));
      }
      setState({ status: 'uploading', done: i + 1, total: files.length });
    }

    // input をリセット（同じファイルを再選択できるように）
    if (inputRef.current) inputRef.current.value = '';

    if (errors.length > 0) {
      setState({ status: 'error', message: errors.join('\n') });
    } else {
      // 成功したらページを再読み込みして一覧に反映
      window.location.reload();
    }
  }

  const uploading = state.status === 'uploading';

  return (
    <div className="flex items-center gap-3">
      {state.status === 'error' && (
        <p className="text-sm text-red-600">
          {state.message}
          <button
            type="button"
            onClick={() => setState({ status: 'idle' })}
            className="ml-2 underline"
          >
            閉じる
          </button>
        </p>
      )}

      {uploading && (
        <span className="text-sm text-zinc-500">
          アップロード中… {state.done} / {state.total}
        </span>
      )}

      {/* 隠しファイル入力（複数・画像のみ） */}
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
        className="rounded-md bg-zinc-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        写真を追加
      </button>
    </div>
  );
}
