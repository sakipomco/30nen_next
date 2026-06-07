'use client';
// アイキャッチ画像（記事の代表画像）の設定欄。
// 画像を選ぶ → アップロード → プレビュー表示。選んだ画像のパスは見えない入力欄(hidden input)に入れ、
// 既存の他の項目と一緒にフォーム送信する（項目名は "featuredImage"）。

import { useRef, useState } from 'react';
import { uploadImage } from './upload-image';

type Props = {
  name: string; // フォーム送信時の項目名（例: "featuredImage"）
  initialPath?: string | null; // 編集時の初期値（保存済みのパス）
  label?: string; // 見出し（既定はアイキャッチ用。顔写真などに流用するとき指定）
};

export function FeaturedImage({
  name,
  initialPath,
  label = 'アイキャッチ画像（記事の代表画像・任意）',
}: Props) {
  const [path, setPath] = useState<string>(initialPath ?? '');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setError(null);
    setUploading(true);
    try {
      setPath(await uploadImage(file));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'アップロードに失敗しました。');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 text-sm">
      {label}
      {path ? (
        // 設定済み：プレビューと「変更」「削除」
        <div className="flex flex-col gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={path}
            alt="アイキャッチのプレビュー"
            className="max-h-48 w-fit rounded-md border border-zinc-200 object-contain"
          />
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => !uploading && fileInputRef.current?.click()}
              className="rounded-md border border-zinc-300 px-3 py-1.5 text-zinc-700 transition-colors hover:bg-zinc-100"
            >
              {uploading ? 'アップロード中…' : '画像を変更'}
            </button>
            <button
              type="button"
              onClick={() => setPath('')}
              className="rounded-md px-3 py-1.5 text-red-600 transition-colors hover:bg-red-50"
            >
              削除
            </button>
          </div>
        </div>
      ) : (
        // 未設定：「画像を選ぶ」ボタン
        <button
          type="button"
          onClick={() => !uploading && fileInputRef.current?.click()}
          className="w-fit rounded-md border border-dashed border-zinc-400 px-4 py-3 text-zinc-600 transition-colors hover:bg-zinc-50"
        >
          {uploading ? 'アップロード中…' : '＋ 画像を選ぶ'}
        </button>
      )}
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      {/* 選んだ画像のパスをフォーム送信に乗せる見えない欄（未設定なら空文字） */}
      <input type="hidden" name={name} value={path} />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
