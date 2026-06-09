// 記事詳細ページの「同カテゴリーの前後の日記」へ移動するナビ（文字＋「く」字矢印）。
// SAKIさんの指定: 左に「つぎの日記」（左に矢印<）／右に「まえの日記」（右に矢印>）。記事タイトルは出さない。
// 矢印は「く」の字画像 30nen_kunoji.png（元は左向き<。右側は左右反転で>）。
// どちらかが無ければ、その側は何も置かない（プレースホルダで幅だけ確保）。

import Image from 'next/image';
import Link from 'next/link';
import type { PublicArticle } from '@/db/articles';

function hrefOf(article: PublicArticle): string {
  return article.slug ? `/posts/${article.slug}` : `/posts/${article.id}`;
}

// 「く」字矢印の画像。flip=true で左右反転（>になる）。
function Arrow({ flip }: { flip?: boolean }) {
  return (
    <Image
      src="/30nen_kunoji.png"
      alt=""
      width={88}
      height={90}
      aria-hidden
      className={`h-3.5 w-3.5 shrink-0 ${flip ? '-scale-x-100' : ''}`}
    />
  );
}

export function AdjacentNav({
  prev,
  next,
}: {
  prev: PublicArticle | null;
  next: PublicArticle | null;
}) {
  // 前後どちらも無ければ何も出さない。
  if (!prev && !next) return null;

  const linkClass =
    'group flex items-center gap-2 serif text-[0.95rem] text-[#333] transition-opacity hover:opacity-60';

  return (
    <nav className="mt-10 flex items-center justify-between gap-3">
      {/* 左＝つぎの日記（1つ新しい）。左に矢印< */}
      {next ? (
        <Link href={hrefOf(next)} className={linkClass}>
          <Arrow />
          つぎの日記
        </Link>
      ) : (
        <span aria-hidden />
      )}

      {/* 右＝まえの日記（1つ古い）。右に矢印> */}
      {prev ? (
        <Link href={hrefOf(prev)} className={linkClass}>
          まえの日記
          <Arrow flip />
        </Link>
      ) : (
        <span aria-hidden />
      )}
    </nav>
  );
}
