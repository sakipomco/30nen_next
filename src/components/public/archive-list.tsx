// アーカイブ（目次）＝公開記事を「年月（件数）」で並べる。新しい月が上。
// クリックでその月の月別アーカイブページ（/archive/2026-06）へ飛ぶ。
// 右サイドバー・ハンバーガーメニュー内の両方でこの中身を使う。

import Link from 'next/link';
import type { ArchiveMonth } from '@/db/articles';

export function ArchiveList({ months }: { months: ArchiveMonth[] }) {
  if (months.length === 0) {
    return <p className="text-xs text-[#808080]">まだ記事がありません。</p>;
  }
  return (
    <ul className="space-y-0.5 text-[0.8rem] text-[#333]">
      {months.map((m) => (
        <li key={`${m.year}-${m.month}`}>
          <Link
            href={`/archive/${m.year}-${String(m.month).padStart(2, '0')}`}
            className="transition-opacity hover:opacity-60"
          >
            <span>{m.year}年</span>
            {/* 月の数字を固定幅・右そろえにして、1桁/2桁でも「月」が縦ラインでそろうように */}
            <span className="inline-block w-[1.4em] text-right tabular-nums">
              {m.month}
            </span>
            <span>月</span>
            <span className="text-[0.7rem] text-[#808080]">（{m.count}）</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
