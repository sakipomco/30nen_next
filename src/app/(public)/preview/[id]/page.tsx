// 投稿プレビューページ（/preview/[id]）。
// 投稿フォームの「プレビュー」ボタンから別タブで開かれ、公開ページと同じレイアウト（3カラム）の中で
// 投稿の見え方を確認できる。
// - ログイン必須（requireUser）。未ログインは /login へ転送される。
// - status（draft/published）や公開日時に関係なく取得（getArticleForPreview）。
// - 前後の日記・関連記事は省略（下書きでは比較対象が無い・実装をシンプルに保つ）。

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { requireUser } from '@/auth/session';
import { getArticleForPreview } from '@/db/articles';
import { getUserById, toPublicUser } from '@/db/users';
import { formatJstDate } from '@/lib/datetime';
import { sanitizeArticleHtml } from '@/lib/sanitize';
import { extractMapNames, renderMapTags } from '@/lib/map-tag';
import { getMapPathsByNames } from '@/db/maps';
import { Breadcrumb } from '@/components/public/breadcrumb';
import { CategoryBanner } from '@/components/public/category-banner';
import { WriterProfile } from '@/components/public/writer-profile';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'プレビュー' };

export default async function PreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id: idStr } = await params;
  const id = Number(idStr);
  if (!Number.isFinite(id) || id <= 0) notFound();

  const article = await getArticleForPreview(id);
  if (!article) notFound();

  const authorRaw = article.authorId ? await getUserById(article.authorId) : null;
  const author = authorRaw ? toPublicUser(authorRaw) : null;

  // 公開日時が未設定なら「（未公開）」を表示。日時指定があるならその日付。
  const date = article.publishedAt ? formatJstDate(article.publishedAt) : '（未公開）';

  const seriesHref = article.categoryId
    ? `/series/${article.categorySlug ?? article.categoryId}`
    : undefined;

  // 本文の [MAP:名札] を折りたたみの地図に置き換える（公開ページと同じ手順）。
  // プレビューだけは forPreview: true ＝ 登録されていない名札に注意書きを出す。
  // 書き手が公開前に打ち間違いへ気づけるようにするため（読者には何も出ない）。
  const safeHtml = sanitizeArticleHtml(article.content);
  const mapPaths = await getMapPathsByNames(extractMapNames(safeHtml));
  const bodyHtml = renderMapTags(safeHtml, mapPaths, { forPreview: true });

  // 戻り先（編集ページか新規ページ）
  const editHref = `/admin/articles/${article.id}/edit`;

  return (
    <article className="mx-auto max-w-[720px]">
      {/* プレビューモードの注意バナー（公開前であることを明確にする） */}
      <div className="mb-6 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <p className="font-medium">プレビュー表示中</p>
        <p className="mt-0.5 text-xs">
          この画面は公開前の見え方の確認用です。実際の公開は投稿フォームの「投稿する」を押してください。
          <Link href={editHref} className="ml-2 underline">
            編集画面に戻る
          </Link>
        </p>
      </div>

      {/* 以下は公開ページ（/posts/[slug]）と同じ構成 */}
      <Breadcrumb
        items={[
          { label: '三十年商店', href: '/' },
          ...(article.categoryName
            ? [{ label: article.categoryName, href: seriesHref }]
            : []),
          { label: article.title || '（無題）' },
        ]}
      />

      {article.categoryName && (
        <div className="mt-2">
          <CategoryBanner
            name={article.categoryName}
            reading={article.categoryReading}
            imagePath={article.categoryImagePath}
            href={seriesHref}
          />
        </div>
      )}

      {/* 日付・タイトルの大きさは公開ページ（posts/[slug]）と同じにそろえる */}
      <p className="mt-6 text-sm text-[#333]">{date}</p>

      <h1 className="serif mt-0.5 text-[21px] font-bold leading-snug text-[#333]">
        {article.title || '（無題）'}
      </h1>

      {/* アイキャッチは記事ページの一番上には出さない（公開ページと同じ・旧サイトと同じ）。 */}

      <div
        className="article-body mt-8 text-[#333]"
        dangerouslySetInnerHTML={{ __html: bodyHtml }}
      />

      {author && <WriterProfile author={author} />}
    </article>
  );
}
