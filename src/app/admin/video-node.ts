// 本文エディタ(TipTap)に <video> タグ（アップロードした動画）を扱わせるための拡張。
// 画像の Image 拡張の動画版。編集中はそのまま <video> として表示され、
// 保存されるHTMLも <video src="…" controls playsinline> になる
// （公開ページのサニタイズ許可リスト src/lib/sanitize.ts と対応）。

import { Node, mergeAttributes } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    video: {
      /** 本文に動画を挿入する。例: editor.commands.setVideo({ src: '/uploads/2026/07/x.mp4' }) */
      setVideo: (options: { src: string }) => ReturnType;
    };
  }
}

export const Video = Node.create({
  name: 'video',
  group: 'block',
  atom: true, // 中にテキストを持たない「1かたまり」の部品として扱う
  draggable: true,

  addAttributes() {
    return {
      src: { default: null },
      width: { default: null },
      height: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: 'video[src]' }];
  },

  renderHTML({ HTMLAttributes }) {
    // controls＝再生ボタン等を表示 / playsinline＝スマホで全画面にせずその場で再生
    // preload="metadata"＝開いた時は長さ・サイズ情報だけ読み込む（通信量の節約）
    return [
      'video',
      mergeAttributes(HTMLAttributes, {
        controls: 'true',
        playsinline: 'true',
        preload: 'metadata',
      }),
    ];
  },

  addCommands() {
    return {
      setVideo:
        (options) =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs: options }),
    };
  },
});
