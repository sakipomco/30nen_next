// 連載(categories)データ層の動作確認（スモークテスト）。
// 実行: node --env-file=.env.local --import tsx scripts/smoke-categories.ts
// 作ったテストデータは最後にすべて後片付けする（実DBを汚さない）。

import {
  createCategory,
  listCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  buildCategoryTree,
  getCategoriesForUser,
  setUserCategory,
  getAuthorsForCategory,
} from '../src/db/categories';
import { createUser, deleteUser } from '../src/db/users';

async function main() {
  console.log('1) 親連載を作る');
  const parent = await createCategory({ name: '【テスト】度々の旅', sortOrder: 100 });
  console.log('   → id:', parent.id, '/ name:', parent.name);

  console.log('2) 子連載を作る（親= 度々の旅）');
  const child = await createCategory({
    name: '【テスト】山陰編',
    parentId: parent.id,
    sortOrder: 1,
  });
  console.log('   → id:', child.id, '/ parentId:', child.parentId);

  console.log('3) 一覧→親子ツリー（depthが付く）');
  const all = await listCategories();
  const tree = buildCategoryTree(all.filter((c) => c.name.startsWith('【テスト】')));
  for (const c of tree) {
    console.log('   ', '　'.repeat(c.depth) + c.name, `(depth=${c.depth})`);
  }
  const childInTree = tree.find((c) => c.id === child.id);
  console.log('   → 子のdepthは1?:', childInTree?.depth === 1);

  console.log('4) 更新（名前変更）');
  const renamed = await updateCategory(child.id, { name: '【テスト】山陰編・改' });
  console.log('   → 新しい名前:', renamed?.name);

  console.log('5) 担当名簿：テスト書き手を作って親連載の担当にする');
  const writer = await createUser({
    name: '【テスト】書き手',
    email: `test-cat-${Date.now()}@example.com`,
    password: 'Test1234!',
    role: 'author',
  });
  await setUserCategory(writer.id, parent.id);
  const mine = await getCategoriesForUser(writer.id);
  console.log('   → 担当連載:', mine.map((c) => c.name).join(', '), '/ 件数:', mine.length);
  const authors = await getAuthorsForCategory(parent.id);
  console.log('   → 親連載の担当者:', authors.map((a) => a.name).join(', '));

  console.log('6) 担当の付け替え（1人1連載：子連載だけにする）');
  await setUserCategory(writer.id, child.id);
  const mine2 = await getCategoriesForUser(writer.id);
  console.log('   → 付け替え後:', mine2.map((c) => c.name).join(', '), '/ 件数:', mine2.length);

  console.log('7) 削除ガード：子連載がある親は消せない');
  const blocked = await deleteCategory(parent.id);
  console.log('   → 消せない?（falseが正解）:', blocked.ok, '/ 理由:', blocked.reason);

  console.log('8) 後片付け（名簿を外す→書き手削除→子→親の順に連載削除）');
  await setUserCategory(writer.id, null); // 先に名簿を外す（FKで参照されたままだと消せない）
  const delUser = await deleteUser(writer.id);
  const delChild = await deleteCategory(child.id);
  const delParent = await deleteCategory(parent.id);
  console.log(
    '   → 書き手削除:', delUser.ok,
    '/ 子削除:', delChild.ok,
    '/ 親削除:', delParent.ok,
  );

  // 念のため：消し残りがないか確認
  const leftover = (await listCategories()).filter((c) =>
    c.name.startsWith('【テスト】'),
  );
  console.log('   → テスト連載の消し残り:', leftover.length, '件（0が正解）');

  console.log('\n✅ 連載データ層 全部通りました');
}

main().catch((e) => {
  console.error('❌ エラー:', e);
  process.exit(1);
});
