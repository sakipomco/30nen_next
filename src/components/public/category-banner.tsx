// カテゴリー帯（記事詳細ページの一番上）。
// 構成: テクスチャ帯（.obi-band）の上に〔白い正方形窓＋カテゴリー画像〕＋〔連載名(大)／ヨミガナ(小)〕。
// 現行 30nen.com の連載見出しの雰囲気を再現。連載別一覧ページができたら href でリンクにできる。

import Image from 'next/image';

export function CategoryBanner({
  name,
  reading,
  imagePath,
}: {
  name: string;
  reading?: string | null;
  imagePath?: string | null;
}) {
  return (
    <div className="obi-band flex items-center gap-2.5 p-2 sm:gap-3 sm:p-2.5">
      {/* 白い正方形窓＋カテゴリー画像（画像が無ければ代替の line-up.png） */}
      <div className="flex aspect-square w-11 shrink-0 items-center justify-center overflow-hidden bg-white sm:w-14">
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
}
