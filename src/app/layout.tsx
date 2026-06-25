import type { Metadata } from "next";
import "./globals.css";
import { siteUrl, isIndexable } from "@/lib/site";

const SITE_NAME = "三十年商店";
const SITE_DESCRIPTION = "20名以上の書き手が日々投稿する日記サイト「三十年商店」";
const OG_IMAGE = "/30nen_logo_noren_plus.jpg";

export const metadata: Metadata = {
  // 相対パスのOG画像などを絶対URLに展開する基準。
  metadataBase: new URL(siteUrl()),
  title: {
    default: SITE_NAME,
    template: `%s｜${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  // 練習用/お試し（SITE_INDEXABLE≠true）のときは検索エンジンに載せない。
  robots: isIndexable() ? undefined : { index: false, follow: false },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "ja_JP",
    url: siteUrl(),
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [{ url: OG_IMAGE }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full antialiased">
      {/*
        フォントは Google Fonts CDN から読み込む（日本語フォントは巨大なため next/font/google より CDN が現実的）。
        App Router の root layout に書けばすべてのページに適用されるため、
        「pages/_document.js 以外は1ページのみ」という ESLint 警告は App Router では該当しない。
      */}
      {/* eslint-disable @next/next/no-page-custom-font */}
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Zen+Old+Mincho:wght@400;500;700;900&family=Noto+Serif+JP:wght@400;700&family=Zen+Kaku+Gothic+New:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      {/* eslint-enable @next/next/no-page-custom-font */}
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
