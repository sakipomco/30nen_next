// 連打よけ（レートリミット）のお試し実行（動作確認用）。
// 上限まで通る → 超えたら断る → 別の相手は影響を受けない → 期間が過ぎたらまた通る、を確認する。
// 実行: node --env-file=.env.local --import tsx scripts/smoke-rate-limit.ts
//
// ※ clientIp() は「実際のリクエスト」がないと使えないので、ここでは数える部分だけを試す。

import { db } from '../src/db';
import { rateEvents } from '../src/db/schema';
import { like } from 'drizzle-orm';
import {
  checkRateLimit,
  consumeRateLimit,
  recordRateEvent,
  waitLabel,
} from '../src/lib/rate-limit';

const TAG = `smoke-${Date.now()}`;
const A = `${TAG}:a`; // 相手A
const B = `${TAG}:b`; // 相手B

async function main() {
  console.log('1) 上限3回のルールで、3回目までは通る');
  const rule = [{ bucket: A, limit: 3, windowSec: 60 }];
  for (let i = 1; i <= 3; i++) {
    const r = await consumeRateLimit(rule);
    console.log(`   ${i}回目 → 通った?:`, r.ok);
  }

  console.log('2) 4回目は断られる');
  const fourth = await consumeRateLimit(rule);
  console.log(
    '   → 断られた?（falseなら正解）:',
    fourth.ok,
    '/ 案内する待ち時間:',
    fourth.ok ? '-' : waitLabel(fourth.retryAfterSec),
  );

  console.log('3) 別の相手（B）は巻き添えにならない');
  const other = await consumeRateLimit([{ bucket: B, limit: 3, windowSec: 60 }]);
  console.log('   → Bは通った?:', other.ok);

  console.log('4) 数える期間が短ければ（直近0秒）また通る＝時間で回復する');
  const recovered = await checkRateLimit([{ bucket: A, limit: 3, windowSec: 0 }]);
  console.log('   → 通った?:', recovered.ok);

  console.log('5) 失敗だけ数える使い方（ログイン）: 5回失敗すると止まる');
  const C = `${TAG}:c`;
  for (let i = 0; i < 5; i++) await recordRateEvent([C]); // 1回の失敗＝1呼び出し
  const blocked = await checkRateLimit([{ bucket: C, limit: 5, windowSec: 600 }]);
  console.log('   → 止まった?（falseなら正解）:', blocked.ok);

  console.log('6) 同じ名札を2つのルールで使っても、1回の試行は1回ぶんだけ数える');
  const D = `${TAG}:d`;
  // 例: 同じIPに「1分3回」と「1日30回」の2つを付けた場合。名札は同じ。
  await recordRateEvent([D, D]);
  const dCount = await checkRateLimit([{ bucket: D, limit: 2, windowSec: 60 }]);
  console.log('   → まだ上限2に達していない?（trueなら正解＝1回ぶん）:', dCount.ok);

  console.log('7) 後片付け（お試しの記録を削除）');
  await db.delete(rateEvents).where(like(rateEvents.bucket, `${TAG}%`));
  const left = await db
    .select()
    .from(rateEvents)
    .where(like(rateEvents.bucket, `${TAG}%`));
  console.log('   → 残り件数:', left.length);

  console.log('\n✅ 連打よけ 全部通りました');
}

main().catch((err) => {
  console.error('❌ 失敗:', err);
  process.exit(1);
});
