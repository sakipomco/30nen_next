// JWT（JSON Web Token＝ジョット）の発行と検証。
// JWT＝「中身（誰なのか）＋ サーバーだけが作れる署名」がセットになった会員証の文字列。
// 署名があるので、利用者がCookieを書き換えても「偽の会員証」はサーバー側で弾ける。
// ライブラリは jose（Next.js公式ガイド推奨・純JavaScript製）。

import { SignJWT, jwtVerify } from 'jose';

// 会員証の中身。最小限だけ入れる（パスワード等の秘密は絶対に入れない）。
export type SessionPayload = {
  userId: number;
  role: 'admin' | 'author';
};

const ALG = 'HS256'; // 署名方式（共通の秘密鍵で署名・検証する方式）
const EXPIRES_IN = '7d'; // 有効期限：7日

// 署名に使う秘密鍵。環境変数 SESSION_SECRET から読む（.env.local に置く）。
// これが漏れると偽の会員証を作られるので、Gitには絶対に入れない。
function getKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error(
      'SESSION_SECRET が未設定です。.env.local に SESSION_SECRET を設定してください（生成例: openssl rand -base64 32）。',
    );
  }
  return new TextEncoder().encode(secret);
}

// 中身 → 署名付きトークン文字列を発行する。
export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ userId: payload.userId, role: payload.role })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt() // 発行時刻
    .setExpirationTime(EXPIRES_IN) // 有効期限
    .sign(getKey());
}

// トークン文字列 → 中身。署名が不正・期限切れ・壊れていれば null を返す。
export async function verifySession(
  token: string | undefined,
): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getKey(), { algorithms: [ALG] });
    const userId = payload.userId;
    const role = payload.role;
    if (typeof userId !== 'number' || (role !== 'admin' && role !== 'author')) {
      return null;
    }
    return { userId, role };
  } catch {
    // 署名不正・期限切れなどはすべて「無効な会員証」として扱う。
    return null;
  }
}
