// 記事ページの「書き手」プロフィール欄。仕様: 帯「書き手」＋丸トリミング写真＋
//   名前／〇〇県〇〇市／〇歳／SNSアイコン（Instagram・X・YouTube）。
// 写真・居住地・年齢・SNSは任意（無い項目は出さない）。

import Image from 'next/image';
import type { PublicUser } from '@/db/users';
import { calcAge } from '@/lib/datetime';
import { SectionHeading } from './section-heading';

// withHeading=false にすると帯「書き手」を出さない
// （連載ページで担当2名を並べるとき、帯は1回だけにするため）。
export function WriterProfile({
  author,
  withHeading = true,
}: {
  author: PublicUser;
  withHeading?: boolean;
}) {
  // 「神奈川県藤沢市／49歳」のように、ある項目だけをつなげる。
  // 年齢は誕生日から自動計算（誕生日そのものは表示しない）。
  const age = calcAge(author.birthday);
  const metaParts: string[] = [];
  if (author.location) metaParts.push(author.location);
  if (age != null) metaParts.push(`${age}歳`);
  const meta = metaParts.join('／');

  const socials = [
    { url: author.instagramUrl, icon: '/Icon_insta.svg', label: 'Instagram' },
    { url: author.xUrl, icon: '/Icon_x.svg', label: 'X' },
    { url: author.youtubeUrl, icon: '/Icon_youtube.svg', label: 'YouTube' },
    { url: author.websiteUrl, icon: '/Icon_website.svg', label: 'Webサイト' },
  ].filter((s) => s.url);

  return (
    <section className={withHeading ? 'mt-12' : 'mt-8'}>
      {withHeading && <SectionHeading gapClass="mb-5">書き手</SectionHeading>}
      <div className="flex items-center gap-5">
        {/* 丸トリミングの顔写真（無ければ枠だけ） */}
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full bg-zinc-100">
          {author.avatarPath && (
            <Image
              src={author.avatarPath}
              alt={author.name}
              fill
              sizes="96px"
              className="object-cover"
            />
          )}
        </div>

        {/* 名前／居住地・年齢／SNS */}
        <div className="min-w-0">
          <p className="serif text-xl text-[#333]">{author.name}</p>
          {meta && <p className="mt-0 text-sm text-[#333]">{meta}</p>}
          {socials.length > 0 && (
            <div className="mt-2 flex items-center gap-3">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.url!}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="transition-opacity hover:opacity-60"
                >
                  <Image src={s.icon} alt={s.label} width={16} height={16} unoptimized />
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
