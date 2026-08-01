'use server';
// 招待リンク・パスワードリセットの Server Action。
//  - acceptInviteAction  … 招待リンクでパスワードを設定する
//  - forgotPasswordAction … メールアドレスを入力してリセットメールを送る
//  - resetPasswordAction … リセットリンクで新パスワードを設定する
//
// ⚠ リセットメールは「メールアドレスを入れるだけ」で送れてしまうので、
//    回数の上限を入れて、他人の受信箱にメールを大量に送りつけられないようにする。

import { redirect } from 'next/navigation';
import { getUserByEmail, getUserById, updateUser } from '@/db/users';
import { createAuthToken, findValidToken, markTokenUsed } from '@/db/tokens';
import { generateToken, hashToken, tokenExpiresAt } from '@/lib/token';
import { sendInviteEmail, sendResetEmail } from '@/lib/email';
import { createSession } from '@/auth/session';
import { clientIp, consumeRateLimit, waitLabel } from '@/lib/rate-limit';

export type TokenFormState = { error?: string; success?: string } | undefined;

// ── 招待リンクを（再）送信する ──────────────────────────────
// users.ts の createUserAction から内部的に呼ぶ。
export async function sendInvite(userId: number) {
  const user = await getUserById(userId);
  if (!user) return;
  const { raw, hash } = generateToken();
  await createAuthToken(userId, hash, 'invite', tokenExpiresAt(7 * 24)); // 7日有効
  await sendInviteEmail(user.email, user.name, raw);
}

// ── 管理者が編集画面から招待メールを再送する（Server Action）──
// 管理者しか押せないが、押し間違い・連打で書き手の受信箱に同じメールが並ぶのを防ぐため、
// 同じ相手には10分に1回までとする。断ったときは画面にその旨を返す。
export type ResendInviteResult = { sent: boolean; error?: string };

export async function resendInviteAction(
  formData: FormData,
): Promise<ResendInviteResult> {
  const { requireAdmin } = await import('@/auth/session');
  await requireAdmin();
  const userId = Number(formData.get('userId'));
  if (!Number.isInteger(userId) || userId <= 0) {
    return { sent: false, error: '宛先が正しくありません。' };
  }

  const limited = await consumeRateLimit([
    { bucket: `invite:user:${userId}`, limit: 1, windowSec: 10 * 60 },
  ]);
  if (!limited.ok) {
    return {
      sent: false,
      error: `さきほど招待メールを送っています。${waitLabel(limited.retryAfterSec)}ほどおいてからもう一度お試しください。`,
    };
  }

  await sendInvite(userId);
  return { sent: true };
}

// ── 招待リンクでパスワードを設定（/invite/[token]）──────────
export async function acceptInviteAction(
  _prev: TokenFormState,
  formData: FormData,
): Promise<TokenFormState> {
  const rawToken = String(formData.get('token') ?? '');
  const password = String(formData.get('password') ?? '');
  const confirm = String(formData.get('confirm') ?? '');

  if (!password) return { error: 'パスワードを入力してください。' };
  if (password.length < 8) return { error: 'パスワードは8文字以上にしてください。' };
  if (password !== confirm) return { error: 'パスワードが一致しません。' };

  const tokenRecord = await findValidToken(hashToken(rawToken), 'invite');
  if (!tokenRecord) {
    return { error: 'このリンクは無効または期限切れです。管理者に再送を依頼してください。' };
  }

  await updateUser(tokenRecord.userId, { password });
  await markTokenUsed(tokenRecord.id);

  // パスワード設定完了 → そのままログインさせる
  const user = await getUserById(tokenRecord.userId);
  if (user) await createSession({ userId: user.id, role: user.role });

  redirect('/admin');
}

// ── パスワードを忘れた（/forgot-password）────────────────────
export async function forgotPasswordAction(
  _prev: TokenFormState,
  formData: FormData,
): Promise<TokenFormState> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  if (!email) return { error: 'メールアドレスを入力してください。' };

  // ── 送信回数の上限 ──
  //   同じメールアドレス宛: 1時間に3回まで（他人の受信箱を埋めさせない）
  //   同じ回線から: 1時間に10回まで（アドレスを変えながらの連発よけ）
  // ここで数えるのは「入力された文字列」なので、そのアドレスが登録済みかどうかは漏れない。
  const ip = await clientIp();
  const limited = await consumeRateLimit([
    { bucket: `reset:email:${email}`, limit: 3, windowSec: 60 * 60 },
    { bucket: `reset:ip:${ip}`, limit: 10, windowSec: 60 * 60 },
  ]);
  if (!limited.ok) {
    return {
      error: `パスワード再設定メールの送信が続いています。${waitLabel(limited.retryAfterSec)}ほど時間をおいてからお試しください。（すでに届いたメールのリンクはそのまま使えます）`,
    };
  }

  const user = await getUserByEmail(email);
  // ユーザーが見つからなくても同じメッセージ（存在確認させない）
  if (user) {
    const { raw, hash } = generateToken();
    await createAuthToken(user.id, hash, 'reset', tokenExpiresAt(1)); // 1時間有効
    await sendResetEmail(user.email, user.name, raw);
  }

  return { success: 'メールを送りました。届いたリンクからパスワードを設定してください。（数分かかる場合があります）' };
}

// ── パスワードをリセット（/reset-password/[token]）───────────
export async function resetPasswordAction(
  _prev: TokenFormState,
  formData: FormData,
): Promise<TokenFormState> {
  const rawToken = String(formData.get('token') ?? '');
  const password = String(formData.get('password') ?? '');
  const confirm = String(formData.get('confirm') ?? '');

  if (!password) return { error: 'パスワードを入力してください。' };
  if (password.length < 8) return { error: 'パスワードは8文字以上にしてください。' };
  if (password !== confirm) return { error: 'パスワードが一致しません。' };

  const tokenRecord = await findValidToken(hashToken(rawToken), 'reset');
  if (!tokenRecord) {
    return { error: 'このリンクは無効または期限切れです。もう一度「パスワードを忘れた」からやり直してください。' };
  }

  await updateUser(tokenRecord.userId, { password });
  await markTokenUsed(tokenRecord.id);

  // リセット完了 → そのままログインさせる
  const user = await getUserById(tokenRecord.userId);
  if (user) await createSession({ userId: user.id, role: user.role });

  redirect('/admin');
}
