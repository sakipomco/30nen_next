// 投稿者を1人つくるスクリプト（管理画面ができるまでの、ユーザー追加用ツール）。
// 値は環境変数で渡す。パスワードはこの中でハッシュ化されてからDBに保存される。
//
// 実行例:
//   NAME="SAKI" EMAIL="saki@example.com" PASSWORD="ひみつ" ROLE=admin \
//     node --env-file=.env.local --import tsx scripts/create-user.ts
//
//   ROLE は admin（管理者）か author（投稿者）。省略時は author。

import { createUser, getUserByEmail } from '../src/db/users';

async function main() {
  const name = process.env.NAME;
  const email = process.env.EMAIL;
  const password = process.env.PASSWORD;
  const role = (process.env.ROLE ?? 'author') as 'admin' | 'author';

  if (!name || !email || !password) {
    console.error(
      '使い方: NAME・EMAIL・PASSWORD（任意でROLE）を環境変数で渡してください。\n' +
        '例: NAME="SAKI" EMAIL="saki@example.com" PASSWORD="ひみつ" ROLE=admin \\\n' +
        '      node --env-file=.env.local --import tsx scripts/create-user.ts',
    );
    process.exit(1);
  }
  if (role !== 'admin' && role !== 'author') {
    console.error('ROLE は admin か author を指定してください。');
    process.exit(1);
  }

  const exists = await getUserByEmail(email);
  if (exists) {
    console.error(`そのメールアドレスは既に登録済みです（id: ${exists.id}）。`);
    process.exit(1);
  }

  const user = await createUser({ name, email, password, role });
  console.log('✅ 作成しました:', {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  });
}

main().catch((e) => {
  console.error('❌ エラー:', e);
  process.exit(1);
});
