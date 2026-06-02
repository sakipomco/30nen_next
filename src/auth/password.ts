// パスワードの「ハッシュ化」と「照合」。
// ハッシュ化＝元に戻せない一方向の変換。DBには生パスワードではなくハッシュだけを保存する。
// 仕組みは Node 標準の crypto.scrypt（スクリプト）。追加ライブラリ不要・OWASP推奨方式のひとつ。

import { randomBytes, scrypt, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

// scrypt は重い計算（わざと遅くして総当たり攻撃に強くする）。サーバーを止めないよう非同期版を使う。
const scryptAsync = promisify(scrypt);

const KEY_LENGTH = 64; // 生成するハッシュの長さ（バイト）
const SCHEME = 'scrypt'; // 保存形式の識別子（将来方式を変えても見分けられるように頭に付ける）

// パスワード → 保存用文字列。形式は "scrypt$<塩(salt)のhex>$<ハッシュのhex>"。
// salt（ソルト）＝利用者ごとに変わるランダムな付け足し。同じパスワードでも保存値が毎回変わる。
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer;
  return `${SCHEME}$${salt.toString('hex')}$${derived.toString('hex')}`;
}

// 入力パスワードが、保存済みハッシュと一致するか。一致すれば true。
export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const [scheme, saltHex, hashHex] = stored.split('$');
  if (scheme !== SCHEME || !saltHex || !hashHex) return false;

  const salt = Buffer.from(saltHex, 'hex');
  const expected = Buffer.from(hashHex, 'hex');
  const derived = (await scryptAsync(password, salt, expected.length)) as Buffer;

  // timingSafeEqual＝「途中で違いが分かっても処理時間を一定に保つ」比較。漏えい対策。
  return (
    derived.length === expected.length && timingSafeEqual(derived, expected)
  );
}
