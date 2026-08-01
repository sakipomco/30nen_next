// 移行直後だけ使っていた連載ページのURL /series/○○ を、正式なURL /shop/○○ へ「301（恒久リダイレクト）」する。
//
// 旧URL: https://30nen.com/series/nayatane
// 新URL: https://30nen.com/shop/nayatane
//
// 経緯（2026-08-01）: 旧サイト時代の連載トップは /shop/○○ で、書き手がSNSのプロフィールなどに
// 貼っていたのもこの形だった。新サイトでは一時 /series/○○ にしていたが、
// 「小商店」という呼び名に合う /shop/○○ を正式なURLに戻す（SAKIさん判断）。
// 数日だけ外に出ていた /series/○○ からも必ず届くよう、ここで転送する。
//
// ・?page=2 などの後ろの部分（クエリ）はそのまま引き継ぐ。
// ・存在しない連載名なら、転送先の /shop/○○ 側がこれまでどおり404を返す。

import { NextResponse, type NextRequest } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  // 転送先は「/shop/○○」の相対パスで返す。
  // Nginxの裏側にいるため req.nextUrl.origin は内部アドレス（localhost:3000）になり、
  // 絶対URLを組み立てると読者が到達できないURLへ飛ばしてしまう（記事URLの転送と同じ考え方）。
  return new NextResponse(null, {
    status: 301,
    headers: { Location: `/shop/${slug}${req.nextUrl.search}` },
  });
}
