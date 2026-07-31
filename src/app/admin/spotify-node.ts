// 本文エディタ(TipTap)に Spotify のプレイヤー埋め込みを扱わせるための拡張。
// YouTube 拡張の Spotify 版。曲・アルバム・プレイリスト・ポッドキャストを
// 「聴ける四角い枠」として本文に置ける。
//
// 保存されるHTMLは <iframe src="https://open.spotify.com/embed/…"> になる。
// 公開ページ側は src/lib/sanitize.ts で「open.spotify.com の /embed/ で始まる
// アドレスだけ」を通すようにしてある（それ以外のiframeは今までどおり全部消える）。

import { Node, mergeAttributes, nodePasteRule } from '@tiptap/core';
import { SPOTIFY_URL, toSpotifyEmbedUrl } from '@/lib/spotify';

export { toSpotifyEmbedUrl };

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    spotify: {
      /** 本文にSpotifyプレイヤーを挿入する。URLが読み取れなければ false を返す */
      setSpotify: (options: { src: string }) => ReturnType;
    };
  }
}

// 貼り付け検出用。末尾の ?si=… まで含めて丸ごと拾う
// （含めないと、URLの「?si=…」の部分だけが文字として取り残される）。
// g つき＝1回の貼り付けに複数あっても拾える。
const SPOTIFY_URL_GLOBAL = new RegExp(SPOTIFY_URL.source + '(?:\\?\\S*)?', 'g');

export const Spotify = Node.create({
  name: 'spotify',
  group: 'block',
  atom: true, // 中に文字を持たない「1かたまり」の部品
  draggable: true,

  addAttributes() {
    return {
      src: { default: null },
    };
  },

  parseHTML() {
    // 編集画面を開き直したときに、保存済みのiframeをこの部品として読み戻す。
    return [{ tag: 'iframe[src*="open.spotify.com/embed/"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    // 高さは指定しない＝globals.css で種類ごと（曲は低く・アルバムは高く）に決める。
    // loading="lazy"＝画面に出るまで読み込まない（表示を軽くする）。
    return [
      'iframe',
      mergeAttributes(HTMLAttributes, {
        frameborder: '0',
        loading: 'lazy',
        allow: 'clipboard-write; encrypted-media; fullscreen; picture-in-picture',
        title: 'Spotify',
      }),
    ];
  },

  addCommands() {
    return {
      setSpotify:
        (options) =>
        ({ commands }) => {
          const src = toSpotifyEmbedUrl(options.src);
          if (!src) return false;
          return commands.insertContent({ type: this.name, attrs: { src } });
        },
    };
  },

  addPasteRules() {
    // 本文にSpotifyのURLを貼り付けたら、そのままプレイヤーになる（YouTubeと同じ挙動）。
    // 文章の途中のリンクにしたいときは、文字を選んで「リンク」ボタンを使う。
    return [
      nodePasteRule({
        find: SPOTIFY_URL_GLOBAL,
        type: this.type,
        getAttributes: (match) => ({ src: toSpotifyEmbedUrl(match[0]) }),
      }),
    ];
  },
});
