// 記事CRUDのお試し実行（動作確認用）。作る→読む→直す→一覧→消す、を通す。
// 実行: npx tsx scripts/smoke-articles.ts
import {
  createArticle,
  getArticleById,
  updateArticle,
  listArticles,
  deleteArticle,
} from '../src/db/articles';

async function main() {
  console.log('1) Create（作る）');
  const created = await createArticle({
    title: 'お試し記事',
    content: '<p>これはテストです。</p>',
    slug: 'smoke-test-' + Date.now(),
    status: 'draft',
  });
  console.log('   →', { id: created.id, title: created.title, status: created.status, publishedAt: created.publishedAt });

  console.log('2) Read（読む）');
  const read = await getArticleById(created.id);
  console.log('   →', read?.title, '/ createdAt:', read?.createdAt);

  console.log('3) Update（直す：公開にする）');
  const updated = await updateArticle(created.id, { status: 'published', title: 'お試し記事（公開）' });
  console.log('   →', { title: updated?.title, status: updated?.status, publishedAt: updated?.publishedAt, updatedAt: updated?.updatedAt });

  console.log('4) List（一覧：公開のみ）');
  const published = await listArticles({ status: 'published', limit: 5 });
  console.log('   → 公開記事 件数:', published.length, '（先頭:', published[0]?.title, '）');

  console.log('5) Delete（消す）');
  const ok = await deleteArticle(created.id);
  const after = await getArticleById(created.id);
  console.log('   → 削除成功:', ok, '/ 消えた?:', after === null);

  console.log('\n✅ CRUD 全部通りました');
}

main().catch((e) => {
  console.error('❌ エラー:', e);
  process.exit(1);
});
