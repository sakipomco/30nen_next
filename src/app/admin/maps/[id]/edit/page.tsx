// 旅の行程マップの編集ページ（/admin/maps/[id]/edit）。管理者だけが見られる。
// ここで画像を差し替えると、この名前を使っている記事すべての地図が一斉に新しくなる。
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/auth/session';
import { updateMapAction } from '@/app/actions/maps';
import { getMap } from '@/db/maps';
import { MapForm } from '../../map-form';

export const metadata = {
  title: '旅の地図の編集｜30nen',
};

export default async function EditMapPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();

  const { id } = await params;
  const mapId = Number(id);
  if (!Number.isInteger(mapId) || mapId <= 0) notFound();

  const map = await getMap(mapId);
  if (!map) notFound();

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 px-4 py-12">
      <div className="w-full max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-zinc-900">旅の地図を編集</h1>
          <Link
            href="/admin/maps"
            className="text-sm text-zinc-500 hover:underline"
          >
            ← 旅の地図へ戻る
          </Link>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-6">
          <MapForm
            action={updateMapAction}
            initial={{
              id: map.id,
              name: map.name,
              imagePath: map.imagePath,
            }}
            submitLabel="保存する"
          />
        </div>
      </div>
    </div>
  );
}
