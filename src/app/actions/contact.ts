'use server';
// お便りフォームの送信処理（サーバー側で動く）。
// フォームの action= から呼ぶ。useActionState と組み合わせて「送信中…」「完了」「エラー」を表示する。
//
// 流れ: 入力チェック → 宛先メールを決める → メール送信 → 結果を画面へ返す。
//
// ⚠ Server Action は誰でもPOSTできるので、宛先は「画面で選ばれた値」を信用しすぎない。
//    'owner'＝運営の受信箱（環境変数）／数字＝書き手のid（DBで書き手だけ許可）に限定する。
//    同じ理由で、送信回数の上限（レートリミット）もここで見る。フォーム画面を通さずに
//    連続POSTされても、店主・書き手・メールサーバーに大量のメールが届かないようにする。

import { getCategoryAuthorEmails } from '@/db/categories';
import { sendMail } from '@/lib/mailer';
import {
  checkRateLimit,
  clientIp,
  recordRateEvent,
  waitLabel,
} from '@/lib/rate-limit';

// useActionState に渡す「状態」の形。送信後に画面へ返す。
export type ContactState =
  | { ok: true } // 送信成功
  | { ok: false; error: string } // 失敗（理由を表示）
  | undefined; // 初期状態（まだ送っていない）

// メール形式のざっくり判定（厳密でなくてよい・明らかな打ち間違いを弾く程度）。
function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

// 入力の長さの上限。ふつうのお便りが引っかからない余裕をとりつつ、
// 極端に長い本文でメールやDBを膨らませられないようにする。
const MAX_NAME = 100;
const MAX_EMAIL = 254; // メールアドレスの規格上の最大値
const MAX_MESSAGE = 5000;

// 送信が多すぎるときの案内文（詳しい理由は伝えない）。
function tooManyMessage(retryAfterSec: number): string {
  return `送信が続いています。おそれ入りますが、${waitLabel(retryAfterSec)}ほど時間をおいてからお試しください。`;
}

export async function sendContact(
  _prevState: ContactState,
  formData: FormData,
): Promise<ContactState> {
  const ip = await clientIp();

  // いたずら対策（ハニーポット）: 人には見えない罠フィールド。
  // 自動投稿プログラムは何でも埋めがちなので、ここに値が入っていたら静かに成功扱いにして捨てる。
  const trap = String(formData.get('website') ?? '');
  if (trap) {
    // 罠にかかった相手は、次からの上限に早く達するよう3通ぶん記録しておく。
    // （recordRateEvent は1回の呼び出しを1通ぶんと数えるので、3回呼ぶ）
    for (let i = 0; i < 3; i++) await recordRateEvent([`contact:ip:${ip}`]);
    return { ok: true };
  }

  const name = String(formData.get('name') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim();
  const to = String(formData.get('to') ?? '').trim();
  const message = String(formData.get('message') ?? '').trim();
  const agree = formData.get('agree'); // チェック時のみ値が入る

  // ── 送信回数の上限 ──
  //   同じ回線から: 1分に3通・1日に30通まで
  //   同じメールアドレスから: 1時間に5通まで
  // 数えるのは「実際にメールを送った回数」だけ。ここでは調べるにとどめ、
  // 入力チェックを通ってから記録する（書き間違いで差し戻された人が損をしないように）。
  const rules = [
    { bucket: `contact:ip:${ip}`, limit: 3, windowSec: 60 },
    { bucket: `contact:ip:${ip}`, limit: 30, windowSec: 24 * 60 * 60 },
  ];
  if (email && looksLikeEmail(email)) {
    rules.push({
      bucket: `contact:email:${email.toLowerCase()}`,
      limit: 5,
      windowSec: 60 * 60,
    });
  }
  const limited = await checkRateLimit(rules);
  if (!limited.ok) {
    return { ok: false, error: tooManyMessage(limited.retryAfterSec) };
  }

  // ── 入力チェック ──
  if (!name) return { ok: false, error: 'お名前を入力してください。' };
  if (name.length > MAX_NAME)
    return { ok: false, error: `お名前は${MAX_NAME}文字以内で入力してください。` };
  if (!email || !looksLikeEmail(email) || email.length > MAX_EMAIL)
    return { ok: false, error: 'メールアドレスを正しく入力してください。' };
  if (!message) return { ok: false, error: 'メッセージを入力してください。' };
  if (message.length > MAX_MESSAGE)
    return {
      ok: false,
      error: `メッセージは${MAX_MESSAGE}文字以内で入力してください。`,
    };
  if (!agree)
    return {
      ok: false,
      error: 'プライバシーポリシーへの同意にチェックを入れてください。',
    };

  // ここまで来たら本当に送る内容。1通ぶんとして記録する。
  await recordRateEvent(rules.map((r) => r.bucket));

  // ── 宛先メールを決める ──
  // 店主（運営の受信箱）。本番化のとき .env に CONTACT_TO_EMAIL を設定する。
  // ローカルで受信箱が未設定でも、mailer 側のフォールバックで内容は確認できる。
  const ownerEmail =
    process.env.CONTACT_TO_EMAIL ?? process.env.SMTP_USER ?? 'owner@example.com';

  let recipient: string;
  let recipientLabel: string;
  // 書き手宛のお便りは、店主にも控え(BCC)を届ける（店主が全お便りを把握できるように）。
  // 店主が直接の宛先になるとき（店主宛・担当未登録のフォールバック）は控え不要。
  let bcc: string | undefined;
  if (to === 'owner' || to === '') {
    recipient = ownerEmail;
    recipientLabel = '店主';
  } else {
    // 連載（カテゴリー）宛て。その連載の担当書き手のメールへ届ける。
    // id が本当に連載か DB で確認してからメールを取り出す（画面の値を信用しすぎない）。
    const categoryId = Number(to);
    if (!Number.isInteger(categoryId)) {
      return { ok: false, error: '宛先が正しくありません。選び直してください。' };
    }
    const { categoryName, emails } = await getCategoryAuthorEmails(categoryId);
    if (!categoryName) {
      return { ok: false, error: '宛先が正しくありません。選び直してください。' };
    }
    if (emails.length > 0) {
      // 1人1連載が基本だが、複数担当なら全員へ（カンマ区切りで指定）。
      recipient = emails.join(', ');
      recipientLabel = `${categoryName}の書き手`;
      bcc = ownerEmail; // 店主にも控えを送る。
    } else {
      // この連載にまだ担当書き手が居ない → お便りが迷子にならないよう店主へ。
      recipient = ownerEmail;
      recipientLabel = `${categoryName}（担当未登録のため店主へ）`;
    }
  }

  // ── メール送信 ──
  const subject = `【三十年商店】お便り（${recipientLabel}宛）: ${name} さんより`;
  const text =
    `三十年商店のお便りフォームにメッセージが届きました。\n\n` +
    `宛先: ${recipientLabel}\n` +
    `お名前: ${name}\n` +
    `メール: ${email}\n` +
    `--------------------\n` +
    `${message}\n` +
    `--------------------\n`;

  try {
    await sendMail({ to: recipient, subject, text, replyTo: email, bcc });
  } catch (err) {
    console.error('[contact] メール送信に失敗:', err);
    return {
      ok: false,
      error:
        '送信中にエラーが発生しました。時間をおいて再度お試しください。',
    };
  }

  return { ok: true };
}
