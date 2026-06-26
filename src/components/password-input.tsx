'use client';
// パスワード入力欄。「目」アイコンで表示/非表示を切り替えられる。
// SAKI要望②（2026-06-26）: スマホ入力でtypoに気付けるように。書き手のログインや
// 管理者のユーザー編集など、生パスワードを入力するすべての欄で使う。

import { useState } from 'react';

type Props = {
  name: string;
  required?: boolean;
  autoComplete?: string;
  defaultValue?: string;
  placeholder?: string;
  // 既存の同種input欄と揃えるための追加クラス（不要なら省略）。
  className?: string;
};

export function PasswordInput({
  name,
  required,
  autoComplete,
  defaultValue,
  placeholder,
  className = 'rounded-md border border-zinc-300 px-3 py-2 text-base outline-none focus:border-zinc-500',
}: Props) {
  const [shown, setShown] = useState(false);

  return (
    <div className="relative">
      <input
        type={shown ? 'text' : 'password'}
        name={name}
        required={required}
        autoComplete={autoComplete}
        defaultValue={defaultValue}
        placeholder={placeholder}
        // 「目」アイコンの場所を空ける（右側に少し余白）。
        className={`${className} w-full pr-10`}
      />
      <button
        type="button"
        onClick={() => setShown((v) => !v)}
        aria-label={shown ? 'パスワードを隠す' : 'パスワードを表示する'}
        aria-pressed={shown}
        className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-zinc-500 hover:text-zinc-900"
        // tabindex=-1: タブ移動でこのボタンに行かないようにする（パスワード欄→次の欄へ素直に流れるため）。
        tabIndex={-1}
      >
        {/* 目（表示中）／目に斜線（非表示中）。inlineのSVGなのでアイコンライブラリ不要。 */}
        {shown ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
            aria-hidden="true"
          >
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
            aria-hidden="true"
          >
            <path d="M2 12s3.5-7 10-7c2.2 0 4 .6 5.5 1.5" />
            <path d="M22 12s-3.5 7-10 7c-2.2 0-4-.6-5.5-1.5" />
            <path d="M9.5 9.5a3 3 0 0 0 4.2 4.2" />
            <line x1="3" y1="3" x2="21" y2="21" />
          </svg>
        )}
      </button>
    </div>
  );
}
