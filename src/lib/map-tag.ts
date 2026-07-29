// 記事本文の「地図の記法」を、折りたたみの地図ブロックに置き換える係。
//
// 書き手は本文にこう書く:
//     [MAP:2025欧州]
// 読者にはこう出る:
//     🗺 旅の全行程マップを見る   ← 押すと地図が開く
//
// ★ 適用する順番が大事 ★
//   本文HTMLは sanitizeArticleHtml()（src/lib/sanitize.ts）で「許可したタグ以外は消す」
//   処理を通している。折りたたみに使う <details> は許可リストに入っていないため、
//   **無害化する前に置き換えると消えてしまう**。
//   そこで「無害化したあと」に、ここで組み立てたHTMLを差し込む。
//   差し込む値はDBから引いた画像パスと名札だけで、本文の文字列は属性に入れない
//   （名札は表示用にエスケープしてから使う）。

// 本文から名札を拾うための記法。名札に [ ] と改行は使えない（登録時に弾いている）。
const MAP_TAG = /\[MAP:([^[\]\r\n]{1,30})\]/g;

// 段落まるごとが記法だけ、という想定どおりの書き方にあたるもの。
// <p>[MAP:2025欧州]</p> ／ 前後に空白や &nbsp; があっても拾う。
const MAP_PARAGRAPH = /<p>(?:\s|&nbsp;)*\[MAP:([^[\]\r\n]{1,30})\](?:\s|&nbsp;)*<\/p>/g;

// HTMLに入れて安全な形に直す（属性・本文どちらに入れても壊れないように）。
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// 本文に出てくる地図の名札を、重複なく取り出す。
// これで「記事に出てくるぶんだけ」DBに聞ける（地図が無い記事はDBを触らない）。
export function extractMapNames(html: string): string[] {
  const names = new Set<string>();
  for (const m of html.matchAll(MAP_TAG)) names.add(m[1].trim());
  return [...names];
}

// ボタンの文字。全部の地図で同じ文言に統一する（SAKIさん指定 2026-07-29）。
const BUTTON_LABEL = 'MAPを見る';

// 折りたたみブロックのHTML。
//  - 閉じた <details> の中身は表示されないので、loading="lazy" と合わせて
//    **押されるまで画像は読み込まれない**（記事は軽いまま）。
//  - <summary> がボタンの見た目になる（スタイルは globals.css の .map-details）。
function detailsHtml(name: string, imagePath: string): string {
  const alt = escapeHtml(`${name} 旅の全行程マップ`);
  const src = escapeHtml(imagePath);
  return (
    `<details class="map-details">` +
    `<summary>${BUTTON_LABEL}</summary>` +
    `<img src="${src}" alt="${alt}" loading="lazy" decoding="async">` +
    `</details>`
  );
}

// 名札が棚に無かったときの扱い。
//  - 公開ページ: 何も出さない（読者に [MAP:…] の生文字を見せない）
//  - 下書きプレビュー: 赤字で知らせる（打ち間違いに公開前に気づける）
function missingHtml(name: string, forPreview: boolean): string {
  if (!forPreview) return '';
  return (
    `<p class="map-missing">⚠ 「${escapeHtml(name)}」という名前の地図は登録されていません。` +
    `名前のまちがいか、管理画面の「旅の地図」で登録が必要です。` +
    `（この注意書きは下書きプレビューにだけ出ます）</p>`
  );
}

/**
 * 本文HTMLの [MAP:名札] を折りたたみの地図ブロックに置き換える。
 * 必ず sanitizeArticleHtml() を通した**あと**に呼ぶこと。
 *
 * @param html   無害化済みの本文HTML
 * @param paths  名札 → 画像パス の対応表（src/db/maps.ts の getMapPathsByNames）
 * @param opts   forPreview=true で、未登録の名札に注意書きを出す（下書きプレビュー用）
 */
export function renderMapTags(
  html: string,
  paths: Map<string, string>,
  opts: { forPreview?: boolean } = {},
): string {
  if (!html.includes('[MAP:')) return html; // 地図の記法が無ければ何もしない
  const forPreview = opts.forPreview ?? false;

  const replace = (name: string): string => {
    const trimmed = name.trim();
    const imagePath = paths.get(trimmed);
    return imagePath
      ? detailsHtml(trimmed, imagePath)
      : missingHtml(trimmed, forPreview);
  };

  // ① 想定どおりの書き方（段落まるごとが記法だけ）を、段落ごと置き換える。
  //    <p> の中に <details> を入れるとHTMLとして正しくないので、<p> を丸ごと差し替える。
  let out = html.replace(MAP_PARAGRAPH, (_m, name: string) => replace(name));

  // ② 段落の途中に混ざっている場合の保険。文章の中に置かれても地図は出す。
  //    （ブラウザが段落を自動で閉じるので、前後の文章が消えることはない）
  out = out.replace(MAP_TAG, (_m, name: string) => replace(name));

  return out;
}
