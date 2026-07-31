// 旧WordPressから移行したときに失われた「Spotifyのプレイヤー」を復元するスクリプト。
//
// ▼ なぜ必要か
// WordPress には「URLを1行だけ書くと、自動でプレイヤーに化ける」仕組み（oEmbed）があり、
// 書き手がそれを使っていた。移行後はその行が「ただの文字列」として残り、プレイヤーが消えていた。
// また1記事だけ、WPで直接iframeを貼っていたものがあり、こちらは無害化で丸ごと消えて
// 空の段落だけが残っていた。
//
// ▼ 何をするか
//  A. 段落の中身がSpotifyのURLだけ（<p>https://open.spotify.com/…</p>）→ プレイヤーに置き換える
//  B. 記事 wp_id=4454 → 消えたiframeがあった位置（残っている空段落）にプレイヤーを戻す
// 文章の途中に貼られているリンクには触らない（今までどおり動いているため）。
//
// ▼ 使い方（既定は下読みだけ。実際に書き換えるのは --apply を付けたときだけ）
//   npx tsx scripts/restore-spotify-embeds.ts                    … 何が変わるかを表示するだけ
//   DB_PATH=/var/www/30nen_next/data/30nen.db npx tsx scripts/restore-spotify-embeds.ts --apply
//
// 何度実行しても結果は同じ（すでにプレイヤーになっている記事は対象にならない）。

import Database from 'better-sqlite3';
import { toSpotifyEmbedUrl, spotifyIframeHtml } from '../src/lib/spotify';

const DB_PATH = process.env.DB_PATH ?? 'data/30nen.db';
const APPLY = process.argv.includes('--apply');

// 段落の中身がSpotifyのURLだけの箇所（前後の空白や <br /> は許す）
const BARE_PARAGRAPH =
  /<p>(?:\s|<br\s*\/?>)*((?:https?:\/\/)open\.spotify\.com\/[^\s<"]+)(?:\s|<br\s*\/?>)*<\/p>/gi;

// B の記事（WPで直接iframeを貼っていた1件）。空段落を目印にして戻す。
const DIRECT_IFRAME = {
  wpId: 4454,
  // この文のすぐ後ろにあった空段落が、消えたプレイヤーの跡地
  anchor: '運がキレキレで物たちがめぐりめぐってくる日であった。',
  embedUrl: 'https://open.spotify.com/embed/album/2RjQvuEN9K9IwxZxi4JCTK',
};

type Change = { id: number; title: string; count: number; urls: string[] };

function restoreBareParagraphs(content: string): { html: string; urls: string[] } {
  const urls: string[] = [];
  const html = content.replace(BARE_PARAGRAPH, (whole, url: string) => {
    // HTMLの &amp; を素の & に戻してから読み取る（?si=…&pi=… の形が混じるため）
    const embed = toSpotifyEmbedUrl(url.replace(/&amp;/g, '&'));
    if (!embed) return whole; // 読み取れないものは触らない
    urls.push(embed);
    return spotifyIframeHtml(embed);
  });
  return { html, urls };
}

function restoreDirectIframe(content: string): { html: string; urls: string[] } {
  const at = content.indexOf(DIRECT_IFRAME.anchor);
  if (at === -1) return { html: content, urls: [] };
  if (content.includes(DIRECT_IFRAME.embedUrl)) return { html: content, urls: [] }; // 復元済み
  // 目印の後ろにある最初の空段落（プレイヤーの跡地）を差し替える
  const EMPTY_P = /<p>(?:\s|<br\s*\/?>)*<\/p>/i;
  const rest = content.slice(at);
  const m = rest.match(EMPTY_P);
  if (!m || m.index === undefined) return { html: content, urls: [] };
  const start = at + m.index;
  const html =
    content.slice(0, start) +
    spotifyIframeHtml(DIRECT_IFRAME.embedUrl) +
    content.slice(start + m[0].length);
  return { html, urls: [DIRECT_IFRAME.embedUrl] };
}

function main() {
  const db = new Database(DB_PATH);
  const rows = db
    .prepare(
      "select id, wp_id as wpId, title, content from articles where content like '%open.spotify.com%' or wp_id = ?",
    )
    .all(DIRECT_IFRAME.wpId) as {
    id: number;
    wpId: number | null;
    title: string;
    content: string;
  }[];

  const changes: Change[] = [];
  const update = db.prepare('update articles set content = ? where id = ?');

  for (const row of rows) {
    let html = row.content;
    const urls: string[] = [];

    const a = restoreBareParagraphs(html);
    html = a.html;
    urls.push(...a.urls);

    if (row.wpId === DIRECT_IFRAME.wpId) {
      const b = restoreDirectIframe(html);
      html = b.html;
      urls.push(...b.urls);
    }

    if (html !== row.content) {
      changes.push({ id: row.id, title: row.title, count: urls.length, urls });
      if (APPLY) update.run(html, row.id);
    }
  }

  const total = changes.reduce((n, c) => n + c.count, 0);
  console.log(`DB: ${DB_PATH}`);
  console.log(APPLY ? '=== 実行（書き換えました） ===' : '=== 下読み（書き換えていません） ===');
  for (const c of changes) {
    console.log(`  記事 ${c.id}「${c.title}」… ${c.count}か所`);
    for (const u of c.urls) console.log(`      ${u}`);
  }
  console.log(`\n合計 ${changes.length}記事 / ${total}か所`);
  if (!APPLY) console.log('※ 実際に書き換えるには --apply を付けて実行してください。');
  db.close();
}

main();
