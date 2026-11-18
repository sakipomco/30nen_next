// メール送信の窓口。Resend（resend.com）を使う。
// 環境変数:
//   RESEND_API_KEY  … Resend のAPIキー（必須）
//   EMAIL_FROM      … 送信元アドレス（例: 三十年商店 <noreply@30nen.com>）
//   SITE_URL        … サイトのURL（例: https://30nen.com）

import { Resend } from 'resend';

// キーが未設定のときはモジュール読み込み時ではなく送信時にエラーを出す（遅延初期化）。
function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('RESEND_API_KEY が設定されていません。.env.local を確認してください。');
  return new Resend(key);
}

const FROM = process.env.EMAIL_FROM ?? '三十年商店 <noreply@30nen.com>';
const SITE_URL = (process.env.SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '');

// お便りフォームからのメール。
// ⚠ 以前は src/lib/mailer.ts（Xサーバーのメール＝SMTP）を使っていたが、本番にSMTPの設定が
//    入っておらず、2026-07-29の公開以降「送ったつもりで1通も届かない」状態が続いていた
//    （詳細は HANDOFF.md 項目105）。招待メールと同じ Resend に統一して再発を防ぐ。
// 本文はプレーンテキスト（読者が書いた改行をそのまま残すため）。
export async function sendContactEmail(input: {
  to: string[]; // 届け先（連載宛なら担当書き手が複数のこともある）
  subject: string;
  text: string;
  replyTo?: string; // 送ってくれた人のアドレス。そのまま「返信」で返せるようにする。
  bcc?: string; // 店主への控え
}) {
  const resend = getResend();
  const { error } = await resend.emails.send({
    from: FROM,
    to: input.to,
    subject: input.subject,
    text: input.text,
    replyTo: input.replyTo,
    bcc: input.bcc,
  });
  // 送れなかったら必ず例外にする＝呼び出し元が「送れた」と誤解しないように。
  if (error) throw new Error(`Resendで送信できませんでした: ${error.message}`);
}

// 招待メール（初回パスワード設定）
export async function sendInviteEmail(to: string, name: string, rawToken: string) {
  const resend = getResend();
  const url = `${SITE_URL}/invite/${rawToken}`;
  await resend.emails.send({
    from: FROM,
    to,
    subject: '【三十年商店】アカウントのご案内',
    html: `
<p>${name} さん、こんにちは。</p>
<p>三十年商店の投稿者アカウントが作成されました。<br>
下のボタンからパスワードを設定してください。</p>
<p><a href="${url}" style="display:inline-block;background:#1a1a1a;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-size:15px;">パスワードを設定する</a></p>
<p style="font-size:12px;color:#888;">このリンクは7日間有効です。<br>
心当たりのない場合は無視してください。</p>
<hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
<p style="font-size:12px;color:#888;">三十年商店<br>${SITE_URL}</p>
`,
  });
}

// パスワードリセットメール
export async function sendResetEmail(to: string, name: string, rawToken: string) {
  const resend = getResend();
  const url = `${SITE_URL}/reset-password/${rawToken}`;
  await resend.emails.send({
    from: FROM,
    to,
    subject: '【三十年商店】パスワードの再設定',
    html: `
<p>${name} さん、こんにちは。</p>
<p>パスワードの再設定リクエストを受け付けました。<br>
下のボタンから新しいパスワードを設定してください。</p>
<p><a href="${url}" style="display:inline-block;background:#1a1a1a;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-size:15px;">パスワードを再設定する</a></p>
<p style="font-size:12px;color:#888;">このリンクは1時間有効です。<br>
心当たりのない場合は無視してください（パスワードは変更されません）。</p>
<hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
<p style="font-size:12px;color:#888;">三十年商店<br>${SITE_URL}</p>
`,
  });
}
