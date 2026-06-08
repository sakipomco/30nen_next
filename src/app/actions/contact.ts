'use server';
// お便りフォームの送信処理（サーバー側で動く）。
// フォームの action= から呼ぶ。useActionState と組み合わせて「送信中…」「完了」「エラー」を表示する。
//
// 流れ: 入力チェック → 宛先メールを決める → メール送信 → 結果を画面へ返す。
//
// ⚠ Server Action は誰でもPOSTできるので、宛先は「画面で選ばれた値」を信用しすぎない。
//    'owner'＝運営の受信箱（環境変数）／数字＝書き手のid（DBで書き手だけ許可）に限定する。

import { getCategoryAuthorEmails } from '@/db/categories';
import { sendMail } from '@/lib/mailer';

// useActionState に渡す「状態」の形。送信後に画面へ返す。
export type ContactState =
  | { ok: true } // 送信成功
  | { ok: false; error: string } // 失敗（理由を表示）
  | undefined; // 初期状態（まだ送っていない）

// メール形式のざっくり判定（厳密でなくてよい・明らかな打ち間違いを弾く程度）。
function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function sendContact(
  _prevState: ContactState,
  formData: FormData,
): Promise<ContactState> {
  // いたずら対策（ハニーポット）: 人には見えない罠フィールド。
  // 自動投稿プログラムは何でも埋めがちなので、ここに値が入っていたら静かに成功扱いにして捨てる。
  const trap = String(formData.get('website') ?? '');
  if (trap) return { ok: true };

  const name = String(formData.get('name') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim();
  const to = String(formData.get('to') ?? '').trim();
  const message = String(formData.get('message') ?? '').trim();
  const agree = formData.get('agree'); // チェック時のみ値が入る

  // ── 入力チェック ──
  if (!name) return { ok: false, error: 'お名前を入力してください。' };
  if (!email || !looksLikeEmail(email))
    return { ok: false, error: 'メールアドレスを正しく入力してください。' };
  if (!message) return { ok: false, error: 'メッセージを入力してください。' };
  if (!agree)
    return {
      ok: false,
      error: 'プライバシーポリシーへの同意にチェックを入れてください。',
    };

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
