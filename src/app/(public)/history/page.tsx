// 沿革（/history）。左端メニュー「沿革」の行き先。
// 現行 30nen.com/history/ の内容を忠実に再現した固定ページ。
//  - 構成: 足跡（三十年商店＞沿革）→「沿革」帯 → 年ごとの見出し →
//          月ごとのできごと（説明文＋任意の写真・キャプション）。
//  - 項目の区切りは薄いグレーの点線（各年の最後の項目だけ線なし＝現行どおり）。
//  - できごとは下の HISTORY データに足すだけで増やせる（例: 自作システムへの移行）。
//  - 本文の文字組みは記事本文と同じ .article-body を使い、サイト全体で統一する。

import type { Metadata } from 'next';
import Image from 'next/image';
import { Breadcrumb } from '@/components/public/breadcrumb';
import { SectionHeading } from '@/components/public/section-heading';

export const metadata: Metadata = {
  // 末尾の「｜三十年商店」は src/app/layout.tsx の template が自動で付ける
  title: '沿革',
  description: '三十年商店のあゆみ。令和六年の創業から現在まで。',
};

// 沿革のできごと。新しいできごとはここに足す。
// image は public/ 直下のファイル名（width/height は実画像のピクセル値）。
type HistoryEntry = {
  month: string;
  text: string;
  image?: { src: string; width: number; height: number; caption?: string };
};
type HistoryYear = { year: string; entries: HistoryEntry[] };

const HISTORY: HistoryYear[] = [
  {
    year: '令和6年 | 2024年',
    entries: [
      {
        month: '7月',
        text: '三十年商店創業  「三十年、日記を書いてみませんか」と店主が声がけした書き手12人ではじまる',
        image: {
          src: '/30nen_history_01.jpg',
          width: 2182,
          height: 1636,
          caption: '吉祥寺 いせや総本店にて決起会',
        },
      },
      {
        month: '8月',
        text: '「書き手募集」への応募から、初のメンバー加入',
      },
      {
        month: '9月',
        text: 'Studioで作成されたデザイン性の高いサイト最新事例｜2024年9月版  に選出',
        image: { src: '/30nen_history_02.jpg', width: 975, height: 879 },
      },
      {
        month: '10月',
        text: '関田浩平氏［月刊カレンダー10月］へ、初めての広告出稿',
        image: { src: '/30nen_history_03.jpg', width: 648, height: 784 },
      },
      {
        month: '12月',
        text: 'オリジナルグッズ作成（ステッカー）',
        image: { src: '/30nen_history_04.jpg', width: 1232, height: 942 },
      },
    ],
  },
  {
    year: '令和7年 | 2025年',
    entries: [
      {
        month: '1月',
        text: '北鎌倉 スミカ探求舎にて新年会',
        image: { src: '/30nen_history_05.jpg', width: 2112, height: 1584 },
      },
      {
        month: '6月',
        text: 'StudioからWordpressへ移行',
      },
      {
        month: '10月',
        text: '新宿区秘密基地にて商店会',
        image: { src: '/30nen_history_06.jpg', width: 1620, height: 1080 },
      },
    ],
  },
  {
    year: '令和8年 | 2026年',
    entries: [
      {
        month: '6月',
        text: 'pop up! 初のメンバー加入',
      },
      {
        month: '7月',
        text: 'Wordpressから自作システムへ移行',
      },
    ],
  },
];

export default function HistoryPage() {
  return (
    <div className="mx-auto max-w-[720px]">
      {/* 足跡（現在地） */}
      <Breadcrumb
        items={[{ label: '三十年商店', href: '/' }, { label: '沿革' }]}
      />

      <section>
        <SectionHeading>沿革</SectionHeading>

        <div className="article-body text-[#333]">
          {HISTORY.map((y) => (
            <div key={y.year}>
              {/* 年の見出し */}
              <h3>{y.year}</h3>

              {/* 月ごとのできごと。下の点線は全項目に入れる（SAKIさん指定 2026-06-12） */}
              {y.entries.map((e) => {
                return (
                  <div
                    key={e.month}
                    className="mt-5 flex flex-col gap-4 border-b border-dotted border-[#ddd] pb-5 sm:flex-row"
                  >
                    {/* 月＋説明文（写真ありは60%・なしは全幅） */}
                    <div className={e.image ? 'sm:w-3/5 sm:pr-4' : 'w-full'}>
                      <p className="my-0 font-bold">{e.month}</p>
                      <p className="my-0">{e.text}</p>
                    </div>

                    {/* 写真（あれば右側40%・キャプションは写真の下に小さく） */}
                    {e.image && (
                      <figure className="sm:w-2/5">
                        <Image
                          src={e.image.src}
                          alt={e.image.caption ?? `${y.year} ${e.month}`}
                          width={e.image.width}
                          height={e.image.height}
                          sizes="(max-width: 640px) 100vw, 288px"
                          className="h-auto w-full"
                          // 本文共通の画像マージン(1.2em)を打ち消し、写真の上端を行の上端に・
                          // キャプションを写真のすぐ下に（クラス指定では共通スタイルに負けるため style で）
                          style={{ margin: 0 }}
                        />
                        {e.image.caption && (
                          // 写真とキャプションのあいだは詰める（SAKIさん指定）
                          <figcaption className="mt-1 text-xs leading-tight text-[#808080]">
                            {e.image.caption}
                          </figcaption>
                        )}
                      </figure>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
