// WordPressの記事データを新システム用に整形する部品。
//  1. wpautop … WPは本文を「素のテキスト＋空行」で保存している（段落<p>は表示時に自動生成）。
//     新システム(TipTap)はHTMLをそのまま表示するので、ここで空行→<p>、単一改行→<br> に変換する。
//  2. 画像URLの書き換え … 本文中の絶対URL(https://30nen.com/wp-content/uploads/…) を
//     新サイトの相対パス(/uploads/…) に置き換える（S5）。
//  3. サニタイズ … 投稿時と同じ許可リストに通し、許可外のタグ・属性(class/width等)を落とす。
//  4. 日時 … WPの post_date(日本時間) を DB保存用の UTC へ変換する。

import { sanitizeArticleHtml } from '../../src/lib/sanitize';
import { jstInputToUtc } from '../../src/lib/datetime';

// 旧サイトの画像ベースURL（http/https・www有無・Xサーバー初期ドメインを吸収）。
const WP_UPLOADS_RE =
  /https?:\/\/(?:(?:www\.)?30nen\.com|the30nen\.xsrv\.jp)\/wp-content\/uploads\//gi;

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

// ---- 動画まわりの変換 -------------------------------------------------------
// 旧WordPressでは動画は2通りの書き方で本文に入っている：
//  A. [video mp4="…"][/video] … WP独自の「ショートコード」。WPが表示時に<video>タグへ
//     変換していたが、新システムは変換しないため文字のまま見えてしまう。
//  B. YouTubeのURLを「それだけの行」で貼る … WPが自動で埋め込みプレーヤーにしていた（oEmbed）。
// ここで A → <video>タグ、B → YouTube埋め込み(iframe) に変換して、新システムでも再生できるようにする。

// YouTubeの視聴URLから動画ID・開始秒を取り出し、埋め込み用URLに組み立てる。
// 対応形: youtube.com/watch?v=ID / youtu.be/ID / youtube.com/shorts|live|embed/ID
// 判別できないURLは null（変換しない）。
export function youtubeEmbedUrl(rawUrl: string): string | null {
  let u: URL;
  try {
    u = new URL(rawUrl.replace(/&amp;/g, '&')); // HTML内の &amp; を & に戻してから解釈
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^(?:www|m)\./, '');
  let id = '';
  if (host === 'youtu.be') {
    id = u.pathname.slice(1).split('/')[0] ?? '';
  } else if (host === 'youtube.com') {
    if (u.pathname === '/watch') {
      id = u.searchParams.get('v') ?? '';
    } else {
      const m = /^\/(?:shorts|live|embed)\/([^/]+)/.exec(u.pathname);
      if (m) id = m[1];
    }
  }
  if (!/^[A-Za-z0-9_-]{6,20}$/.test(id)) return null;
  // 「途中から再生」の指定（t=1m30s など）を埋め込み用の start=秒 に引き継ぐ
  const t = u.searchParams.get('t') ?? u.searchParams.get('start') ?? '';
  const m = /^(?:(\d+)h)?(?:(\d+)m)?(\d+)s?$|^(\d+)$/.exec(t);
  const sec = m
    ? m[4]
      ? Number(m[4])
      : Number(m[1] ?? 0) * 3600 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0)
    : 0;
  // youtube-nocookie.com ＝ YouTube公式の「プライバシー強化モード」用ドメイン（再生するまでCookieを置かない）
  return `https://www.youtube-nocookie.com/embed/${id}${sec > 0 ? `?start=${sec}` : ''}`;
}

// YouTube埋め込みの iframe タグを組み立てる（サニタイズの許可リストと対応）。
function youtubeIframe(embedUrl: string): string {
  return (
    `<iframe src="${embedUrl}" title="YouTube video" ` +
    'allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" ' +
    'allowfullscreen loading="lazy" referrerpolicy="strict-origin-when-cross-origin"></iframe>'
  );
}

// [video …] ショートコード（終了タグ [/video] は有無どちらでも）
const VIDEO_SHORTCODE_RE = /\[video\b([^\]]*)\]\s*(?:\[\/video\])?/gi;
// [embed]URL[/embed] ショートコード
const EMBED_SHORTCODE_RE = /\[embed[^\]]*\]\s*([^\s<>[\]]+)\s*\[\/embed\]/gi;
// 「それだけの行（段落）」に貼られた YouTube URL。前が 行頭・改行・<p>・<br>、
// 後ろが 行末・改行・</p>・<br> のものだけ対象（文章の途中やリンク内のURLは触らない）。
const BARE_YOUTUBE_RE =
  /(^|\n|<p>|<br \/>|<br\/>|<br>)(\s*)(https?:\/\/(?:www\.|m\.)?(?:youtube\.com|youtu\.be)\/[^\s<>"[\]]+)(?=\s*(?:$|\n|<\/p>|<br))/g;

// 本文中の動画表現を、新システムで再生できるHTMLへ変換する。
export function convertVideoEmbeds(html: string): string {
  // A. [video mp4="…"] → <video>。幅・高さが書いてあれば引き継ぐ（縦横比の維持に使う）。
  let out = html.replace(VIDEO_SHORTCODE_RE, (whole, attrs: string) => {
    const src = /(?:mp4|m4v|webm|ogv|src)="([^"]+)"/i.exec(attrs)?.[1];
    if (!src) return whole; // 動画URLが読み取れない場合は原文のまま残す（情報を消さない）
    const w = /\bwidth="(\d+)"/i.exec(attrs)?.[1];
    const h = /\bheight="(\d+)"/i.exec(attrs)?.[1];
    return (
      `<video src="${src}" controls playsinline preload="metadata"` +
      (w ? ` width="${w}"` : '') +
      (h ? ` height="${h}"` : '') +
      '></video>'
    );
  });
  // B-1. [embed]URL[/embed] → YouTubeなら埋め込み、それ以外は普通のリンクに。
  out = out.replace(EMBED_SHORTCODE_RE, (whole, url: string) => {
    const embed = youtubeEmbedUrl(url);
    return embed ? youtubeIframe(embed) : `<a href="${url}">${url}</a>`;
  });
  // B-2. 行に単独で貼られた YouTube URL → 埋め込み（旧WPの自動埋め込みの再現）。
  out = out.replace(BARE_YOUTUBE_RE, (whole, prefix: string, ws: string, url: string) => {
    const embed = youtubeEmbedUrl(url);
    return embed ? `${prefix}${ws}${youtubeIframe(embed)}` : whole;
  });
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

// 本文HTMLの総仕上げ: wpautop → 画像URL書き換え → 動画変換 → サニタイズ。
export function transformContent(rawHtml: string): string {
  return sanitizeArticleHtml(convertVideoEmbeds(rewriteImageUrls(wpautop(rawHtml))));
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
