import Link from 'next/link';
import { requireUser } from '@/auth/session';
import {
  listUploadedImageFiles,
  collectYearMonths,
  filterByYearMonth,
} from '@/lib/media';
import { getUploadOwners } from '@/db/uploads';
import { MediaGrid } from './media-grid';
import { MediaFilter } from './media-filter';
import { UploadButton } from './upload-button';
import { t, tReplace, type Locale } from '@/lib/i18n';

export const metadata = {
  title: '画像フォルダ｜30nen',
};

export const dynamic = 'force-dynamic';

const PER_PAGE = 48;

export default async function MediaPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; y?: string; m?: string }>;
}) {
  const me = await requireUser();
  const locale = (me.locale ?? 'ja') as Locale;
  const { page: pageParam, y, m } = await searchParams;

  const allFiles = await listUploadedImageFiles();
  const owners = await getUploadOwners();

  // 年・月の絞り込み（選択肢は写真が実際にある年月だけ）。
  const yearMonths = collectYearMonths(allFiles);
  const year = y && /^\d{4}$/.test(y) ? y : '';
  const month = year && m && /^\d{2}$/.test(m) ? m : '';
  const files = filterByYearMonth(allFiles, year, month);

  const total = files.length;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const page = Math.min(Math.max(1, Number(pageParam) || 1), totalPages);
  const start = (page - 1) * PER_PAGE;
  const pageFiles = files.slice(start, start + PER_PAGE);

  // ページ送りリンクに絞り込みを引き継ぐためのクエリ文字列。
  const filterQs = (year ? `&y=${year}` : '') + (month ? `&m=${month}` : '');

  const isAdmin = me.role === 'admin';
  const items = pageFiles.map((f) => {
    const owner = owners.get(f.url);
    const isOwner = owner != null && owner === me.id;
    return { url: f.url, canDelete: isAdmin || isOwner };
  });

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 px-4 py-12">
      <div className="w-full max-w-5xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-zinc-900">{t('media.title', locale)}</h1>
          <div className="flex items-center gap-4">
            <UploadButton locale={locale} />
            <Link href="/admin" className="text-sm text-zinc-500 hover:underline">
              {t('admin.backToAdmin', locale)}
            </Link>
          </div>
        </div>

        <p className="mb-4 text-sm text-zinc-500">
          {tReplace('media.description', locale, { count: String(total) })}
          {isAdmin && t('media.adminNote', locale)}
          {'。'}
        </p>

        {/* 年・月で絞り込み（写真がある年月だけが選択肢に出る） */}
        <div className="mb-4">
          <MediaFilter
            yearMonths={yearMonths}
            year={year}
            month={month}
            locale={locale}
          />
        </div>

        <MediaGrid items={items} locale={locale} />

        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-4 text-sm">
            {page > 1 ? (
              <Link
                href={`/admin/media?page=${page - 1}${filterQs}`}
                className="rounded-md border border-zinc-300 px-3 py-1.5 text-zinc-700 transition-colors hover:bg-zinc-100"
              >
                {t('media.prev', locale)}
              </Link>
            ) : (
              <span className="rounded-md border border-zinc-200 px-3 py-1.5 text-zinc-300">
                {t('media.prev', locale)}
              </span>
            )}
            <span className="text-zinc-500">
              {page} / {totalPages}
            </span>
            {page < totalPages ? (
              <Link
                href={`/admin/media?page=${page + 1}${filterQs}`}
                className="rounded-md border border-zinc-300 px-3 py-1.5 text-zinc-700 transition-colors hover:bg-zinc-100"
              >
                {t('media.next', locale)}
              </Link>
            ) : (
              <span className="rounded-md border border-zinc-200 px-3 py-1.5 text-zinc-300">
                {t('media.next', locale)}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
