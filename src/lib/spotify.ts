// SpotifyのURL関連のはたらき（投稿エディタと、移行データの復元スクリプトの両方から使う）。
// ここは画面まわりの部品に依存しない素の関数だけを置く。

/** 通常のSpotifyのURL。/intl-ja/ のような言語つきも受ける。 */
export const SPOTIFY_URL =
  /https?:\/\/open\.spotify\.com\/(?:intl-[a-z-]+\/)?(track|album|playlist|episode|show|artist)\/([A-Za-z0-9]+)/;

/**
 * SpotifyのURLを「プレイヤー専用アドレス」に変換する。
 * 読み取れないURLなら null。すでに /embed/ の形ならそのまま整えて返す。
 */
export function toSpotifyEmbedUrl(url: string): string | null {
  const trimmed = url.trim();
  const embedded = trimmed.match(
    /^https?:\/\/open\.spotify\.com\/embed\/(track|album|playlist|episode|show|artist)\/([A-Za-z0-9]+)/,
  );
  if (embedded) return `https://open.spotify.com/embed/${embedded[1]}/${embedded[2]}`;

  const m = trimmed.match(SPOTIFY_URL);
  if (!m) return null;
  return `https://open.spotify.com/embed/${m[1]}/${m[2]}`;
}

/**
 * 本文HTMLに差し込むプレイヤーのタグ。
 * エディタが書き出す形（src/app/admin/spotify-node.ts の renderHTML）と同じにしておく＝
 * 復元した記事を編集画面で開いても、同じ部品として読み戻せる。
 */
export function spotifyIframeHtml(embedUrl: string): string {
  return (
    `<iframe src="${embedUrl}" frameborder="0" loading="lazy" ` +
    `allow="clipboard-write; encrypted-media; fullscreen; picture-in-picture" title="Spotify"></iframe>`
  );
}
