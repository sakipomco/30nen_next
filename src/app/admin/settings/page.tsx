// サイト設定画面（/admin/settings・管理者専用）。
// いまはトップページのリードテキストを編集できる。将来ほかの設定もここに足す。

import Link from 'next/link';
import { requireAdmin } from '@/auth/session';
import { getLeadText } from '@/db/settings';
import { LeadTextForm } from './settings-form';

export const metadata = {
  title: 'サイト設定｜30nen',
};

export default async function SettingsPage() {
  await requireAdmin();
  const leadText = await getLeadText();

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 px-4 py-12">
      <div className="w-full max-w-2xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h1 className="text-xl font-semibold text-zinc-900">サイト設定</h1>
          <Link
            href="/admin"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-700 transition-colors hover:bg-zinc-100"
          >
            投稿管理へ戻る
          </Link>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-6">
          <LeadTextForm initialValue={leadText} />
        </div>
      </div>
    </div>
  );
}
