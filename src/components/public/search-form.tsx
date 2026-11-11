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
      {/* 囲まず、左右を［ ］で挟むあしらい。ブラウザ標準の矢印は消し、細い「く」の字を ］ の手前に置く。 */}
      {categories.length > 0 && (
        <div className="serif relative mx-auto flex w-[60%] items-center text-xs text-[#150c0c]/60">
          <span aria-hidden className="pointer-events-none select-none">［</span>
          <select
            name="cat"
            defaultValue={defaultCategory}
            aria-label="連載で絞り込む"
            className="serif block h-[22px] min-w-0 flex-1 appearance-none rounded-none border-0 bg-transparent py-0 pl-1 pr-4 text-center text-xs text-[#333] outline-none"
          >
            <option value="">すべての連載から</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
          <span
            aria-hidden
            className="pointer-events-none absolute right-[1.6em] top-[7px] h-[5px] w-[5px] rotate-45 border-b border-r border-[#150c0c]/60"
          />
          <span aria-hidden className="pointer-events-none select-none">］</span>
        </div>
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
