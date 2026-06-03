// PC左端の縦書きメニュー（1本の縦帯・上→下）。仕様書 §14-B。
// 各項目を縦書き（writing-mode）にし、上から順に積む。PC（lg以上）のみ表示。

import Link from 'next/link';
import { PAGE_LINKS } from './nav-links';

export function EdgeNav() {
  return (
    <nav className="fixed left-0 top-1/2 z-30 hidden -translate-y-1/2 pl-3 lg:block">
      <ul className="flex flex-col gap-6">
        {PAGE_LINKS.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="serif [writing-mode:vertical-rl] text-sm tracking-[0.15em] text-[#333] transition-opacity hover:opacity-60"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
