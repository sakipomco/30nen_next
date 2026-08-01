// 連打よけ（レートリミット）の共通部品。
//
// なにをするもの?
//   「同じ人が短時間に何回も同じ操作をした」ときに断るための仕組み。
//   お便りフォームの大量送信、ログインのパスワード総当たり、
//   パスワード再設定メールの連発などを止めるために使う。
//
// しくみ:
//   試行のたびに rate_events テーブルへ1行入れておき、
//   「直近◯秒のあいだに、この名札で何行あるか」を数える。上限を超えていたら断る。
//   → PM2 の再起動やデプロイをはさんでも記録が消えない（メモリではなくDBに置くため）。
//
// ⚠ Server Action は画面を経由せず直接POSTできる。呼び出し側は必ずこの確認を通すこと。

import { db } from '@/db';
import { rateEvents } from '@/db/schema';
import { and, eq, gt, lt, sql } from 'drizzle-orm';
import { headers } from 'next/headers';

// 1つの制限ルール。「windowSec 秒のあいだに limit 回まで」。
export type RateRule = {
  bucket: string; // 名札（操作＋相手）。例: 'login:ip:1.2.3.4'
  limit: number; // 上限回数
  windowSec: number; // 数える期間（秒）
};

// 判定結果。断るときは「あと何秒待てばよいか」の目安も返す。
export type RateResult = { ok: true } | { ok: false; retryAfterSec: number };

// SQLite の datetime('now') と同じ形（UTC の 'YYYY-MM-DD HH:MM:SS'）に揃える。
function utcStamp(date: Date): string {
  return date.toISOString().replace('T', ' ').slice(0, 19);
}

// 掃除の対象にする古さ。いちばん長い制限（1日）より余裕をもたせる。
const PURGE_AFTER_SEC = 2 * 24 * 60 * 60; // 2日

// 古い記録を捨てる。毎回やる必要はないので、たまに（およそ20回に1回）実行する。
async function purgeOccasionally(): Promise<void> {
  if (Math.random() > 0.05) return;
  const cutoff = utcStamp(new Date(Date.now() - PURGE_AFTER_SEC * 1000));
  await db.delete(rateEvents).where(lt(rateEvents.createdAt, cutoff));
}

// 1つの名札について、直近 windowSec 秒の件数を数える。
async function countRecent(bucket: string, windowSec: number): Promise<number> {
  const since = utcStamp(new Date(Date.now() - windowSec * 1000));
  const rows = await db
    .select({ n: sql<number>`count(*)` })
    .from(rateEvents)
    .where(and(eq(rateEvents.bucket, bucket), gt(rateEvents.createdAt, since)));
  return rows[0]?.n ?? 0;
}

// ── 上限に達していないか調べる（記録はしない）──────────────────
// ルールを1つでも超えていたら ok:false。
export async function checkRateLimit(rules: RateRule[]): Promise<RateResult> {
  for (const rule of rules) {
    if ((await countRecent(rule.bucket, rule.windowSec)) >= rule.limit) {
      return { ok: false, retryAfterSec: rule.windowSec };
    }
  }
  return { ok: true };
}

// ── 試行を1回ぶん記録する ─────────────────────────────────
// 上限に達していても「試したこと」自体は残す（連打をやめない相手ほど待ち時間が延びる）。
// ⚠ 同じ名札が複数渡ることがある（例: 同じIPに「1分3回」と「1日30回」の2つのルールを付けるとき）。
//    そのまま入れると1回の試行が2回ぶん数えられてしまうので、重複は取り除いてから記録する。
export async function recordRateEvent(buckets: string[]): Promise<void> {
  const unique = [...new Set(buckets)];
  if (unique.length === 0) return;
  await db.insert(rateEvents).values(unique.map((bucket) => ({ bucket })));
  await purgeOccasionally();
}

// ── 「調べて、記録する」をまとめて行う ──────────────────────────
// お便り送信のように「実行した回数そのもの」を数えたい操作で使う。
export async function consumeRateLimit(rules: RateRule[]): Promise<RateResult> {
  const result = await checkRateLimit(rules);
  await recordRateEvent(rules.map((r) => r.bucket));
  return result;
}

// ── 相手のIPアドレスを取り出す ───────────────────────────────
// 本番は Nginx が X-Real-IP / X-Forwarded-For を付けてくれる（docs/deploy-notes.md）。
// ローカル開発では付かないので 'unknown' になる（＝1つの名札にまとまる）。
export async function clientIp(): Promise<string> {
  const h = await headers();
  const real = h.get('x-real-ip')?.trim();
  if (real) return real;
  // X-Forwarded-For は「元の人, 経由1, 経由2」と並ぶので先頭が本人。
  const forwarded = h.get('x-forwarded-for')?.split(',')[0]?.trim();
  if (forwarded) return forwarded;
  return 'unknown';
}

// 待ち時間を「◯分」「◯時間」のような日本語にする（画面の案内文用）。
export function waitLabel(seconds: number): string {
  if (seconds < 60) return `${seconds}秒`;
  if (seconds < 3600) return `${Math.ceil(seconds / 60)}分`;
  if (seconds < 86400) return `${Math.ceil(seconds / 3600)}時間`;
  return `${Math.ceil(seconds / 86400)}日`;
}
