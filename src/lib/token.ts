// 招待・パスワードリセット用の使い捨てトークンを扱う。
// raw token（ランダム64文字）をURLに埋め込み、DBにはSHA-256ハッシュだけ保存する。

import { randomBytes, createHash } from 'node:crypto';

export function generateToken(): { raw: string; hash: string } {
  const raw = randomBytes(32).toString('hex'); // 64文字の16進数
  const hash = createHash('sha256').update(raw).digest('hex');
  return { raw, hash };
}

export function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

// トークンの有効期限を計算して返す（UTC文字列）。
export function tokenExpiresAt(hours: number): string {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19);
}
