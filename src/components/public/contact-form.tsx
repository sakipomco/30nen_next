// お便りフォーム（左コラム）。今は見た目だけ（送信機能はこのフェーズでは未実装）。
// 構成: 帯「お便りフォーム」＋お名前／Eメール／宛先／メッセージ／同意チェック／送信ボタン。
// ※ 送信ボタンは type="button"（今は押しても送信しない）。バックエンドは後で繋ぐ。

import { SectionHeading } from './section-heading';

const labelCls = 'flex flex-col gap-1 text-sm text-[#333]';
const fieldCls =
  'serif w-full border border-[#150c0c]/25 bg-white px-2 py-1.5 text-sm text-[#333] outline-none focus:border-[#150c0c]';
const required = <span className="text-red-600">*</span>;

export function ContactForm() {
  return (
    <section className="mt-10 w-full text-left">
      <SectionHeading>お便りフォーム</SectionHeading>

      <form className="flex flex-col gap-4">
        <label className={labelCls}>
          <span>お名前（ニックネーム）{required}</span>
          <input type="text" name="name" className={fieldCls} />
        </label>

        <label className={labelCls}>
          <span>Eメール {required}</span>
          <input type="email" name="email" className={fieldCls} />
        </label>

        <label className={labelCls}>
          <span>宛先 {required}</span>
          <select name="to" className={fieldCls} defaultValue="店主">
            <option value="店主">店主</option>
          </select>
        </label>

        <label className={labelCls}>
          <span>メッセージ {required}</span>
          <textarea name="message" rows={6} className={fieldCls} />
        </label>

        <label className="flex items-start gap-2 text-sm text-[#333]">
          <input type="checkbox" name="agree" className="mt-1" />
          <span>プライバシーポリシーに同意しました。</span>
        </label>

        {/* 今は送信機能なし（type="button"）。後でバックエンドに繋ぐ。 */}
        <button
          type="button"
          className="serif mt-1 w-full bg-[#150c0c] py-3 text-sm text-white transition-opacity hover:opacity-80"
        >
          送信する
        </button>
      </form>
    </section>
  );
}
