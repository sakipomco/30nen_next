// 左端メニュー（B項目）と右端アイコン（C項目）のリンク定義。
// PC左端の縦メニュー・スマホのハンバーガー内で共用する。仕様書 §14-B / §14-C。

export const PAGE_LINKS = [
  { label: '当店について', href: '/about' },
  { label: '沿革', href: '/history' },
  { label: '書き手募集', href: '/about#wanted' },
  { label: '利用規約', href: '/howtouse' },
  { label: 'プライバシーポリシー', href: '/privacy' },
] as const;

export const SOCIAL_LINKS = {
  instagram: 'https://www.instagram.com/30nen_syouten/',
  x: 'https://x.com/30nensyouten',
  // メールアイコンの飛び先＝専用ページは作らず、左コラムの「お便りフォーム」(#otayori)へ誘導する。
  //  - フォームはトップ以外の全ページに出る → 同じページ内なら #otayori でその場へスクロール。
  //  - トップにはフォームが無い → フォームのある /about へ飛んでからスクロールする。
  contactAnchor: '#otayori',
  contactFromTop: '/about#otayori',
} as const;
