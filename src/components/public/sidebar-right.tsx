// 右サイドバー（module03）の中身: 小商店（連載一覧）＋検索＋アーカイブ。
// 検索・アーカイブはこのフェーズでは枠だけ（機能は後回し）。仕様書 §14-J。
// 右コラム・ハンバーガーメニュー内の両方でこの中身を使う。

import { SectionHeading } from './section-heading';
import { SeriesList, type SeriesItem } from './series-list';
import { SearchForm } from './search-form';
import { ArchiveList } from './archive-list';
import type { ArchiveMonth } from '@/db/articles';

export function SidebarContent({
  series,
  archive,
}: {
  series: SeriesItem[];
  archive: ArchiveMonth[];
}) {
  return (
    <div className="space-y-10">
      {/* 小商店（連載一覧） */}
      <section>
        <SectionHeading>小商店</SectionHeading>
        <SeriesList items={series} />
      </section>

      {/* 検索（枠のみ） */}
      <section>
        <SectionHeading gapClass="mb-2">ワード検索</SectionHeading>
        <SearchForm />
      </section>

      {/* アーカイブ（年月の目次・表示のみ） */}
      <section>
        <SectionHeading gapClass="mb-2">アーカイブ</SectionHeading>
        <ArchiveList months={archive} />
      </section>
    </div>
  );
}
