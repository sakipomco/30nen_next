// 検索フォーム。キーワードを入れて送信すると検索結果ページ（/search?q=…）へ飛ぶ。
// 入力欄・「検索」ボタンとも、お便りフォームの入力欄と同じケイ（枠線）囲み。

export function SearchForm() {
  return (
    <form action="/search" className="flex items-stretch">
      <input
        type="search"
        name="q"
        className="serif w-full border border-[#150c0c]/25 bg-white px-2 py-1.5 text-sm text-[#333] outline-none focus:border-[#150c0c]"
      />
      {/* 入力欄と密着させる（境目の線は1本に＝ボタン側の左線を消す） */}
      <button
        type="submit"
        className="serif shrink-0 border border-l-0 border-[#150c0c]/25 px-3 py-1.5 text-sm text-[#333] transition-opacity hover:opacity-60"
      >
        検索
      </button>
    </form>
  );
}
