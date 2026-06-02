// 投稿者(users)のデータアクセス層。
// 「DBとのやり取り役」をここに集約する。ログイン照合・ユーザー登録もここの関数を呼ぶ。
// パスワードは生のまま扱わず、必ず password.ts でハッシュ化してから保存する。

import { eq } from 'drizzle-orm';
import { db } from './index';
import { users } from './schema';
import { hashPassword, verifyPassword } from '@/auth/password';

// schema から型を自動生成（手書きしない＝設計とズレない）
export type User = typeof users.$inferSelect; // DBから読んだ1件の形（passwordHash を含む）

// 画面やトークンに渡してよい「安全な公開用」のユーザー情報（passwordHash を除いた形）。
export type PublicUser = Omit<User, 'passwordHash'>;

export type NewUserInput = {
  name: string;
  email: string;
  password: string; // 生パスワード。この関数の中でハッシュ化する。
  role?: 'admin' | 'author';
  avatarPath?: string | null;
  bio?: string | null;
};

// passwordHash を取り除いて返す（うっかり画面へ漏らさないための関所）。
export function toPublicUser(user: User): PublicUser {
  const { passwordHash: _passwordHash, ...rest } = user;
  void _passwordHash;
  return rest;
}

// ── Read：メールで1件取得（ログイン照合で使う。passwordHash 込み）──
export async function getUserByEmail(email: string): Promise<User | null> {
  const rows = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  return rows[0] ?? null;
}

// ── Read：idで1件取得（passwordHash 込み）────────────────────
export async function getUserById(id: number): Promise<User | null> {
  const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return rows[0] ?? null;
}

// ── Create：新規登録（パスワードはハッシュ化して保存）──────────
export async function createUser(input: NewUserInput): Promise<PublicUser> {
  const passwordHash = await hashPassword(input.password);
  const [row] = await db
    .insert(users)
    .values({
      name: input.name,
      email: input.email,
      passwordHash,
      role: input.role ?? 'author',
      avatarPath: input.avatarPath ?? null,
      bio: input.bio ?? null,
    })
    .returning();
  return toPublicUser(row);
}

// ── ログイン照合：メール＋パスワードが正しければ公開用ユーザーを返す ──
// 合わなければ null（メール違い／パスワード違いを区別しない＝どちらか教えない方が安全）。
export async function verifyCredentials(
  email: string,
  password: string,
): Promise<PublicUser | null> {
  const user = await getUserByEmail(email);
  if (!user) return null;
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return null;
  return toPublicUser(user);
}

// ── Delete：削除（消せたら true）──────────────────────────
export async function deleteUser(id: number): Promise<boolean> {
  const rows = await db
    .delete(users)
    .where(eq(users.id, id))
    .returning({ id: users.id });
  return rows.length > 0;
}
