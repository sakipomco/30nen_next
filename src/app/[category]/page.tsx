// 旧WordPressの「連載トップ」URLを、新サイトの連載ページへ「301（恒久リダイレクト）」する。
//
// 旧URL: https://30nen.com/watashinoreshihen/   （連載スラッグが1つだけ）
// 新URL: https://30nen.com/series/watashinoreshihen
//
// 記事URL（5セグメント）の転送は [category]/[year]/[month]/[day]/[id]/route.ts が担当していたが、
// 連載トップだけ抜けていて404になっていた（読み手からの指摘 2026-07-31）。
// Googleの検索結果には旧URLが載っているため、そこから来た人が行き止まりになっていた。
//
// このページは「他のどのページにも当てはまらなかった1セグメントのURL」に対して動く。
// /about・/search・/login などの決まったページはそちらが優先されるのでぶつからない。
// 連載スラッグに当てはまらなければ、これまでどおり404を返す。

import { notFound, permanentRedirect } from 'next/navigation';
import { getCategoryBySlug } from '@/db/categories';

export default async function OldCategoryUrlRedirect({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  // 日本語スラッグ（例: 王様の耳は）はURL上では%エンコードされているので戻す
  const slug = decodeURIComponent(category);

  const found = await getCategoryBySlug(slug);
  if (!found) notFound();

  // 転送先は相対パスで返す（Nginxの裏側にいるため絶対URLを組み立てない。
  // 記事URLの転送 route.ts と同じ考え方）。
  permanentRedirect(`/series/${category}`);
}
