// 本文の一部を「グレー文字」にするための拡張（太字・斜体と同じ仲間＝マーク）。
//
// 旧WordPressでは <span style="color: #999999"> と直接色を書いていたが、
// 新システムは安全のため style 属性を許していない（好きな見た目を差し込めると危ないため）。
// そこで「グレー」という決まった1色だけを class で表し、色の値はCSS側で持つ。
// 保存されるHTMLは <span class="gray">…</span>（src/lib/sanitize.ts で span.gray だけ許可）。

import { Mark, mergeAttributes } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    gray: {
      /** 選んだ文字をグレーにする／戻す */
      toggleGray: () => ReturnType;
    };
  }
}

export const Gray = Mark.create({
  name: 'gray',

  parseHTML() {
    return [{ tag: 'span.gray' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, { class: 'gray' }), 0];
  },

  addCommands() {
    return {
      toggleGray:
        () =>
        ({ commands }) =>
          commands.toggleMark(this.name),
    };
  },
});
