// 当店について（/about）。左端メニュー「当店について」・「三十年商店とは？」ボタンの行き先。
// 現行 30nen.com/about/ の内容を忠実に再現した固定ページ。
//  - 構成: 足跡（三十年商店＞三十年商店について）→ 引き戸の写真
//          → 「三十年商店について」（本文＋署名＋投げ銭の案内）
//          → 「書き手募集」（#wanted・左端メニュー「書き手募集」はここへ飛ぶ）。
//  - 本文の文字組みは記事本文と同じ .article-body を使い、サイト全体で統一する。

import type { Metadata } from 'next';
import Image from 'next/image';
import { Breadcrumb } from '@/components/public/breadcrumb';
import { SectionHeading } from '@/components/public/section-heading';

export const metadata: Metadata = {
  // 末尾の「｜三十年商店」は src/app/layout.tsx の template が自動で付ける
  title: '三十年商店について',
  description:
    '三十年商店は、書き手それぞれの「日常のlog」が並ぶお店です。三十年の存続を掲げ、いつでもそっと商い中。',
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-[720px]">
      {/* 足跡（現在地） */}
      <Breadcrumb
        items={[
          { label: '三十年商店', href: '/' },
          { label: '三十年商店について' },
        ]}
      />

      {/* 引き戸の写真（現行サイトと同じく幅85%・中央寄せ） */}
      <figure className="mx-auto w-[85%]">
        <Image
          src="/30nen_hikido.jpg"
          alt="三十年商店：引き戸"
          width={2682}
          height={1991}
          sizes="(max-width: 1024px) 85vw, 612px"
          priority
          style={{ width: '100%', height: 'auto' }}
        />
      </figure>

      {/* 三十年商店について */}
      <section className="mt-8">
        <SectionHeading>三十年商店について</SectionHeading>
        <div className="article-body text-[#333]">
          <p>
            はじまりは店主ふたりの、なんてことない「日常のlog 」を書きたい、読みたいという気持ちから。それはきっと毎日を楽しむ、スパイスのひとつになる。これは確信。そして、もし自分が書くなら、人の目に触れる場所（でもSNSはちょっと違うんだ）で書いてみたい。そう思う、根っこにあるのは、書くことで（読むことで）誰かと深くつながりたいという、ひそかなる個人的な目論見なのかもしれない。
          </p>
          <p>
            ひとくくりに「日常のlog 」と言っても、中身はそれぞれ。切り取るシーン、選ぶ言葉、重ねる時間に、その人らしさは無意識に現れるもの。
          </p>
          <p>
            書く人は、ゆっくり歳月をかけて “自分を開く” 。 本人すら無自覚な「人となり」みたいなものは、積み重ねられるlog
            の端々からこそ浮かび上がると思う。それがまた、自己紹介みたいに自分自身が語ろうとする言葉よりも、ずっと魅力的だったり、実は本質的で信憑性があるものだから面白い！
          </p>
          <p>
            読む人は、パズルのピースをひとつひとつはめるように
            “その人に近づく”。自分には無い視点にハッとしたり、ひどく共感してグッと距離を縮めたり、ときには傍観しながら。
          </p>
          <p>
            交差点からはちょっとだけ、いやだいぶ奥まっていて、自動ドアもなく、何を売ってるのか、よくわからない……三十年商店はそんなお店です。タイムラインには流れてこないけれど、名前の通り三十年の存続を掲げ、いつでもそっと商い中。
          </p>
          <p>
            店に並ぶのは、一見無価値なような、誰かの暮らしの断片や思考のかけら。手には取ることはできない品々ばかりですが、よーく見ると、人それぞれに、キラリと光って見えたり、ホッと安らいだり、クスッと笑えたり、道しるべになるようなものが、きっとみつかります。
          </p>
          <p>さぁ、今日も淡々と粛々と。</p>

          {/* 署名 */}
          <p className="mt-12">
            令和六年七月吉日
            <br />
            店主
            <br />
            サイコノゾミ
            <br />
            しげやすさき
          </p>

          {/* 署名とあとがきの区切り（点線） */}
          <hr className="my-10 border-0 border-t border-dotted border-[#999]" />

          <p>
            今のところ、いいね！
            ボタンがついてないので……友達のSNSにコメントをしたり、ラジオに葉書やメールを送るような気軽なノリで、お便りフォームにメッセージをいただけますと、書き手一同、大変励みになります。
          </p>
          <p>
            もし、あまりにもグッとくる投稿をみつけたり、三十年商店の存在に賛同してくださり、商店の存続を応援したい気持ちがあふれてしまったときには、そのお気持ちをこちらに投げ入れていただけると、これまた大変うれしいです！
          </p>
        </div>

        {/* 投げ銭（イメージ画像＋ボタン） */}
        {/* -mt-3=画像を直前の文章に寄せつつ重ならない位置（-mt-6だと文字に画像がかぶる） */}
        <figure className="mx-auto -mt-3 w-[85%]">
          <Image
            src="/30nen_nagesen.jpg"
            alt="投げ銭：イメージ画像"
            width={709}
            height={545}
            sizes="(max-width: 1024px) 85vw, 612px"
            style={{ width: '100%', height: 'auto' }}
          />
        </figure>
        <a
          href="https://30nen.stores.jp"
          target="_blank"
          rel="noopener noreferrer"
          className="mx-auto mt-5 flex w-40 justify-center bg-[#eeeeee] py-2 text-sm text-[#333] transition-colors hover:bg-[#150c0c] hover:text-white"
        >
          投げ銭する
        </a>
      </section>

      {/* 書き手募集（#wanted）。scroll-mt でアンカー移動時に帯が上端に張り付かないようにする */}
      <section id="wanted" className="mt-16 scroll-mt-6">
        <SectionHeading>書き手募集</SectionHeading>
        <div className="article-body text-[#333]">
          <p>書くことを日課にすると、日常を見る解像度が上がる気がします。</p>
          <p>
            また書くことでぼんやりしていた思考に輪郭がついたり、頭が整理されることもあるでしょう。
          </p>
          <p>
            日々のlogは興味あるけど、ひとりじゃなかなか続かないって方、ここで我々と一緒に三十年書いてみませんか。
          </p>
          <p>
            三十年商店では、日々のlogは “人となりを伝える長い前置き&quot;
            そんなふうに考えています。
          </p>

          <h3>書き手にお願いしたい事</h3>
          <ul>
            <li>三十年ほぼ毎日のlog 更新（カバー写真１枚は必須）</li>
            <li>ご自身が写ったプロフィール写真、居住エリア、年齢の掲載許可</li>
          </ul>

          <p>
            ご興味ある方は 三十年商店
            店主宛に、簡単な自己紹介文（SNSアカウントある方はご明記ください）をお送りください。
          </p>
          <p>
            順を追ってご返信させて頂きます。なお、商店の性質上お断りすることもあります。ご理解のほど宜しくお願い致します。
          </p>
          <p>
            ご応募は、このページ下部の{' '}
            <a
              href="#otayori"
              className="text-[#2563eb] underline underline-offset-2 transition-opacity hover:opacity-60"
            >
              お便りフォーム
            </a>
            （宛先で「店主」をお選びください）よりお送りください。
          </p>
        </div>

        {/* POP UP 店舗の募集（左右の縦ケイで挟んだカコミ・現行サイトの .Recruit を再現） */}
        {/* 文字組みは枠側に article-body を当て、中の行は中央揃えで上書きする */}
        <div className="article-body mx-auto mt-14 max-w-md border-x border-[#150c0c] px-4 py-1 text-[#333]">
          <p className="text-center">
            「いや、三十年はちょっと……（長すぎる）」
            <br />
            「でも記録を残したいことがある」という方に朗報
          </p>
          {/* TODO(SAKIさん確認待ち): このリンク先は仮（現行サイトのお知らせ記事）。
              飛び先をどの記事にするか追って確認し、記事移行後に新サイトのURLへ差し替える。 */}
          <a
            href="https://30nen.com/oshirase/2025/07/23/12729"
            className="mt-2 block text-center text-[#2563eb] underline underline-offset-2 transition-opacity hover:opacity-60"
          >
            POP UP 店舗も募集しています!
          </a>
        </div>
      </section>
    </div>
  );
}
