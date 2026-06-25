// WordPressの記事データを新システム用に整形する部品。
//  1. wpautop … WPは本文を「素のテキスト＋空行」で保存している（段落<p>は表示時に自動生成）。
//     新システム(TipTap)はHTMLをそのまま表示するので、ここで空行→<p>、単一改行→<br> に変換する。
//  2. 画像URLの書き換え … 本文中の絶対URL(https://30nen.com/wp-content/uploads/…) を
//     新サイトの相対パス(/uploads/…) に置き換える（S5）。
//  3. サニタイズ … 投稿時と同じ許可リストに通し、許可外のタグ・属性(class/width等)を落とす。
//  4. 日時 … WPの post_date(日本時間) を DB保存用の UTC へ変換する。

import { sanitizeArticleHtml } from '../../src/lib/sanitize';
import { jstInputToUtc } from '../../src/lib/datetime';

// 旧サイトの画像ベースURL（http/https・www有無を吸収）。グループ1は後続パス。
const WP_UPLOADS_RE = /https?:\/\/(?:www\.)?30nen\.com\/wp-content\/uploads\//gi;

// HEIC/HEIF（iPhone形式）はブラウザで表示できないことがあるため、移行時にJPEGへ変換する。
// パス/URL末尾の .heic/.heif を .jpg に置き換える（実ファイルの変換は移行スクリプトの placeImage 側）。
export function heicToJpgPath(path: string): string {
  return path.replace(/\.(?:heic|heif)$/i, '.jpg');
}

// 本文中の画像URLを新サイトの相対パスへ書き換える。
//   https://30nen.com/wp-content/uploads/2026/05/x.jpg → /uploads/2026/05/x.jpg
//   さらに /uploads/…/x.heic → /uploads/…/x.jpg（HEICはJPEGへ）。
// 注意: 拡張子は「URLの末尾」だけを対象にする（途中に "IMG.HEICのコピー.jpg" のような
// ファイル名があっても誤変換しない）。URLの終わりは引用符・空白・閉じ括弧で判定。
export function rewriteImageUrls(html: string): string {
  let out = html.replace(WP_UPLOADS_RE, '/uploads/');
  out = out.replace(/(\/uploads\/[^\s"')]+?)\.(?:heic|heif)(?=["')\s]|$)/gi, '$1.jpg');
  return out;
}

// すでにブロック要素で始まる塊は <p> で包まない（包むと二重になる）。
const BLOCK_START_RE =
  /^<\/?(?:p|div|ul|ol|li|blockquote|h[1-6]|hr|pre|table|thead|tbody|tr|td|th|figure|figcaption)[\s/>]/i;

// WordPress の wpautop 相当（簡易版）。
//  - 空行（連続改行）で段落に分割
//  - 中身が空白／&nbsp; だけの段落は捨てる（WPの見た目スペーサー）
//  - すでにブロック要素の塊はそのまま、それ以外は <p>…</p> で包む
//  - 段落内の単一改行は <br /> に
export function wpautop(raw: string): string {
  let s = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  // [caption]…[/caption] ショートコードはタグだけ除去し中身(img＋説明)は残す
  s = s.replace(/\[caption[^\]]*\]/gi, '').replace(/\[\/caption\]/gi, '');

  const out: string[] = [];
  for (let block of s.split(/\n{2,}/)) {
    block = block.trim();
    if (!block) continue;
    const textOnly = block.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, '').trim();
    const hasMedia = /<img\b/i.test(block);
    if (!textOnly && !hasMedia) continue; // 空・スペーサー段落は捨てる
    if (BLOCK_START_RE.test(block)) {
      out.push(block); // すでにブロック要素
    } else {
      out.push('<p>' + block.replace(/\n/g, '<br />') + '</p>');
    }
  }
  return out.join('\n');
}

// 本文HTMLの総仕上げ: wpautop → 画像URL書き換え → サニタイズ。
export function transformContent(rawHtml: string): string {
  return sanitizeArticleHtml(rewriteImageUrls(wpautop(rawHtml)));
}

// WPの公開状態 'publish' → 新システムの 'published'。それ以外は 'draft' 扱い。
export function wpStatusToStatus(postStatus: string): 'published' | 'draft' {
  return postStatus.trim() === 'publish' ? 'published' : 'draft';
}

// WPの post_date（日本時間 'YYYY-MM-DD HH:MM:SS'）→ DB保存用UTC 'YYYY-MM-DD HH:MM:SS'。
export function wpDateToUtc(postDate: string): string {
  const v = postDate.trim();
  if (!v || v.startsWith('0000')) return ''; // 無効日時
  return jstInputToUtc(v.replace(' ', 'T'));
}

// WPの post_name(slug) はURLエンコード済みの日本語が入っている（例: "%c2%a50-%e9%b3%a9…"）。
// これを「人が読める形」（例: "¥0-鳩サブレ（いただきもの）"）に復号して保存する。
//   理由: Next.jsはURLの slug パラメータを自動で復号して渡すため、DBにも復号後で持つと
//         照合が一致する。昔の符号化URL（%xx形）でアクセスされてもNextが復号して同じ値になり、
//         旧リンク・検索結果も切れない（URLの継続性は保たれる）。
// 壊れた符号化（復号に失敗する文字列）はそのまま使う（移行を止めない）。
export function normalizeSlug(postName: string): string {
  const raw = (postName ?? '').trim();
  if (!raw) return '';
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}
