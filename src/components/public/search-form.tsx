// 検索フォーム。キーワードを入れて送信すると検索結果ページ（/search?q=…）へ飛ぶ。
// 入力欄・「検索」ボタンとも、お便りフォームの入力欄と同じケイ（枠線）囲み。
// 連載（カテゴリー）のプルダウンで「この連載の中だけ」に絞れる（/search?q=…&cat=slug）。
// 書き手の要望「自分の日記の範囲で過去記事を探したい」（2026-11-11）。

export type SearchCategoryOption = { slug: string; name: string };

export function SearchForm({
  categories = [],
  defaultQuery = '',
  defaultCategory = '',
}: {
  categories?: SearchCategoryOption[];
  defaultQuery?: string;
  defaultCategory?: string;
}) {
  return (
    <form action="/search" className="space-y-3">
      {/* 連載の絞り込み（検索窓の上・少し小さめ・幅は検索窓の60%でセンター／SAKIさん指定 2026-11-11） */}
      {categories.length > 0 && (
        <select
          name="cat"
          defaultValue={defaultCategory}
          aria-label="連載で絞り込む"
          className="serif mx-auto block h-[22px] w-[60%] border border-[#150c0c]/25 bg-white px-1 py-0 text-xs text-[#333] outline-none focus:border-[#150c0c]"
        >
          <option value="">すべての連載から</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      )}
      <div className="flex items-stretch">
        <input
          type="search"
          name="q"
          defaultValue={defaultQuery}
          aria-label="キーワード"
          className="serif w-full border border-[#150c0c]/25 bg-white px-2 py-[2.6px] text-sm text-[#333] outline-none focus:border-[#150c0c]"
        />
        {/* 入力欄と密着させる（境目の線は1本に＝ボタン側の左線を消す） */}
        <button
          type="submit"
          className="serif shrink-0 border border-l-0 border-[#150c0c]/25 px-3 py-[2.6px] text-sm text-[#333] transition-opacity hover:opacity-60"
        >
          検索
        </button>
      </div>
    </form>
  );
}
