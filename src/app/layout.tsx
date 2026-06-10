import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "三十年商店",
    template: "%s｜三十年商店",
  },
  description: "20名以上の書き手が日々投稿する日記サイト「三十年商店」",
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
          href="https://fonts.googleapis.com/css2?family=Zen+Old+Mincho:wght@400;500;700;900&family=Noto+Serif+JP:wght@400;700&family=Noto+Sans+JP:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      {/* eslint-enable @next/next/no-page-custom-font */}
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
