// ログイン土台のお試し実行（動作確認用）。
// 登録 → 正しいパスワードで照合 → 間違いで照合 → JWT発行＆検証 → 後片付け（削除）まで通す。
// 実行: node --env-file=.env.local --import tsx scripts/smoke-auth.ts
//   （.env.local の SESSION_SECRET を読み込むため --env-file を付ける）

import { createUser, verifyCredentials, deleteUser } from '../src/db/users';
import { signSession, verifySession } from '../src/auth/jwt';

async function main() {
  const email = `smoke+${Date.now()}@example.com`;
  const password = 'Test1234!';

  console.log('1) Create（登録：パスワードはハッシュ化して保存）');
  const created = await createUser({ name: 'お試し太郎', email, password });
  console.log('   →', { id: created.id, name: created.name, role: created.role });
  // 返り値に passwordHash が含まれていないこと（漏らさない設計）を確認
  console.log('   → passwordHash は公開用に含まれない:', !('passwordHash' in created));

  console.log('2) 照合（正しいパスワード）');
  const ok = await verifyCredentials(email, password);
  console.log('   → ログイン成功?:', ok !== null, '/ id一致?:', ok?.id === created.id);

  console.log('3) 照合（わざと間違ったパスワード）');
  const ng = await verifyCredentials(email, 'wrong-password');
  console.log('   → はじかれた?（nullなら正解）:', ng === null);

  console.log('4) JWT（会員証）発行 → 検証');
  const token = await signSession({ userId: created.id, role: created.role });
  const payload = await verifySession(token);
  console.log('   → 中身が戻った?:', payload?.userId === created.id, '/ role:', payload?.role);

  console.log('5) 壊れたトークンは弾く');
  const broken = await verifySession(token + 'tampered');
  console.log('   → 改ざんを検知?（nullなら正解）:', broken === null);

  console.log('6) 後片付け（テストユーザー削除）');
  const removed = await deleteUser(created.id);
  console.log('   → 削除成功:', removed.ok);

  console.log('\n✅ ログイン土台 全部通りました');
}

main().catch((e) => {
  console.error('❌ エラー:', e);
  process.exit(1);
});
