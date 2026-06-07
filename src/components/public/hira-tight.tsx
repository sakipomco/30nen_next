// 文字列のうち「ひらがなの連なり」だけを <span class="hira-tight"> で包み、
// その部分の字間（letter-spacing）だけを詰める（現行サイト風の字詰め）。
// 改行(\n)はそのまま残るので、表示側の whitespace-pre-line で1行ずつ表示できる。
// リード文（sidebar-left）と左端メニュー（edge-nav）で共用。

import type { ReactNode } from 'react';

export function renderHiraTight(text: string): ReactNode[] {
  const isHiragana = (ch: string) => /[ぁ-ゟ]/.test(ch);
  const nodes: ReactNode[] = [];
  let buf = '';
  let bufIsHira = false;
  const flush = (key: number) => {
    if (!buf) return;
    nodes.push(
      bufIsHira ? (
        <span key={key} className="hira-tight">
          {buf}
        </span>
      ) : (
        buf
      ),
    );
    buf = '';
  };
  for (let i = 0; i < text.length; i++) {
    const hira = isHiragana(text[i]);
    if (buf && hira !== bufIsHira) flush(i);
    bufIsHira = hira;
    buf += text[i];
  }
  flush(text.length);
  return nodes;
}
