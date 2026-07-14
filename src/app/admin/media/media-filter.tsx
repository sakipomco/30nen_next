'use client';

// 画像フォルダ画面用：年・月を選ぶとURL（?y=2025&m=07）を書き換えて一覧を絞り込む。
// URLに載せるのでページの再読み込み・共有でも同じ絞り込みが再現される。

import { useRouter } from 'next/navigation';
import { YearMonthSelects } from '@/components/admin/year-month-selects';
import type { YearMonths } from '@/lib/media';
import type { Locale } from '@/lib/i18n';

export function MediaFilter({
  yearMonths,
  year,
  month,
  locale,
}: {
  yearMonths: YearMonths[];
  year: string;
  month: string;
  locale: Locale;
}) {
  const router = useRouter();

  function apply(y: string, m: string) {
    const params = new URLSearchParams();
    if (y) params.set('y', y);
    if (y && m) params.set('m', m);
    // 絞り込みを変えたら1ページ目から（page パラメータは付けない）。
    const qs = params.toString();
    router.push(qs ? `/admin/media?${qs}` : '/admin/media');
  }

  return (
    <YearMonthSelects
      yearMonths={yearMonths}
      year={year}
      month={month}
      locale={locale}
      onChange={apply}
    />
  );
}
