'use server';
// ログイン / ログアウトの Server Action（サーバー側で動く処理）。
// 投稿フォームの action= から呼ぶ。useActionState（Reactのフック）と組み合わせると
// 「処理中…」表示やエラーメッセージ表示がやりやすい。
//
// ⚠ Server Action は「画面のボタン経由」だけでなく直接POSTでも呼べる。
//    だから「ログイン中か」「権限があるか」の確認は必ずこの中で行う（UI側の制御だけに頼らない）。

import { redirect } from 'next/navigation';
import { verifyCredentials } from '@/db/users';
import { createSession, deleteSession } from '@/auth/session';

// useActionState に渡すための「前回の状態」の形。エラー文言を画面に返すのに使う。
export type LoginState = { error?: string } | undefined;

// ── ログイン ────────────────────────────────────────────
// 第1引数 _prevState は useActionState の作法（前回の戻り値）。今回は使わない。
export async function login(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  if (!email || !password) {
    return { error: 'メールアドレスとパスワードを入力してください。' };
  }

  const user = await verifyCredentials(email, password);
  if (!user) {
    // メール違い／パスワード違いを区別しない（どちらが間違いか教えない方が安全）。
    return { error: 'メールアドレスまたはパスワードが正しくありません。' };
  }

  // 会員証（JWT）を発行して Cookie に保存。
  await createSession({ userId: user.id, role: user.role });

  // 成功したら投稿管理画面へ。redirect は例外を投げて処理を中断するので try/catch では囲まない。
  redirect('/admin');
}

// ── ログアウト ───────────────────────────────────────────
export async function logout(): Promise<void> {
  await deleteSession();
  redirect('/login');
}
