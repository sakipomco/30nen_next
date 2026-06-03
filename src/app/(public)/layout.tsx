// 公開ページ共通レイアウト（3カラム＋左端メニュー＋右端アイコン＋ハンバーガー）。仕様書 §14。
// Server Component：連載一覧・リードテキストをDBから取得し、各パーツへ渡す。
//  - 左コラム: ロゴ／リード／SNS／ボタン（module01）
//  - 中央コラム: 各ページの中身（children）
//  - 右コラム: 小商店／検索／アーカイブ（module03・PCのみ。スマホはハンバーガー内）
//  - 左端: 縦書きメニュー（PCのみ）／右端: SNS・メールアイコン（PCのみ）

import { listCategories } from '@/db/categories';
import { getLeadText } from '@/db/settings';
import { SidebarLeft } from '@/components/public/sidebar-left';
import { SidebarContent } from '@/components/public/sidebar-right';
import { EdgeNav } from '@/components/public/edge-nav';
import { EdgeIcons } from '@/components/public/edge-icons';
import { HamburgerMenu } from '@/components/public/hamburger-menu';
import type { SeriesItem } from '@/components/public/series-list';

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 親連載（トップ階層）だけを並び順で取り出して「小商店」に渡す。
  const all = await listCategories();
  const series: SeriesItem[] = all
    .filter((c) => c.parentId === null)
    .map((c) => ({ id: c.id, name: c.name, slug: c.slug, imagePath: c.imagePath }));

  const leadText = await getLeadText();

  return (
    <div className="public-root flex-1 bg-white text-[#333]">
      {/* PC: 左端の縦書きメニュー・右端のSNSアイコン（lg以上のみ表示） */}
      <EdgeNav />
      <EdgeIcons />

      {/* スマホ: ハンバーガーメニュー（lg未満のみ表示） */}
      <HamburgerMenu series={series} />

      {/* 3カラム本体 */}
      <div className="mx-auto grid max-w-[1500px] grid-cols-1 gap-10 px-5 py-10 lg:grid-cols-[1fr_1.8fr_1fr] lg:gap-12 lg:px-20">
        {/* 左コラム */}
        <aside className="lg:pt-2">
          <SidebarLeft leadText={leadText} />
        </aside>

        {/* 中央コラム（各ページの中身） */}
        <main className="min-w-0">{children}</main>

        {/* 右コラム（PCのみ・スマホはハンバーガー内に同じ内容） */}
        <aside className="hidden lg:block">
          <SidebarContent series={series} />
        </aside>
      </div>

      {/* コピーライト（控えめに） */}
      <footer className="px-5 pb-24 pt-4 text-center lg:pb-10">
        <small className="text-[0.65rem] leading-relaxed text-[#808080]">
          ©30YEARS ARCADE
        </small>
      </footer>
    </div>
  );
}
