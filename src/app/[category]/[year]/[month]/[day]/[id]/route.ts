// 旧WordPressの記事URLを、新サイトのURLへ「301（恒久リダイレクト）」する。
//
// 現行パーマリンク構造: /%category%/%year%/%monthnum%/%day%/%post_id%/
//   例) https://30nen.com/oosamanomimiwa/2026/06/25/45564/
// 末尾の記事ID（= 旧 wp_id）で新記事を引き、 /posts/{id} へ転送する。
//   → 読者のブックマーク・検索結果・古いリンクが切れない（SEO継続）。
//
// このルートは5セグメント（[category]/[year]/[month]/[day]/[id]）が全部そろう時だけ一致する。
// /posts/{slug}（2セグメント）や /about（1）など他のページとはぶつからない。

import { NextResponse, type NextRequest } from 'next/server';
import { getPublishedArticleRefByWpId } from '@/db/articles';
import { postHref } from '@/lib/site';

export async function GET(
  _req: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      category: string;
      year: string;
      month: string;
      day: string;
      id: string;
    }>;
  },
) {
  const { id } = await params;
  const wpId = Number(id);

  if (Number.isInteger(wpId) && wpId > 0) {
    const ref = await getPublishedArticleRefByWpId(wpId);
    if (ref) {
      // 転送先は「/posts/123」の相対パスで返す。
      // Nginxの裏側にいるため req.nextUrl.origin は内部アドレス（localhost:3000）になり、
      // 絶対URLを組み立てると読者が到達できないURLへ飛ばしてしまう。
      // 相対パスならブラウザがアクセス中のホストで解決するので、
      // 切替前（new.30nen.com）でも切替後（30nen.com）でも設定なしで正しく動く。
      return new NextResponse(null, {
        status: 301,
        headers: { Location: postHref(ref) },
      });
    }
  }

  // 該当する公開記事が無い（未移行・非公開・削除済みなど）→ 404。
  return new NextResponse('Not Found', { status: 404 });
}
