// 日時のタイムゾーン変換をまとめた係。
// DBは UTC（世界標準時）の 'YYYY-MM-DD HH:MM:SS' 形式で保存している。
// 一方サイトの利用者は日本時間（JST = UTC+9時間）で考える。ここで橋渡しする。
//
// なぜ自前で +9 するか: サーバーの時刻設定（タイムゾーン）が環境によって違っても、
// 「入力は日本時間」という前提を崩さないため（サーバー任せにしない）。

const pad = (n: number) => String(n).padStart(2, '0');

// DBのUTC文字列 → 一覧などの表示用（日本時間の読みやすい形）
export function formatJst(utc: string): string {
  const d = new Date(utc.replace(' ', 'T') + 'Z'); // 末尾Zを付けてUTCとして解釈
  return d.toLocaleString('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// DBのUTC文字列 → 日時入力欄(datetime-local)の値（'YYYY-MM-DDTHH:MM'・日本時間）
export function utcToJstInput(utc: string): string {
  const d = new Date(utc.replace(' ', 'T') + 'Z');
  const jst = new Date(d.getTime() + 9 * 60 * 60 * 1000); // 9時間進めて日本時間の「壁掛け時計」にする
  return (
    `${jst.getUTCFullYear()}-${pad(jst.getUTCMonth() + 1)}-${pad(jst.getUTCDate())}` +
    `T${pad(jst.getUTCHours())}:${pad(jst.getUTCMinutes())}`
  );
}

// 日時入力欄の値（日本時間扱い 'YYYY-MM-DDTHH:MM'）→ DB保存用のUTC 'YYYY-MM-DD HH:MM:SS'
export function jstInputToUtc(input: string): string {
  const withSeconds = input.length === 16 ? input + ':00' : input; // 秒が無ければ補う
  const d = new Date(withSeconds + '+09:00'); // 日本時間として明示的に解釈
  return d.toISOString().slice(0, 19).replace('T', ' ');
}
