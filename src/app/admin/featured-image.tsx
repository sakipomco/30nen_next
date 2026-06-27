'use client';

import { useRef, useState } from 'react';
import { uploadImage } from './upload-image';
import { ImagePickerModal } from '@/components/admin/image-picker-modal';
import { t, type Locale } from '@/lib/i18n';

type Props = {
  name: string;
  initialPath?: string | null;
  label?: string;
  locale?: Locale;
};

export function FeaturedImage({
  name,
  initialPath,
  label,
  locale = 'ja',
}: Props) {
  const displayLabel = label ?? t('image.featuredLabel', locale);
  const [path, setPath] = useState<string>(initialPath ?? '');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
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
      setError(err instanceof Error ? err.message : t('image.uploadFailed', locale));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 text-sm">
      {displayLabel}
      {path ? (
        <div className="flex flex-col gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={path}
            alt={t('image.previewAlt', locale)}
            className="max-h-48 w-fit rounded-md border border-zinc-200 object-contain"
          />
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => !uploading && fileInputRef.current?.click()}
              className="rounded-md border border-dashed border-zinc-400 px-4 py-2 text-sm text-zinc-600 transition-colors hover:bg-zinc-50"
            >
              {uploading ? t('image.uploading', locale) : t('image.fromDevice', locale)}
            </button>
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="rounded-md border border-dashed border-zinc-400 px-4 py-2 text-sm text-zinc-600 transition-colors hover:bg-zinc-50"
            >
              {t('image.fromFolder', locale)}
            </button>
            <button
              type="button"
              onClick={() => setPath('')}
              className="rounded-md px-3 py-1.5 text-red-600 transition-colors hover:bg-red-50"
            >
              {t('image.remove', locale)}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => !uploading && fileInputRef.current?.click()}
            className="rounded-md border border-dashed border-zinc-400 px-4 py-2 text-sm text-zinc-600 transition-colors hover:bg-zinc-50"
          >
            {uploading ? t('image.uploading', locale) : t('image.fromDevice', locale)}
          </button>
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="rounded-md border border-dashed border-zinc-400 px-4 py-2 text-sm text-zinc-600 transition-colors hover:bg-zinc-50"
          >
            {t('image.fromFolder', locale)}
          </button>
        </div>
      )}
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      <input type="hidden" name={name} value={path} />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />

      {pickerOpen && (
        <ImagePickerModal
          onSelect={(url) => setPath(url)}
          onClose={() => setPickerOpen(false)}
          locale={locale}
        />
      )}
    </div>
  );
}
