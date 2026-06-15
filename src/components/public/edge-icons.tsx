'use client';
// PC右端のSNS・メールアイコン（縦並び・右端の下のほうに固定）。仕様書 §14-C。
// Instagram / X は新しいタブ、メールは左コラムの「お便りフォーム」へ誘導（同じタブ）。PC（lg以上）のみ表示。
// メールの行き先は現在地で変える: トップはフォームが無いので /about のフォームへ、それ以外は同ページ内へ。

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SOCIAL_LINKS } from './nav-links';

const ICON_SIZE = 18; // 元22pxの約80%

export function EdgeIcons() {
  const pathname = usePathname();
  const contactHref =
    pathname === '/' ? SOCIAL_LINKS.contactFromTop : SOCIAL_LINKS.contactAnchor;

  return (
    <div className="fixed bottom-0 right-4 top-0 z-30 hidden flex-col items-center justify-end gap-5 border-l border-[#150c0c]/50 pb-[29px] pl-4 lg:flex">
      <a
        href={SOCIAL_LINKS.instagram}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Instagram"
        className="transition-opacity hover:opacity-60"
      >
        <Image src="/Icon_insta.svg" alt="Instagram" width={ICON_SIZE} height={ICON_SIZE} unoptimized />
      </a>
      <a
        href={SOCIAL_LINKS.x}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="X"
        className="transition-opacity hover:opacity-60"
      >
        <Image src="/Icon_x.svg" alt="X" width={ICON_SIZE} height={ICON_SIZE} unoptimized />
      </a>
      <Link
        href={contactHref}
        aria-label="お便りフォーム"
        className="transition-opacity hover:opacity-60"
      >
        <Image src="/Icon_mail.svg" alt="お問い合わせ" width={ICON_SIZE} height={ICON_SIZE} unoptimized />
      </Link>
    </div>
  );
}
