// PC左端の縦書きメニュー（1本の縦帯・上→下）。仕様書 §14-B。
// 各項目を縦書き（writing-mode）にし、上から順に積む。PC（lg以上）のみ表示。

import Link from 'next/link';
import { PAGE_LINKS } from './nav-links';
import { renderHiraTight } from './hira-tight';

export function EdgeNav() {
  return (
    <nav className="fixed bottom-0 left-4 top-0 z-30 hidden flex-col justify-end border-r border-[#150c0c]/50 pb-6 pr-4 lg:flex">
      <ul className="flex flex-col gap-6">
        {PAGE_LINKS.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="serif [writing-mode:vertical-rl] text-sm text-[#333] transition-opacity hover:opacity-60"
            >
              {renderHiraTight(link.label)}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
