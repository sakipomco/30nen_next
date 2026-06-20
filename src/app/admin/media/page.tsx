// 画像フォルダ（/admin/media）。これまでに上げた写真の一覧。
// ・全員の写真を新しい順で表示（クリックで拡大）
// ・削除できるのは「自分が上げた写真」だけ（管理者はすべて／記録の無い過去の写真は管理者のみ）
import Link from 'next/link';
import { requireUser } from '@/auth/session';
import { listUploadedImageFiles } from '@/lib/media';
import { getUploadOwners } from '@/db/uploads';
import { MediaGrid } from './media-grid';

export const metadata = {
  title: '画像フォルダ｜30nen',
};

// 常に最新のフォルダ状態を見せる（写真の追加・削除を即反映）。
export const dynamic = 'force-dynamic';

const PER_PAGE = 48; // 1ページに出す枚数

export default async function MediaPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const me = await requireUser();
  const { page: pageParam } = await searchParams;

  const files = await listUploadedImageFiles();
  const owners = await getUploadOwners(); // URL → 上げた人のid

  const total = files.length;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const page = Math.min(Math.max(1, Number(pageParam) || 1), totalPages);
  const start = (page - 1) * PER_PAGE;
  const pageFiles = files.slice(start, start + PER_PAGE);

  const isAdmin = me.role === 'admin';
  const items = pageFiles.map((f) => {
    const owner = owners.get(f.url); // undefined=記録なし(過去/不明)
    const isOwner = owner != null && owner === me.id;
    return { url: f.url, canDelete: isAdmin || isOwner };
  });

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 px-4 py-12">
      <div className="w-full max-w-5xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-zinc-900">画像フォルダ</h1>
          <Link href="/admin" className="text-sm text-zinc-500 hover:underline">
            ← 投稿管理へ戻る
          </Link>
        </div>

        <p className="mb-4 text-sm text-zinc-500">
          これまでに上げた写真の一覧です（全{total}枚）。写真をクリックすると大きく表示します。
          削除できるのは自分が上げた写真だけです{isAdmin && '（管理者はすべて削除できます）'}。
        </p>

        <MediaGrid items={items} />

        {/* ページ送り */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-4 text-sm">
            {page > 1 ? (
              <Link
                href={`/admin/media?page=${page - 1}`}
                className="rounded-md border border-zinc-300 px-3 py-1.5 text-zinc-700 transition-colors hover:bg-zinc-100"
              >
                ← 前へ
              </Link>
            ) : (
              <span className="rounded-md border border-zinc-200 px-3 py-1.5 text-zinc-300">
                ← 前へ
              </span>
            )}
            <span className="text-zinc-500">
              {page} / {totalPages}
            </span>
            {page < totalPages ? (
              <Link
                href={`/admin/media?page=${page + 1}`}
                className="rounded-md border border-zinc-300 px-3 py-1.5 text-zinc-700 transition-colors hover:bg-zinc-100"
              >
                次へ →
              </Link>
            ) : (
              <span className="rounded-md border border-zinc-200 px-3 py-1.5 text-zinc-300">
                次へ →
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
