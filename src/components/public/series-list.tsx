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
    <ul className="grid grid-cols-3 gap-3">
      {items.map((cat) => {
        const href = cat.slug ? `/series/${cat.slug}` : `/series/${cat.id}`;
        const img = cat.imagePath || '/line-up.png';
        return (
          <li key={cat.id}>
            <Link href={href} className="group block" title={cat.name}>
              <span className="relative block aspect-square w-full overflow-hidden">
                <Image
                  src={img}
                  alt={cat.name}
                  fill
                  sizes="(max-width: 1024px) 30vw, 8vw"
                  className="object-contain transition-transform duration-300 group-hover:scale-[1.05]"
                />
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
