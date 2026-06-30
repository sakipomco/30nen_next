// 本文HTML（記事の content）から画像を扱う小さなユーティリティ。
//  - firstContentImageSrc: 本文の「一番上の写真」の src を返す（無ければ null）。
//      → アイキャッチ未設定のとき、これを代表画像（一覧カード・SNSシェア用）に流用する。
//
// 本文は保存前に sanitize 済み（src/lib/sanitize.ts）なので、ここでは素直な
// <img ... src="..."> を正規表現で拾えば十分（DOMを使わずサーバー側でも動く）。

function* imageSrcs(html: string): Generator<string> {
  // <img の src 属性（シングル/ダブルクオート両対応）を順に取り出す。
  const re = /<img\b[^>]*?\bsrc\s*=\s*["']([^"']+)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    yield m[1];
  }
}

// 本文の一番上の画像の src（無ければ null）。
export function firstContentImageSrc(html: string | null | undefined): string | null {
  if (!html) return null;
  for (const src of imageSrcs(html)) return src;
  return null;
}
