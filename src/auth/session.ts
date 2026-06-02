// セッション管理：JWT（会員証）をCookieに「保存・読み出し・削除」する係。
// Cookie＝ブラウザに預ける小さなメモ。リクエストごとに自動で送られてくるので、
// 「この人は誰か（ログイン中か）」を毎回サーバーで確かめられる。
//
// ※ Cookieの set / delete は Server Action か Route Handler の中でしか呼べない（Next.jsの仕様）。
//    読み出し(get)は Server Component からでも可。

import { cookies } from 'next/headers';
import { cache } from 'react';
import { signSession, verifySession, type SessionPayload } from './jwt';
import { getUserById, toPublicUser, type PublicUser } from '@/db/users';

const COOKIE_NAME = 'session';
const MAX_AGE_SECONDS = 7 * 24 * 60 * 60; // 7日（jwt.ts の有効期限と揃える）

// ログイン成功時：会員証を発行してCookieにしまう。
export async function createSession(payload: SessionPayload): Promise<void> {
  const token = await signSession(payload);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true, // ブラウザのJavaScriptから読めない（盗み見対策）
    secure: process.env.NODE_ENV === 'production', // 本番はHTTPSのときだけ送る
    sameSite: 'lax', // 別サイト経由の送信を制限（なりすまし対策）
    maxAge: MAX_AGE_SECONDS,
    path: '/',
  });
}

// ログアウト時：Cookieを消す。
export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

// Cookieの会員証を読み、署名を検証して中身（userId・role）を返す。無効なら null。
// cache()＝同じリクエスト処理中に何度呼んでも1回しか計算しない（無駄を省く）。
export const getSession = cache(async (): Promise<SessionPayload | null> => {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  return verifySession(token);
});

// 「今ログイン中のユーザー」をDBから取得（passwordHash を除いた公開用）。
// 会員証が無効、または該当ユーザーが消えていれば null。
export const getCurrentUser = cache(async (): Promise<PublicUser | null> => {
  const session = await getSession();
  if (!session) return null;
  const user = await getUserById(session.userId);
  return user ? toPublicUser(user) : null;
});
