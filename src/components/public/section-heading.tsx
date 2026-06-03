// セクション見出し（オビ）。例: 「最新」「記事一覧」「小商店」。
// ラベル（明朝・字間広め）＋細い横線。仕様書 §14 のデザイン画像に合わせた見た目。

export function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-5 flex items-center gap-4">
      <h2 className="serif whitespace-nowrap text-[1.05rem] tracking-[0.4em] text-[#150c0c]">
        {children}
      </h2>
      <span className="h-px flex-1 bg-[#150c0c]/30" />
    </div>
  );
}
