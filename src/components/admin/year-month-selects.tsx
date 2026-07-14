'use client';

// 画像フォルダの「年・月で絞り込み」プルダウン2つ。
// 選択肢は「写真が実際にある年月」だけを出す（空の月を選べないように）。
// 月のプルダウンは年を選んだときだけ有効（「全ての年の7月」は出せない仕様）。

import type { YearMonths } from '@/lib/media';
import { t, type Locale } from '@/lib/i18n';

const selectClass =
  'rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-700';

export function YearMonthSelects({
  yearMonths,
  year,
  month,
  locale = 'ja',
  onChange,
}: {
  yearMonths: YearMonths[];
  year: string; // 未選択は ''
  month: string; // 未選択は ''
  locale?: Locale;
  onChange: (year: string, month: string) => void;
}) {
  const months = yearMonths.find((ym) => ym.year === year)?.months ?? [];

  return (
    <div className="flex items-center gap-2">
      <select
        aria-label={t('media.filterYear', locale)}
        className={selectClass}
        value={year}
        onChange={(e) => onChange(e.target.value, '')} // 年を変えたら月はリセット
      >
        <option value="">{t('media.allYears', locale)}</option>
        {yearMonths.map((ym) => (
          <option key={ym.year} value={ym.year}>
            {locale === 'ja' ? `${ym.year}年` : ym.year}
          </option>
        ))}
      </select>
      <select
        aria-label={t('media.filterMonth', locale)}
        className={`${selectClass} disabled:cursor-not-allowed disabled:opacity-40`}
        value={month}
        disabled={!year}
        onChange={(e) => onChange(year, e.target.value)}
      >
        <option value="">{t('media.allMonths', locale)}</option>
        {months.map((m) => (
          <option key={m} value={m}>
            {locale === 'ja' ? `${Number(m)}月` : Number(m)}
          </option>
        ))}
      </select>
    </div>
  );
}
