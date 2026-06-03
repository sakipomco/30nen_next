// 検索フォーム（枠だけ・機能はこのフェーズでは未実装）。仕様書 §14-J。
// action="/search" のテキスト入力を置いておくだけ（検索ページは後回し）。

export function SearchForm() {
  return (
    <form action="/search" className="flex items-center gap-2">
      <input
        type="search"
        name="q"
        placeholder="キーワードで探す"
        className="serif w-full border-b border-[#150c0c]/30 bg-transparent px-1 py-1 text-sm text-[#333] placeholder:text-[#808080] focus:border-[#150c0c] focus:outline-none"
      />
      <button
        type="submit"
        className="serif shrink-0 text-sm text-[#333] hover:opacity-60"
      >
        検索
      </button>
    </form>
  );
}
