// 右サイドバー（module03）の中身: 小商店（連載一覧）＋検索＋アーカイブ。
// 検索・アーカイブはこのフェーズでは枠だけ（機能は後回し）。仕様書 §14-J。
// 右コラム・ハンバーガーメニュー内の両方でこの中身を使う。

import { SectionHeading } from './section-heading';
import { SeriesList, type SeriesItem } from './series-list';
import { SearchForm } from './search-form';

export function SidebarContent({ series }: { series: SeriesItem[] }) {
  return (
    <div className="space-y-10">
      {/* 小商店（連載一覧） */}
      <section>
        <SectionHeading>小商店</SectionHeading>
        <SeriesList items={series} />
      </section>

      {/* 検索（枠のみ） */}
      <section>
        <SectionHeading>検索</SectionHeading>
        <SearchForm />
      </section>

      {/* アーカイブ（枠のみ・中身は後回し） */}
      <section>
        <SectionHeading>アーカイブ</SectionHeading>
        <p className="text-xs text-[#808080]">（準備中）</p>
      </section>
    </div>
  );
}
