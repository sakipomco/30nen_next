// パスワード再設定スクリプト（メール宛のユーザーのパスワードを上書き）
//
// 実行例:
//   EMAIL="me@example.com" NEW_PASSWORD="ひみつ" \
//     node --env-file=.env.local --import tsx scripts/reset-password.ts

import { getUserByEmail, updateUser } from '../src/db/users';

async function main() {
  const email = process.env.EMAIL;
  const newPassword = process.env.NEW_PASSWORD;

  if (!email || !newPassword) {
    console.error(
      '使い方: EMAIL と NEW_PASSWORD を環境変数で渡してください。\n' +
        '例: EMAIL="me@example.com" NEW_PASSWORD="ひみつ" \\\n' +
        '      node --env-file=.env.local --import tsx scripts/reset-password.ts',
    );
    process.exit(1);
  }

  const target = await getUserByEmail(email);
  if (!target) {
    console.error(`そのメールアドレスのユーザーが見つかりません: ${email}`);
    process.exit(1);
  }

  const updated = await updateUser(target.id, { password: newPassword });
  if (!updated) {
    console.error('更新に失敗しました。');
    process.exit(1);
  }

  console.log('✅ パスワードを更新しました:', {
    id: updated.id,
    name: updated.name,
    email: updated.email,
    role: updated.role,
  });
}

main().catch((e) => {
  console.error('❌ エラー:', e);
  process.exit(1);
});
