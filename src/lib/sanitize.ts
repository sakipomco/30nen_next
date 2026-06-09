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
    'ul', 'ol', 'li',
    'blockquote',
    'a', 'img',
  ],
  allowedAttributes: {
    a: ['href', 'title', 'target', 'rel'],
    img: ['src', 'alt', 'title'],
  },
  // リンク・画像で許す URL の種類。javascript: などのスキームは弾く。
  allowedSchemes: ['http', 'https', 'mailto'],
  allowedSchemesByTag: { img: ['http', 'https', 'data'] },
  // 外部リンクは新しいタブで開き、rel を補って参照元漏れ・タブ乗っ取りを防ぐ。
  transformTags: {
    a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer' }),
  },
  // script/style の中身ごと破棄する（タグだけ消して中身を残さない）。
  disallowedTagsMode: 'discard',
};

// 記事本文HTMLを無害化して返す。on* イベント属性・script・javascript: URL などは除去される。
export function sanitizeArticleHtml(dirty: string): string {
  return sanitizeHtml(dirty, options);
}
