// 画像を「軽く」する共通部品。投稿時のアップロード（/api/upload）と、
// 記事移行スクリプト（scripts/migrate-articles.ts）の両方がここを使う。
// → 新規投稿の写真と、移行で運んだ写真が「まったく同じ基準」で軽くなる。

import sharp from 'sharp';

// 写真をこの長さ（px）まで縮める。ブログ表示にはこれで十分で、ファイルが大幅に軽くなる。
export const MAX_DIMENSION = 1600;

// 写真を「軽く」する：向き補正（EXIF）→ 長辺1600pxまで縮小（元が小さければそのまま）→ 圧縮。
// GIFはアニメーション（パラパラ動く）を壊さないよう、加工せずそのまま返す。
export async function shrinkImage(input: Buffer, mime: string): Promise<Buffer> {
  if (mime === 'image/gif') return input;

  const pipeline = sharp(input)
    .rotate() // スマホ写真の「横向き」などをEXIF情報どおりに正す
    .resize(MAX_DIMENSION, MAX_DIMENSION, {
      fit: 'inside', // 縦横比はそのまま、枠に収まるように縮める
      withoutEnlargement: true, // 元が小さい画像は引き伸ばさない
    });

  if (mime === 'image/png') return pipeline.png({ compressionLevel: 9 }).toBuffer();
  if (mime === 'image/webp') return pipeline.webp({ quality: 80 }).toBuffer();
  // それ以外（JPEG）
  return pipeline.jpeg({ quality: 80, mozjpeg: true }).toBuffer();
}

// ファイル名の拡張子から画像の種類（MIMEタイプ）を推測する。
// 移行スクリプトはファイル名しか手元に無いので、ここで種類を判定して shrinkImage に渡す。
// 対応外の拡張子は null（＝縮小せずそのまま置く判断に使う）。
export function mimeFromExtension(filename: string): string | null {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  switch (ext) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'gif':
      return 'image/gif';
    case 'webp':
      return 'image/webp';
    default:
      return null;
  }
}
