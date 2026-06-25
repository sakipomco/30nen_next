// robots.txt を生成する（検索エンジンに「どこを見ていいか」を伝える）。
//  - インデックス許可時（本番）: トップ配下を許可・管理画面/APIは除外・sitemapの場所を案内。
//  - 不許可時（既定・練習/お試し）: すべて拒否（誤って検索結果に載らないように）。
import type { MetadataRoute } from 'next';
import { siteUrl, isIndexable } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  if (!isIndexable()) {
    return { rules: { userAgent: '*', disallow: '/' } };
  }
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/api'] },
    sitemap: `${siteUrl()}/sitemap.xml`,
    host: siteUrl(),
  };
}
