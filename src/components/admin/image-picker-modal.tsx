'use client';

import { useEffect, useState, useCallback } from 'react';
import { t, type Locale } from '@/lib/i18n';

type Props = {
  onSelect: (url: string) => void;
  onClose: () => void;
  locale?: Locale;
};

type MediaResponse = {
  urls: string[];
  totalPages: number;
  page: number;
};

export function ImagePickerModal({ onSelect, onClose, locale = 'ja' }: Props) {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<MediaResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/media?page=${p}`);
      if (!res.ok) throw new Error(t('picker.loadFailed', locale));
      setData((await res.json()) as MediaResponse);
      setPage(p);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('picker.loadFailed', locale));
    } finally {
      setLoading(false);
    }
  }, [locale]);

  useEffect(() => {
    void load(1);
  }, [load]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('picker.title', locale)}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex h-[80vh] w-full max-w-3xl flex-col rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
          <h2 className="text-base font-semibold text-zinc-900">{t('picker.title', locale)}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-zinc-500 hover:bg-zinc-100"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading && (
            <p className="mt-8 text-center text-sm text-zinc-500">{t('picker.loading', locale)}</p>
          )}
          {error && (
            <p className="mt-8 text-center text-sm text-red-600">{error}</p>
          )}
          {!loading && !error && data && data.urls.length === 0 && (
            <p className="mt-8 text-center text-sm text-zinc-500">
              {t('picker.empty', locale)}
            </p>
          )}
          {!loading && !error && data && data.urls.length > 0 && (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
              {data.urls.map((url) => (
                <button
                  key={url}
                  type="button"
                  onClick={() => {
                    onSelect(url);
                    onClose();
                  }}
                  className="group relative aspect-square overflow-hidden rounded-md border border-zinc-200 bg-zinc-100 transition hover:border-zinc-500 hover:shadow"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt=""
                    className="h-full w-full object-cover transition group-hover:opacity-90"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 border-t border-zinc-200 py-3 text-sm">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => void load(page - 1)}
              className="rounded-md border border-zinc-300 px-3 py-1 text-zinc-700 disabled:cursor-not-allowed disabled:opacity-40 hover:bg-zinc-100"
            >
              {t('media.prev', locale)}
            </button>
            <span className="text-zinc-500">
              {page} / {data.totalPages}
            </span>
            <button
              type="button"
              disabled={page >= data.totalPages}
              onClick={() => void load(page + 1)}
              className="rounded-md border border-zinc-300 px-3 py-1 text-zinc-700 disabled:cursor-not-allowed disabled:opacity-40 hover:bg-zinc-100"
            >
              {t('media.next', locale)}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
