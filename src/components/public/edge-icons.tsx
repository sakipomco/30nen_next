'use client';
// PC右端のSNS・メールアイコン（縦並び・右端の下のほうに固定）。仕様書 §14-C。
// アイコンの中身は social-icons.tsx を共用（スマホ最下部の横並びと同じ3つ）。PC（lg以上）のみ表示。

import { SocialIcons } from './social-icons';

const ICON_SIZE = 18; // 元22pxの約80%

export function EdgeIcons() {
  return (
    <div className="fixed bottom-0 right-4 top-0 z-30 hidden flex-col items-center justify-end gap-5 border-l border-[#150c0c]/50 pb-[29px] pl-4 lg:flex">
      <SocialIcons size={ICON_SIZE} />
    </div>
  );
}
