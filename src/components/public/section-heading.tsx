// セクション見出し（オビ）。例: 「最新」「記事一覧」「小商店」。
// obi-pattern.png を薄く敷いた「帯（おび）」の上にラベルを置く。
// 現行 30nen.com の common_title01 の見た目を再現。仕様書 §14。

export function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="obi-band mb-5 px-1 py-[2px]">
      <h2 className="serif whitespace-nowrap text-[0.95rem] leading-tight tracking-normal text-[#150c0c]">
        {children}
      </h2>
    </div>
  );
}
