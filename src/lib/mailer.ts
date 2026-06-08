// メール送信の共通部品（nodemailer + SMTP）。
// お便りフォームなど「サーバーからメールを送りたい」ときはここの sendMail を使う。
//
// しくみ:
//  - 送信先サーバー(SMTP)の情報は環境変数（.env.local / 本番のサーバー設定）から読む。
//  - Xサーバーのメールアカウント（例 info@30nen.com）を使う想定。追加コストなし。
//  - ★ローカル開発で SMTP 設定が無いときは「実際には送らず、内容をコンソールに出すだけ」。
//    これで本物のメールアカウントが無くても、画面の流れ（送信中→完了）を確認できる。
//
// 必要な環境変数（本番化のときに設定する。.env.example を参照）:
//  SMTP_HOST   … メールサーバーのホスト名（例 sv1234.xserver.jp）
//  SMTP_PORT   … ポート番号（465=SSL / 587=STARTTLS）
//  SMTP_SECURE … "true"=SSL(465) / "false"=STARTTLS(587)
//  SMTP_USER   … メールアカウント（例 info@30nen.com）
//  SMTP_PASS   … そのパスワード
//  MAIL_FROM   … 送信元の表示（例 "三十年商店 <info@30nen.com>"）。未設定なら SMTP_USER を使う。

import nodemailer, { type Transporter } from 'nodemailer';

export type MailInput = {
  to: string; // 宛先メールアドレス
  subject: string; // 件名
  text: string; // 本文（プレーンテキスト）
  replyTo?: string; // 返信先（お便りなら送信者のメール）
  bcc?: string; // こっそり控え送付（宛先には見えない。店主への控えなどに使う）
};

// SMTP 設定が環境変数にそろっているか。
function isSmtpConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS,
  );
}

// transporter（送信機）は使い回す（毎回作らない）。
let cachedTransporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (cachedTransporter) return cachedTransporter;
  cachedTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === 'true', // 465=true / 587=false
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  return cachedTransporter;
}

// メールを送る。SMTP 未設定のローカルでは内容をコンソールに出すだけで「送れた」ことにする。
export async function sendMail(input: MailInput): Promise<void> {
  if (!isSmtpConfigured()) {
    // ローカル開発用フォールバック（本物のメールアカウントが無くても画面確認できる）。
    console.log(
      '\n[mailer] SMTP 未設定のため、実際には送信しません（内容のみ表示）:\n' +
        `  宛先: ${input.to}\n` +
        `  控え(BCC): ${input.bcc ?? '(なし)'}\n` +
        `  件名: ${input.subject}\n` +
        `  返信先: ${input.replyTo ?? '(なし)'}\n` +
        `  本文:\n${input.text}\n`,
    );
    return;
  }

  const from = process.env.MAIL_FROM || process.env.SMTP_USER;
  await getTransporter().sendMail({
    from,
    to: input.to,
    subject: input.subject,
    text: input.text,
    replyTo: input.replyTo,
    bcc: input.bcc,
  });
}
