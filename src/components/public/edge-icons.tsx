// PC右端のSNS・メールアイコン（縦並び・右端の下のほうに固定）。仕様書 §14-C。
// Instagram / X は新しいタブ、メールはお問い合わせページ（同じタブ）。PC（lg以上）のみ表示。

import Image from 'next/image';
import Link from 'next/link';
import { SOCIAL_LINKS } from './nav-links';

const ICON_SIZE = 22;

export function EdgeIcons() {
  return (
    <div className="fixed bottom-6 right-4 z-30 hidden flex-col items-center gap-5 lg:flex">
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
        href={SOCIAL_LINKS.contact}
        aria-label="お問い合わせ"
        className="transition-opacity hover:opacity-60"
      >
        <Image src="/Icon_mail.svg" alt="お問い合わせ" width={ICON_SIZE} height={ICON_SIZE} unoptimized />
      </Link>
    </div>
  );
}
