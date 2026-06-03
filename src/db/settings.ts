// サイト設定（site_settings）のデータアクセス層。
// 「管理画面から編集できる自由テキスト」を 1か所で読み書きする窓口。
// 今はトップページのリードテキスト（lead_text）だけ。将来ほかの設定もここに足せる。

import { eq } from 'drizzle-orm';
import { db } from './index';
import { siteSettings } from './schema';

// リードテキストの初期値（DB未設定のときに表示する文章。仕様書 §14-E で確定）。
export const DEFAULT_LEAD_TEXT =
  'ここに並ぶのは、何気ない日常の断片や、とりとめのない思考、暮らしのメモの独り言のような心ウチ。手にとれる商品やサービスは無いけれど、その時々に探している答えのヒントが、いつかの誰かのお供になる石が、きっとここに。三十年商店、どうぞご贔屓に。';

const now = () => new Date().toISOString().slice(0, 19).replace('T', ' ');

// 設定を1件読む（無ければ null）。
export async function getSetting(key: string): Promise<string | null> {
  const rows = await db
    .select({ value: siteSettings.value })
    .from(siteSettings)
    .where(eq(siteSettings.key, key))
    .limit(1);
  return rows[0]?.value ?? null;
}

// 設定を1件書く（無ければ作る・あれば上書き＝upsert）。
export async function setSetting(key: string, value: string): Promise<void> {
  await db
    .insert(siteSettings)
    .values({ key, value, updatedAt: now() })
    .onConflictDoUpdate({
      target: siteSettings.key,
      set: { value, updatedAt: now() },
    });
}

// トップページのリードテキストを取得（未設定なら初期値を返す）。
export async function getLeadText(): Promise<string> {
  const value = await getSetting('lead_text');
  return value ?? DEFAULT_LEAD_TEXT;
}
