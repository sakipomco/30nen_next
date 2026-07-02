// 「小商店」＝親連載（カテゴリー）の画像を3列で並べる部品。右サイドバーとハンバーガーで共用。
// 画像は連載の imagePath。未設定なら line-up.png で代替。仕様書 §14-J。

import Image from 'next/image';
import Link from 'next/link';

export type SeriesItem = {
  id: number;
  name: string;
  slug: string | null;
  imagePath: string | null;
};

export function SeriesList({ items }: { items: SeriesItem[] }) {
  if (items.length === 0) {
    return <p className="text-xs text-[#808080]">連載はまだありません。</p>;
  }
  return (
    <ul className="grid grid-cols-3 gap-0">
      {items.map((cat) => {
        const href = cat.slug ? `/series/${cat.slug}` : `/series/${cat.id}`;
        const img = cat.imagePath || '/line-up.png';
        return (
          <li key={cat.id}>
            {/* セル＝四隅のL字トンボ＋内側に余白をとった小さめの画像。
                セル同士はすき間0で角を共有し、隣のLと重なって十字に見える。 */}
            <Link href={href} className="group relative block p-2.5" title={cat.name}>
              {/* 四隅のL字（トンボ風装飾）。線をセルの境界線の真上に来るよう
                  外向きに半分(0.75px)ずらし、隣セルのLと1本に重ねる（ダブり防止）。 */}
              <span className="pointer-events-none absolute left-0 top-0 h-2 w-2 -translate-x-[0.75px] -translate-y-[0.75px] border-l-[1.5px] border-t-[1.5px] border-[#c0c0c0]" />
              <span className="pointer-events-none absolute right-0 top-0 h-2 w-2 translate-x-[0.75px] -translate-y-[0.75px] border-r-[1.5px] border-t-[1.5px] border-[#c0c0c0]" />
              <span className="pointer-events-none absolute bottom-0 left-0 h-2 w-2 -translate-x-[0.75px] translate-y-[0.75px] border-b-[1.5px] border-l-[1.5px] border-[#c0c0c0]" />
              <span className="pointer-events-none absolute bottom-0 right-0 h-2 w-2 translate-x-[0.75px] translate-y-[0.75px] border-b-[1.5px] border-r-[1.5px] border-[#c0c0c0]" />
              {/* ロゴはマスのサイズはそのまま、描画だけ80%に縮めて余白をつくる。 */}
              <span className="relative block aspect-square w-full scale-[0.8] overflow-hidden">
                <Image
                  src={img}
                  alt={cat.name}
                  fill
                  sizes="(max-width: 1024px) 30vw, 8vw"
                  className="object-contain transition-opacity duration-300 group-hover:opacity-80"
                />
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
