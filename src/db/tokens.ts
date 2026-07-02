// auth_tokens テーブルのCRUD。招待・パスワードリセットで共用。

import { db } from '@/db';
import { authTokens } from '@/db/schema';
import { eq, and, isNull, gt } from 'drizzle-orm';

export type TokenType = 'invite' | 'reset';

// トークンを作成して保存する。同じユーザー・同じ種別の古いトークンは削除して1つに保つ。
export async function createAuthToken(
  userId: number,
  tokenHash: string,
  type: TokenType,
  expiresAt: string,
) {
  // 古いトークンを削除（再発行時に旧リンクを無効化）
  await db
    .delete(authTokens)
    .where(and(eq(authTokens.userId, userId), eq(authTokens.type, type)));

  await db.insert(authTokens).values({ userId, tokenHash, type, expiresAt });
}

// ハッシュでトークンを検索し、有効（未使用・期限内）なものを返す。
export async function findValidToken(tokenHash: string, type: TokenType) {
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
  const rows = await db
    .select()
    .from(authTokens)
    .where(
      and(
        eq(authTokens.tokenHash, tokenHash),
        eq(authTokens.type, type),
        isNull(authTokens.usedAt),
        gt(authTokens.expiresAt, now),
      ),
    )
    .limit(1);
  return rows[0] ?? null;
}

// 使用済みにマークする（使い捨て）。
export async function markTokenUsed(id: number) {
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
  await db.update(authTokens).set({ usedAt: now }).where(eq(authTokens.id, id));
}
