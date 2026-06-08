'use client';
// お便りフォームの表示制御。トップページ（/）では出さず、それ以外のページで表示する。
// 現在のURLパスを見て出し分ける（クライアント側で判定）。
// recipients＝宛先プルダウンに並べる連載の一覧（レイアウトから受け取って ContactForm へ渡す）。

import { usePathname } from 'next/navigation';
import { ContactForm, type ContactRecipient } from './contact-form';

export function ContactFormSlot({
  recipients,
}: {
  recipients: ContactRecipient[];
}) {
  const pathname = usePathname();
  // トップページ（/）と、そのページ送り（/?page=2 などもパスは / ）では出さない。
  if (pathname === '/') return null;
  return <ContactForm recipients={recipients} />;
}
