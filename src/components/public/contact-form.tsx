'use client';
// お便りフォーム（左コラム）。送信機能つき。
// 構成: 帯「お便りフォーム」＋お名前／Eメール／宛先（店主＋書き手）／メッセージ／同意チェック／送信ボタン。
// useActionState で「送信中…」「完了メッセージ」「エラー表示」を出す。
// recipients＝宛先に並べる連載（カテゴリー）の一覧（id と名前だけ）。
//   選ばれた連載の担当書き手にサーバー側でメールを届ける（書き手のメアドはブラウザに渡さない）。
//
// ★入力欄は state で管理（controlled）する。理由: Reactはフォーム送信後に未管理の入力欄を
//   自動リセットしてしまうため、検証エラーで差し戻したときに「書いた文章が消える」のを防ぐ。

import { useActionState, useState } from 'react';
import { sendContact, type ContactState } from '@/app/actions/contact';
import { SectionHeading } from './section-heading';

// 宛先プルダウンに並べる連載（id と名前だけ）。
export type ContactRecipient = { id: number; name: string };

const labelCls = 'flex flex-col gap-1 text-sm text-[#333]';
const fieldCls =
  'serif w-full border border-[#150c0c]/25 bg-white px-2 py-1.5 text-sm text-[#333] outline-none focus:border-[#150c0c]';
const required = <span className="text-red-600">*</span>;

export function ContactForm({
  recipients,
}: {
  recipients: ContactRecipient[];
}) {
  const [state, action, pending] = useActionState<ContactState, FormData>(
    sendContact,
    undefined,
  );

  // 入力値を保持（エラーで差し戻されても消えないように）。
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [to, setTo] = useState('owner');
  const [message, setMessage] = useState('');
  const [agree, setAgree] = useState(false);

  return (
    <section className="mt-10 w-full text-left">
      <SectionHeading>お便りフォーム</SectionHeading>

      {state?.ok ? (
        // 送信完了。フォームの代わりにお礼を表示する。
        <p className="border border-[#150c0c]/20 bg-[#150c0c]/5 px-4 py-6 text-center text-sm leading-relaxed text-[#333]">
          お便りを送信しました。
          <br />
          ありがとうございました。
        </p>
      ) : (
        <form action={action} className="flex flex-col gap-4">
          <label className={labelCls}>
            <span>お名前（ニックネーム）{required}</span>
            <input
              type="text"
              name="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={fieldCls}
            />
          </label>

          <label className={labelCls}>
            <span>Eメール {required}</span>
            <input
              type="email"
              name="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={fieldCls}
            />
          </label>

          <label className={labelCls}>
            <span>宛先 {required}</span>
            <select
              name="to"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className={fieldCls}
            >
              <option value="owner">店主</option>
              {recipients.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </label>

          <label className={labelCls}>
            <span>メッセージ {required}</span>
            <textarea
              name="message"
              rows={6}
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className={fieldCls}
            />
          </label>

          <label className="flex items-start gap-2 text-sm text-[#333]">
            <input
              type="checkbox"
              name="agree"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
              className="mt-1"
            />
            <span>プライバシーポリシーに同意しました。</span>
          </label>

          {/* いたずら対策（ハニーポット）: 人には見えない罠。自動投稿はここを埋めがち。 */}
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="hidden"
          />

          {/* エラーがあれば赤字で表示 */}
          {state && !state.ok && (
            <p className="text-sm text-red-600" role="alert">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="serif mt-1 w-full bg-[#150c0c] py-2 text-sm text-white transition-opacity hover:opacity-80 disabled:opacity-60"
          >
            {pending ? '送信中…' : '送信する'}
          </button>
        </form>
      )}
    </section>
  );
}
