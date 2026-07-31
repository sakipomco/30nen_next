// 記事本文HTMLの無害化（サニタイズ）係。
// 投稿フォーム(TipTap)から来たHTMLには、悪意あるタグやスクリプトが混ざりうる
// （画面の制限は飾りで、Server Action には改ざんHTMLを直接送れるため）。
// 公開ページは dangerouslySetInnerHTML で本文を表示するので、保存時と表示時に
// ここを必ず通し、許可したタグ・属性以外を取り除く（R-02 対策）。
//
// sanitize-html = HTMLを安全側に削ぎ落とす定番ライブラリ。
// 許可リスト(ホワイトリスト)方式：明示的に許したものだけ残し、それ以外は消す。

import sanitizeHtml from 'sanitize-html';

// 編集エディタ(TipTap StarterKit + Image)で作れる範囲のタグだけ許可する。
const options: sanitizeHtml.IOptions = {
  allowedTags: [
    'p', 'br', 'hr',
    'h2', 'h3',
    'strong', 'em', 's', 'u', 'code', 'pre',
    // グレー文字用。span は class="gray" のときだけ意味を持つ（下の allowedClasses 参照）。
    'span',
    'ul', 'ol', 'li',
    'blockquote',
    'a', 'img',
    'video', 'iframe',
  ],
  allowedAttributes: {
    a: ['href', 'title', 'target', 'rel'],
    img: ['src', 'alt', 'title'],
    // 動画（アップロードした mp4 の再生）。playsinline＝スマホで全画面にせずその場で再生。
    video: ['src', 'controls', 'playsinline', 'preload', 'muted', 'loop', 'poster', 'width', 'height'],
    // YouTube 埋め込み用。iframe 自体は下の allowedIframeHostnames で YouTube だけに限定する。
    iframe: ['src', 'width', 'height', 'allow', 'allowfullscreen', 'frameborder', 'title', 'loading', 'referrerpolicy'],
    // グレー文字。style は許さず（好きな見た目を差し込めると危ない）、決められた合図だけ通す。
    span: ['class'],
  },
  // span に付けてよい class は "gray" だけ。それ以外の class は取り除かれる。
  allowedClasses: { span: ['gray'] },
  // iframe の埋め込み元は YouTube と Spotify だけ許可（それ以外の iframe は丸ごと除去）。
  // Spotify はさらに下の exclusiveFilter で「/embed/ で始まるプレイヤー専用の入口」に限定する。
  allowedIframeHostnames: [
    'www.youtube.com',
    'youtube.com',
    'www.youtube-nocookie.com',
    'open.spotify.com',
  ],
  // リンク・画像で許す URL の種類。javascript: などのスキームは弾く。
  allowedSchemes: ['http', 'https', 'mailto'],
  allowedSchemesByTag: { img: ['http', 'https', 'data'], video: ['http', 'https'] },
  // 外部リンクは新しいタブで開き、rel を補って参照元漏れ・タブ乗っ取りを防ぐ。
  transformTags: {
    a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer' }),
  },
  // script/style の中身ごと破棄する（タグだけ消して中身を残さない）。
  disallowedTagsMode: 'discard',
  // iframe の追加チェック:
  //  ① src を失ったもの（許可外ドメインだった）は空の枠だけ残るので丸ごと消す。
  //  ② Spotify は「プレイヤー専用の入口（/embed/…）」以外を消す。
  //     ホスト名を許すだけだと Spotify の普通のページも埋め込めてしまうため、
  //     通り道をプレイヤーだけに狭めておく。
  exclusiveFilter: (frame) => {
    if (frame.tag !== 'iframe') return false;
    const src = frame.attribs.src;
    if (!src) return true;
    if (/^https?:\/\/open\.spotify\.com\//i.test(src)) {
      return !/^https:\/\/open\.spotify\.com\/embed\//i.test(src);
    }
    return false;
  },
};

// 記事本文HTMLを無害化して返す。on* イベント属性・script・javascript: URL などは除去される。
export function sanitizeArticleHtml(dirty: string): string {
  return sanitizeHtml(dirty, options);
}

// 本文HTMLから「文字だけ」を取り出し、指定の長さに切り詰める（関連記事の本文プレビュー用）。
// タグを全部落とし、改行・連続スペースを1個にまとめ、長すぎたら末尾に「…」を付ける。
export function textExcerpt(html: string, maxLength = 60): string {
  const text = sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} })
    .replace(/\s+/g, ' ')
    .trim();
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + '…';
}
