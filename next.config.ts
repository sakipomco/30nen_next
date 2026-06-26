import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // アップロード画像は upload API で長辺1600pxへ縮小・最適化済み（src/lib/image.ts）。
  // Next.js 内蔵の画像最適化は使わず、Nginx の /uploads/ 直接配信に任せる。
  // 理由: next/image の最適化エンドポイントが、起動後にアップロードされたファイルを
  // 「received null」で読めない問題があり、アイキャッチ・連載画像が表示されなくなる。
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
