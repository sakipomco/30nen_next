// sitemap.xml を生成する（検索エンジンに「サイト内のページ一覧」を渡す）。
//  - 固定ページ（トップ・about など）＋ 連載ページ ＋ 全公開記事。
//  - 記事は日々増えるので1時間ごとに作り直す（revalidate）。
import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/site';
import { listPublishedArticles, countPublishedArticles } from '@/db/articles';
import { listCategories } from '@/db/categories';

export const revalidate = 3600; // 1時間ごとに最新化

// DBのUTC文字列（"YYYY-MM-DD HH:MM:SS"）を Date に。空なら現在時刻。
function toDate(utc: string | null): Date {
  if (!utc) return new Date();
  const d = new Date(utc.replace(' ', 'T') + 'Z');
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

function postPath(a: { slug: string | null; id: number }): string {
  return a.slug ? `/posts/${encodeURIComponent(a.slug)}` : `/posts/${a.id}`;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const now = new Date();

  // ① 固定ページ
  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${base}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/history`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/howtouse`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ];

  // ② 連載ページ（slugがあるものだけ）
  const cats = await listCategories();
  const seriesEntries: MetadataRoute.Sitemap = cats
    .filter((c) => c.slug)
    .map((c) => ({
      url: `${base}/series/${encodeURIComponent(c.slug!)}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.6,
    }));

  // ③ 全公開記事
  const total = await countPublishedArticles();
  const articles = await listPublishedArticles({ limit: Math.max(total, 1) });
  const articleEntries: MetadataRoute.Sitemap = articles.map((a) => ({
    url: `${base}${postPath(a)}`,
    lastModified: toDate(a.publishedAt),
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  return [...staticEntries, ...seriesEntries, ...articleEntries];
}
