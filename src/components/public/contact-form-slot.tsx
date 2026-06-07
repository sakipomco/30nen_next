'use client';
// お便りフォームの表示制御。トップページ（/）では出さず、それ以外のページで表示する。
// 現在のURLパスを見て出し分ける（クライアント側で判定）。

import { usePathname } from 'next/navigation';
import { ContactForm } from './contact-form';

export function ContactFormSlot() {
  const pathname = usePathname();
  // トップページ（/）と、そのページ送り（/?page=2 などもパスは / ）では出さない。
  if (pathname === '/') return null;
  return <ContactForm />;
}
