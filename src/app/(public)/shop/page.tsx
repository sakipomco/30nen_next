// 連載名が付いていない `/shop` だけのURLを、トップページへ転送する。
//
// 読み手が `/shop/nayatane` の後ろを削って `/shop` を開くと、これまでは404（行き止まり）だった。
// 小商店の一覧はトップページの右側（スマホはハンバーガーの中）にあるので、そこへ送る。
//
// ⚠ わざと「一時的な転送（307）」にしている（`permanentRedirect` ＝ 恒久転送 は使わない）。
// 恒久転送はブラウザが長く覚えてしまい、あとから変えても古い動きが残ることがある。
// 将来ここに「小商店の一覧ページ」を作る可能性があるので、いつでも差し替えられるようにしておく。

import { redirect } from 'next/navigation';

export default function ShopIndexRedirect() {
  redirect('/');
}
