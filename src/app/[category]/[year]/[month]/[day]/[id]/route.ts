// 旧WordPressの記事URLを、新サイトのURLへ「301（恒久リダイレクト）」する。
//
// 現行パーマリンク構造: /%category%/%year%/%monthnum%/%day%/%post_id%/
//   例) https://30nen.com/oosamanomimiwa/2026/06/25/45564/
// 末尾の記事ID（= 旧 wp_id）で新記事を引き、 /posts/{slug} へ転送する。
//   → 読者のブックマーク・検索結果・古いリンクが切れない（SEO継続）。
//
// このルートは5セグメント（[category]/[year]/[month]/[day]/[id]）が全部そろう時だけ一致する。
// /posts/{slug}（2セグメント）や /about（1）など他のページとはぶつからない。

import { NextResponse, type NextRequest } from 'next/server';
import { getPublishedArticleRefByWpId } from '@/db/articles';

export async function GET(
  req: NextRequest,
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
  const origin = req.nextUrl.origin;

  if (Number.isInteger(wpId) && wpId > 0) {
    const ref = await getPublishedArticleRefByWpId(wpId);
    if (ref) {
      const path = ref.slug
        ? `/posts/${encodeURIComponent(ref.slug)}`
        : `/posts/${ref.id}`;
      return NextResponse.redirect(new URL(path, origin), 301);
    }
  }

  // 該当する公開記事が無い（未移行・非公開・削除済みなど）→ 404。
  return new NextResponse('Not Found', { status: 404 });
}
