'use server';
// ログイン / ログアウトの Server Action（サーバー側で動く処理）。
// 投稿フォームの action= から呼ぶ。useActionState（Reactのフック）と組み合わせると
// 「処理中…」表示やエラーメッセージ表示がやりやすい。
//
// ⚠ Server Action は「画面のボタン経由」だけでなく直接POSTでも呼べる。
//    だから「ログイン中か」「権限があるか」の確認は必ずこの中で行う（UI側の制御だけに頼らない）。
//    パスワードの総当たり（当たるまで何万回も試す攻撃）を防ぐため、試行回数の上限もここで見る。

import { redirect } from 'next/navigation';
import { verifyCredentials } from '@/db/users';
import { createSession, deleteSession } from '@/auth/session';
import {
  checkRateLimit,
  clientIp,
  recordRateEvent,
  waitLabel,
} from '@/lib/rate-limit';

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

  // ── 試行回数の上限 ──
  // 数えるのは「失敗した回数」だけ。ふだん通りログインできる人は影響を受けない。
  //   同じ回線から: 10分に20回まで（1台で複数アカウントを試す攻撃よけ）
  //   同じメールアドレスに対して: 10分に10回まで（1人を狙う攻撃よけ）
  // ※ メール側はレビューの提案（5回）より少しゆるめにした。書き手はスマホで打つ方が多く、
  //   打ち間違いが続くと本人が締め出されてしまうため。10分に10回でも総当たりには遅すぎる。
  const ip = await clientIp();
  const ipBucket = `login:ip:${ip}`;
  const emailBucket = `login:email:${email.toLowerCase()}`;
  const limited = await checkRateLimit([
    { bucket: ipBucket, limit: 20, windowSec: 10 * 60 },
    { bucket: emailBucket, limit: 10, windowSec: 10 * 60 },
  ]);
  if (!limited.ok) {
    // 上限に達したことは伝えるが、当たり外れの手がかりは増やさない。
    return {
      error: `ログインの失敗が続いています。${waitLabel(limited.retryAfterSec)}ほど時間をおいてからお試しください。パスワードが分からないときは「パスワードを忘れた方」からやり直せます。`,
    };
  }

  const user = await verifyCredentials(email, password);
  if (!user) {
    // 失敗を1回ぶん記録する（成功したときは記録しない）。
    await recordRateEvent([ipBucket, emailBucket]);
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
