// 公開ページ共通レイアウト（3カラム＋左端メニュー＋右端アイコン＋ハンバーガー）。仕様書 §14。
// Server Component：連載一覧・リードテキストをDBから取得し、各パーツへ渡す。
//  - 左コラム: ロゴ／リード／SNS／ボタン（module01）
//  - 中央コラム: 各ページの中身（children）
//  - 右コラム: 小商店／検索／アーカイブ（module03・PCのみ。スマホはハンバーガー内）
//  - 左端: 縦書きメニュー（PCのみ）／右端: SNS・メールアイコン（PCのみ）

import { listCategories } from '@/db/categories';
import { listArchiveMonths } from '@/db/articles';
import { getLeadText } from '@/db/settings';
import { SidebarLeft } from '@/components/public/sidebar-left';
import { SidebarContent } from '@/components/public/sidebar-right';
import { EdgeNav } from '@/components/public/edge-nav';
import { EdgeIcons } from '@/components/public/edge-icons';
import { SocialIcons } from '@/components/public/social-icons';
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
  const archive = await listArchiveMonths();
  // お便りフォームの宛先プルダウン用＝小商店と同じ連載一覧（id と名前だけ）。
  const recipients = series.map((s) => ({ id: s.id, name: s.name }));

  return (
    <div className="public-root flex-1 bg-white text-[#333] lg:flex lg:h-screen lg:flex-none lg:flex-col lg:overflow-hidden">
      {/* PC: 左端の縦書きメニュー・右端のSNSアイコン（lg以上のみ表示） */}
      <EdgeNav />
      <EdgeIcons />

      {/* スマホ: ハンバーガーメニュー（lg未満のみ表示） */}
      <HamburgerMenu series={series} archive={archive} />

      {/* 3カラム本体 */}
      {/* PC では本体を画面の高さいっぱいに固定し（lg:flex-1 lg:min-h-0）、各コラムを
          それぞれの枠内だけでスクロールさせる（下の lg:overflow-y-auto）。
          PC の上余白は grid でなく中央・右の各コラム側に持たせる＝左コラムのロゴを
          マイナス余白なしで画面上端に付けるため（マイナス余白はスクロールの箱では切れる）。 */}
      {/* スマホの左右アキ(px-7=28px)は現行サイト（20px＋2%≒28px）に合わせた値（SAKIさん指定 2026-07-10） */}
      <div className="mx-auto grid w-full max-w-[1500px] grid-cols-1 gap-10 px-7 py-10 lg:min-h-0 lg:flex-1 lg:grid-cols-[1.1fr_1.8fr_1.1fr] lg:gap-12 lg:px-20 lg:pb-6 lg:pt-0">
        {/* 左コラム（ロゴが上端に付くので上余白なし） */}
        <aside className="no-scrollbar lg:min-h-0 lg:overflow-y-auto">
          <SidebarLeft leadText={leadText} recipients={recipients} />
        </aside>

        {/* 中央コラム（各ページの中身）＝自分の枠内だけでスクロール（スクロールバーは隠す）
            lg:pt-10 は grid から移した上余白（従来と同じ見た目の位置）。 */}
        <main className="no-scrollbar min-w-0 lg:min-h-0 lg:overflow-y-auto lg:pt-10">{children}</main>

        {/* 右コラム（PCのみ・スマホはハンバーガー内に同じ内容）＝中央とは別に独立スクロール */}
        {/* lg:pt-12 ＝ grid から移した上余白(40px)＋従来の pt-2(8px)。 */}
        <aside className="no-scrollbar hidden lg:block lg:min-h-0 lg:overflow-y-auto lg:pt-12">
          <SidebarContent series={series} archive={archive} />
        </aside>
      </div>

      {/* スマホ: ページ最下部にSNS・メールアイコンを横一列（PCは右端の縦並びで表示済み＝ここは lg:hidden） */}
      <div className="flex items-center justify-center gap-8 px-5 pt-4 lg:hidden">
        <SocialIcons size={22} />
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
