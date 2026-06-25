// サイトの公開URLとSEOの基本設定。sitemap・robots・OGP・canonical で絶対URLが要るため一元化する。
// 値は環境変数で差し替え（.env.example 参照）。

// 本番切替後の最終ドメイン。SITE_URL 未設定時の既定。
const FALLBACK_SITE_URL = 'https://30nen.com';

// サイトの公開URL（末尾スラッシュなし）。
export function siteUrl(): string {
  return (process.env.SITE_URL || FALLBACK_SITE_URL).replace(/\/+$/, '');
}

// 検索エンジンにインデックスさせてよいか。
// 既定は false（＝練習用/お試しサイトを誤ってGoogleに載せない安全側）。
// 本番サーバーだけ環境変数 SITE_INDEXABLE=true を設定する。
export function isIndexable(): boolean {
  return process.env.SITE_INDEXABLE === 'true';
}

// サイト内パス（"/about" など）を絶対URLにする。
export function absoluteUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${siteUrl()}${p}`;
}

// HTMLや改行を除いた、メタ説明文（og:description 等）用の短いテキストを作る。
export function toMetaDescription(
  source: string | null | undefined,
  maxLen = 120,
): string {
  const text = (source ?? '')
    .replace(/<[^>]*>/g, ' ') // タグ除去
    .replace(/\s+/g, ' ') // 連続空白をまとめる
    .trim();
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 1).trimEnd() + '…';
}
