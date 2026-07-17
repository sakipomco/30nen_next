'use client';

// 投稿一覧用：年・月（＋管理者は投稿者も）を選ぶとURL（?y=2025&m=07&author=3）を
// 書き換えて一覧を絞り込む。画像フォルダの MediaFilter と同じ作り。
// URLに載せるのでページの再読み込み・共有でも同じ絞り込みが再現される。

import { useRouter } from 'next/navigation';
import { YearMonthSelects } from '@/components/admin/year-month-selects';
import type { YearMonths } from '@/lib/media';
import { t, type Locale } from '@/lib/i18n';

const selectClass =
  'rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-700';

export function ArticleFilter({
  yearMonths,
  year,
  month,
  authors,
  authorId,
  locale,
}: {
  yearMonths: YearMonths[];
  year: string;
  month: string;
  authors: { id: number; name: string }[] | null; // 管理者だけ渡す（投稿者には出さない）
  authorId: string; // 未選択は ''
  locale: Locale;
}) {
  const router = useRouter();

  function apply(y: string, m: string, author: string) {
    const params = new URLSearchParams();
    if (author) params.set('author', author);
    if (y) params.set('y', y);
    if (y && m) params.set('m', m);
    // 絞り込みを変えたら1ページ目から（page パラメータは付けない）。
    const qs = params.toString();
    router.push(qs ? `/admin?${qs}` : '/admin');
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {authors && (
        <select
          aria-label={t('admin.filterAuthor', locale)}
          className={selectClass}
          value={authorId}
          // 投稿者を変えたら年月はリセット（年月の選択肢がその人の記事に合わせて変わるため）。
          onChange={(e) => apply('', '', e.target.value)}
        >
          <option value="">{t('admin.allAuthors', locale)}</option>
          {authors.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      )}
      <YearMonthSelects
        yearMonths={yearMonths}
        year={year}
        month={month}
        locale={locale}
        onChange={(y, m) => apply(y, m, authorId)}
      />
    </div>
  );
}
