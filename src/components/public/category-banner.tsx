// カテゴリー帯（記事詳細ページの一番上／連載別一覧ページの見出し）。
// 構成: テクスチャ帯（.obi-band）の上に〔白い正方形窓＋カテゴリー画像〕＋〔連載名(大)／ヨミガナ(小)〕。
// 現行 30nen.com の連載見出しの雰囲気を再現。
//  - href を渡すと帯ぜんぶがその連載ページへのリンクになる（記事ページから連載へ飛べる）。
//    連載ページ自身では href を渡さず、ただの見出しとして使う。

import Image from 'next/image';
import Link from 'next/link';

export function CategoryBanner({
  name,
  reading,
  imagePath,
  href,
}: {
  name: string;
  reading?: string | null;
  imagePath?: string | null;
  href?: string;
}) {
  const inner = (
    <div className="obi-band flex items-center gap-3 p-3 sm:gap-4 sm:p-4">
      {/* 白い正方形窓＋カテゴリー画像（画像が無ければ代替の line-up.png） */}
      <div className="flex aspect-square w-16 shrink-0 items-center justify-center overflow-hidden bg-white sm:w-20">
        <Image
          src={imagePath || '/line-up.png'}
          alt={name}
          width={80}
          height={80}
          className="h-full w-full object-contain p-1"
        />
      </div>

      {/* 連載名（大）＋ヨミガナ（小） */}
      <div className="min-w-0">
        <p className="serif text-base leading-tight text-[#150c0c]">
          {name}
        </p>
        {reading && (
          <p className="mt-0 text-[0.7rem] tracking-[-0.08em] text-[#333] sm:text-xs">
            {reading}
          </p>
        )}
      </div>
    </div>
  );

  // href があれば帯ぜんぶをリンクに（マウスオーバーで少し薄く）。
  if (href) {
    return (
      <Link href={href} className="block transition-opacity hover:opacity-80" title={name}>
        {inner}
      </Link>
    );
  }
  return inner;
}
