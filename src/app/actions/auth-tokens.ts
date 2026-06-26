'use server';
// 招待リンク・パスワードリセットの Server Action。
//  - acceptInviteAction  … 招待リンクでパスワードを設定する
//  - forgotPasswordAction … メールアドレスを入力してリセットメールを送る
//  - resetPasswordAction … リセットリンクで新パスワードを設定する

import { redirect } from 'next/navigation';
import { getUserByEmail, getUserById, updateUser } from '@/db/users';
import { createAuthToken, findValidToken, markTokenUsed } from '@/db/tokens';
import { generateToken, hashToken, tokenExpiresAt } from '@/lib/token';
import { sendInviteEmail, sendResetEmail } from '@/lib/email';
import { createSession } from '@/auth/session';

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
export async function resendInviteAction(formData: FormData): Promise<void> {
  const { requireAdmin } = await import('@/auth/session');
  await requireAdmin();
  const userId = Number(formData.get('userId'));
  if (!Number.isInteger(userId) || userId <= 0) return;
  await sendInvite(userId);
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
