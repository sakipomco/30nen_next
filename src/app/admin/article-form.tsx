'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import {
  type ArticleFormState,
  autosaveArticleAction,
} from '@/app/actions/articles';
import { RichEditor } from './rich-editor';
import { FeaturedImage } from './featured-image';
import { t, tReplace, type Locale } from '@/lib/i18n';

type ArticleAction = (
  prevState: ArticleFormState,
  formData: FormData,
) => Promise<ArticleFormState>;

type Props = {
  action: ArticleAction;
  categories: { id: number; name: string; depth: number }[];
  locale?: Locale;
  initial?: {
    id: number;
    title: string;
    content: string;
    status?: 'draft' | 'published';
    featuredImagePath?: string | null;
    categoryId?: number | null;
    publishedAtInput?: string;
  };
};

function nowHm(): string {
  return new Date().toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function ArticleForm({ action, categories, initial, locale = 'ja' }: Props) {
  const [state, formAction, pending] = useActionState<
    ArticleFormState,
    FormData
  >(action, undefined);

  const autosaveEnabled = !initial || initial.status !== 'published';

  const [autoSaveStatus, setAutoSaveStatus] = useState('');

  const [articleId, setArticleId] = useState(
    initial?.id ? String(initial.id) : '',
  );

  const formRef = useRef<HTMLFormElement>(null);
  const idRef = useRef(initial?.id ? String(initial.id) : '');
  const lastSavedRef = useRef<string | null>(null);
  const savingRef = useRef(false);
  const pendingRef = useRef(false);
  useEffect(() => {
    pendingRef.current = pending;
  }, [pending]);

  const defaultCategoryId =
    initial?.categoryId != null
      ? String(initial.categoryId)
      : categories.length === 1
        ? String(categories[0].id)
        : '';

  function readSnapshot() {
    const f = formRef.current;
    if (!f) return null;
    const val = (name: string) => {
      const el = f.elements.namedItem(name);
      return el instanceof HTMLInputElement || el instanceof HTMLSelectElement
        ? el.value
        : '';
    };
    return {
      title: val('title'),
      content: val('content'),
      categoryId: val('categoryId'),
      featuredImage: val('featuredImage'),
      publishedAt: val('publishedAt'),
    };
  }

  async function runAutosave() {
    if (!autosaveEnabled || savingRef.current || pendingRef.current) return;
    const snap = readSnapshot();
    if (!snap) return;

    const key = JSON.stringify(snap);
    if (key === lastSavedRef.current) return;

    const contentText = snap.content.replace(/<[^>]*>/g, '').trim();
    if (!idRef.current && snap.title.trim() === '' && contentText === '') return;

    savingRef.current = true;
    setAutoSaveStatus(t('article.autosaveSaving', locale));
    try {
      const res = await autosaveArticleAction({
        id: idRef.current ? Number(idRef.current) : null,
        title: snap.title,
        content: snap.content,
        categoryId: snap.categoryId ? Number(snap.categoryId) : null,
        featuredImage: snap.featuredImage || null,
        publishedAt: snap.publishedAt || null,
      });
      if (res.ok) {
        idRef.current = String(res.id);
        setArticleId(String(res.id));
        lastSavedRef.current = key;
        setAutoSaveStatus(tReplace('article.autosaveDone', locale, { time: nowHm() }));
      } else {
        setAutoSaveStatus(t('article.autosaveFailed', locale));
      }
    } catch {
      setAutoSaveStatus(t('article.autosaveFailed', locale));
    } finally {
      savingRef.current = false;
    }
  }

  useEffect(() => {
    if (!autosaveEnabled) return;
    lastSavedRef.current = JSON.stringify(readSnapshot());
    const timer = setInterval(runAutosave, 10000);
    const onHide = () => {
      if (document.visibilityState === 'hidden') void runAutosave();
    };
    document.addEventListener('visibilitychange', onHide);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onHide);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handlePublishClick(e: React.MouseEvent<HTMLButtonElement>) {
    const form = e.currentTarget.form;
    const featured = form?.elements.namedItem('featuredImage');
    const isSet =
      featured instanceof HTMLInputElement && featured.value.trim() !== '';
    if (!isSet) {
      const ok = window.confirm(t('article.confirmNoImage', locale));
      if (!ok) e.preventDefault();
    }
  }

  const [previewBusy, setPreviewBusy] = useState(false);

  async function handlePreviewClick() {
    if (previewBusy) return;
    setPreviewBusy(true);
    try {
      if (autosaveEnabled) {
        const snap = readSnapshot();
        const contentText = (snap?.content ?? '').replace(/<[^>]*>/g, '').trim();
        if (!idRef.current && (!snap || (snap.title.trim() === '' && contentText === ''))) {
          alert(t('article.previewEmpty', locale));
          return;
        }
        await runAutosave();
      }
      const id = idRef.current;
      if (!id) {
        alert(t('article.previewFailed', locale));
        return;
      }
      window.open(`/preview/${id}`, '_blank', 'noopener,noreferrer');
    } finally {
      setPreviewBusy(false);
    }
  }

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="id" value={articleId} readOnly />

      <label className="flex flex-col gap-1 text-sm">
        {t('article.titleLabel', locale)}
        <input
          type="text"
          name="title"
          required
          defaultValue={initial?.title ?? ''}
          className="rounded-md border border-zinc-300 px-3 py-2 text-base outline-none focus:border-zinc-500"
        />
      </label>

      <div className="flex flex-col gap-1 text-sm">
        {t('article.bodyLabel', locale)}
        <RichEditor name="content" initialHTML={initial?.content} locale={locale} />
      </div>

      <FeaturedImage name="featuredImage" initialPath={initial?.featuredImagePath} locale={locale} />

      <label className="flex flex-col gap-1 text-sm">
        {t('article.publishedAtLabel', locale)}
        <input
          type="datetime-local"
          name="publishedAt"
          defaultValue={initial?.publishedAtInput ?? ''}
          className="w-fit rounded-md border border-zinc-300 px-3 py-2 text-base outline-none focus:border-zinc-500"
        />
        <span className="text-xs text-zinc-500">
          {t('article.publishedAtHint', locale)}
        </span>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        {t('article.categoryLabel', locale)}
        {categories.length === 0 ? (
          <span className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-amber-700">
            {t('article.categoryEmpty', locale)}
          </span>
        ) : (
          <select
            name="categoryId"
            required
            defaultValue={defaultCategoryId}
            className="w-fit rounded-md border border-zinc-300 px-3 py-2 text-base outline-none focus:border-zinc-500"
          >
            {!defaultCategoryId && <option value="">{t('article.categoryPlaceholder', locale)}</option>}
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {'　'.repeat(c.depth) + c.name}
              </option>
            ))}
          </select>
        )}
      </label>

      {state?.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}

      <div className="mt-2 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          name="intent"
          value="draft"
          disabled={pending}
          className="rounded-md border border-zinc-300 px-4 py-2 text-base text-zinc-700 transition-colors hover:bg-zinc-100 disabled:opacity-60"
        >
          {pending ? t('article.saving', locale) : t('article.saveDraft', locale)}
        </button>
        <button
          type="submit"
          name="intent"
          value="publish"
          disabled={pending}
          onClick={handlePublishClick}
          className="rounded-md bg-zinc-900 px-4 py-2 text-base font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-60"
        >
          {pending ? t('article.submitting', locale) : initial?.status === 'published' ? t('article.update', locale) : t('article.publish', locale)}
        </button>
        <button
          type="button"
          onClick={handlePreviewClick}
          disabled={pending || previewBusy}
          className="rounded-md border border-zinc-300 px-4 py-2 text-base text-zinc-700 transition-colors hover:bg-zinc-100 disabled:opacity-60"
        >
          {previewBusy ? t('article.previewBusy', locale) : t('article.preview', locale)}
        </button>

        <span className="text-xs text-zinc-500">
          {autosaveEnabled
            ? autoSaveStatus
            : t('article.autosaveDisabled', locale)}
        </span>
      </div>
    </form>
  );
}
