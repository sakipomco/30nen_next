'use client';
// SNS・メールの3アイコン（Instagram / X / メール）の中身だけをまとめた共通部品。仕様書 §14-C。
// 並べ方（縦／横）は使う側のコンテナで決める。ここは「3つのリンク」そのものだけを返す。
//  - PC: 右端に縦並びで固定（edge-icons.tsx）
//  - スマホ: ページ最下部に横並び（layout.tsx のフッター）
// メールの行き先は現在地で変える: トップはフォームが無いので /about のフォームへ、それ以外は同ページ内へ。

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SOCIAL_LINKS } from './nav-links';

export function SocialIcons({ size }: { size: number }) {
  const pathname = usePathname();
  const contactHref =
    pathname === '/' ? SOCIAL_LINKS.contactFromTop : SOCIAL_LINKS.contactAnchor;

  return (
    <>
      <a
        href={SOCIAL_LINKS.instagram}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Instagram"
        className="transition-opacity hover:opacity-60"
      >
        <Image src="/Icon_insta.svg" alt="Instagram" width={size} height={size} unoptimized />
      </a>
      <a
        href={SOCIAL_LINKS.x}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="X"
        className="transition-opacity hover:opacity-60"
      >
        <Image src="/Icon_x.svg" alt="X" width={size} height={size} unoptimized />
      </a>
      <Link
        href={contactHref}
        aria-label="お便りフォーム"
        className="transition-opacity hover:opacity-60"
      >
        <Image src="/Icon_mail.svg" alt="お問い合わせ" width={size} height={size} unoptimized />
      </Link>
    </>
  );
}
