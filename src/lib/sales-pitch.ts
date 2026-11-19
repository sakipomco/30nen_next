// お便りフォームに届く「営業メール（相互リンクの売り込み）」を見分ける。
//
// 背景（2026-11-19）: 救出した30通がすべて相互リンクの売り込みだった。ハニーポットはすり抜けるが、
// 文面に決まった癖がある（ほぼ全部に「相互リンク」、22通に「管理番号: <UUID>」、返信先が backlink@…）。
//
// ⚠ 見分けても捨てない。件名に目印をつけて店主へ届けるだけ（本物のお便りを失わないため）。
//    判定を増やすときも「本物の読者が書きそうにない言葉」に限ること。

const PATTERNS: RegExp[] = [
  /相互\s*リンク/,
  /リンク(の)?掲載/,
  /お互いを(ご)?紹介/,
  /紹介し合/,
  // 「管理番号: 97c97a38-1e7c-...」のような UUID 形式の番号
  /管理番号\s*[:：]\s*[0-9a-f]{8}-[0-9a-f]{4}-/i,
];

export function looksLikeSalesPitch(input: {
  name: string;
  email: string;
  message: string;
}): boolean {
  const text = `${input.name}\n${input.message}`;
  if (PATTERNS.some((re) => re.test(text))) return true;
  // 返信先が backlink@… （被リンク営業の専用アドレス）
  if (/^backlink@/i.test(input.email)) return true;
  return false;
}
