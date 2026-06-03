// 連載(categories)のデータアクセス層 ＋ 担当名簿(category_authors)の窓口。
// 「連載」＝このサイトでの「カテゴリ」の呼び名。親子（入れ子）構造あり（parentId が親の id）。
// 担当名簿＝「この書き手は、この連載の担当」を記録する表。1人＝1連載の運用。

import { eq, asc, sql } from 'drizzle-orm';
import { db } from './index';
import { categories, categoryAuthors, articles, users } from './schema';

// schema から型を自動生成（手書きしない＝設計とズレない）
export type Category = typeof categories.$inferSelect; // DBから読んだ1件の形
export type NewCategoryInput = {
  name: string;
  slug?: string | null;
  parentId?: number | null;
  sortOrder?: number;
};
export type UpdateCategoryInput = Partial<NewCategoryInput>;

// 件数を数える小さなヘルパー（削除前のチェックなどに使う）。
async function countWhere(
  table: typeof categories | typeof articles | typeof categoryAuthors,
  condition: ReturnType<typeof eq>,
): Promise<number> {
  const rows = await db
    .select({ n: sql<number>`count(*)` })
    .from(table)
    .where(condition);
  return rows[0]?.n ?? 0;
}

// ── Read：全件（並び順→id順）─────────────────────────────────
export async function listCategories(): Promise<Category[]> {
  return db
    .select()
    .from(categories)
    .orderBy(asc(categories.sortOrder), asc(categories.id));
}

// ── Read：1件（id で取得）────────────────────────────────────
export async function getCategoryById(id: number): Promise<Category | null> {
  const rows = await db
    .select()
    .from(categories)
    .where(eq(categories.id, id))
    .limit(1);
  return rows[0] ?? null;
}

// ── 親子を「親→子」の順に並べ、各行に深さ(depth)を付けて返す ──────
// プルダウンや一覧で、子連載を字下げ表示するのに使う（depth=0 が親、1 が子…）。
export type CategoryWithDepth = Category & { depth: number };
export function buildCategoryTree(cats: Category[]): CategoryWithDepth[] {
  // 親id → 子リスト の対応表を作る（トップ階層は parentId が null）。
  const childrenOf = new Map<number | null, Category[]>();
  for (const c of cats) {
    const key = c.parentId ?? null;
    const list = childrenOf.get(key) ?? [];
    list.push(c);
    childrenOf.set(key, list);
  }
  const result: CategoryWithDepth[] = [];
  const walk = (parentId: number | null, depth: number) => {
    for (const c of childrenOf.get(parentId) ?? []) {
      result.push({ ...c, depth });
      walk(c.id, depth + 1); // その子をたどる
    }
  };
  walk(null, 0);
  return result;
}

// ── 連載ごとの記事件数（連載一覧で「記事◯件」を出す・削除可否の判定にも使う）──
// 戻り値は { 連載id: 件数 } の対応表。記事0件の連載はキーに現れない。
export async function getArticleCountByCategory(): Promise<
  Record<number, number>
> {
  const rows = await db
    .select({ categoryId: articles.categoryId, n: sql<number>`count(*)` })
    .from(articles)
    .groupBy(articles.categoryId);
  const map: Record<number, number> = {};
  for (const r of rows) {
    if (r.categoryId != null) map[r.categoryId] = r.n;
  }
  return map;
}

// ある連載の「子孫」(子・孫…)の id を集める純粋関数。
// 編集画面の「親連載」選択肢から、自分自身と子孫を除いて循環(親子のループ)を防ぐのに使う。
export function getDescendantIds(cats: Category[], id: number): number[] {
  const childrenOf = new Map<number | null, Category[]>();
  for (const c of cats) {
    const key = c.parentId ?? null;
    const list = childrenOf.get(key) ?? [];
    list.push(c);
    childrenOf.set(key, list);
  }
  const result: number[] = [];
  const walk = (parentId: number) => {
    for (const c of childrenOf.get(parentId) ?? []) {
      result.push(c.id);
      walk(c.id);
    }
  };
  walk(id);
  return result;
}

// ── Create：新規作成 ─────────────────────────────────────────
export async function createCategory(
  input: NewCategoryInput,
): Promise<Category> {
  const [row] = await db
    .insert(categories)
    .values({
      name: input.name,
      slug: input.slug ?? null,
      parentId: input.parentId ?? null,
      sortOrder: input.sortOrder ?? 0,
    })
    .returning();
  return row;
}

// ── Update：更新（渡した項目だけ書き換え）────────────────────────
export async function updateCategory(
  id: number,
  input: UpdateCategoryInput,
): Promise<Category | null> {
  const patch: Partial<typeof categories.$inferInsert> = {};
  if (input.name !== undefined) patch.name = input.name;
  if (input.slug !== undefined) patch.slug = input.slug;
  if (input.parentId !== undefined) patch.parentId = input.parentId;
  if (input.sortOrder !== undefined) patch.sortOrder = input.sortOrder;

  const [row] = await db
    .update(categories)
    .set(patch)
    .where(eq(categories.id, id))
    .returning();
  return row ?? null;
}

// ── Delete：削除（消せない理由があれば reason を返す）──────────────
// 子連載がぶら下がっている／この連載の記事がある場合は消さない（データの迷子を防ぐ）。
// 担当名簿の登録は一緒に外す。
export async function deleteCategory(
  id: number,
): Promise<{ ok: boolean; reason?: string }> {
  const childCount = await countWhere(categories, eq(categories.parentId, id));
  if (childCount > 0) {
    return {
      ok: false,
      reason: 'この連載には子連載があります。先に子連載を移動または削除してください。',
    };
  }
  const articleCount = await countWhere(articles, eq(articles.categoryId, id));
  if (articleCount > 0) {
    return {
      ok: false,
      reason: `この連載には記事が${articleCount}件あります。先に記事の連載を変更してください。`,
    };
  }
  // 担当名簿の登録を外してから本体を削除。
  await db.delete(categoryAuthors).where(eq(categoryAuthors.categoryId, id));
  const rows = await db
    .delete(categories)
    .where(eq(categories.id, id))
    .returning({ id: categories.id });
  return { ok: rows.length > 0 };
}

// ── 担当名簿（category_authors）──────────────────────────────

// その書き手が担当している連載の一覧（並び順つき）。
export async function getCategoriesForUser(
  userId: number,
): Promise<Category[]> {
  return db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      parentId: categories.parentId,
      sortOrder: categories.sortOrder,
      wpTermId: categories.wpTermId,
    })
    .from(categoryAuthors)
    .innerJoin(categories, eq(categoryAuthors.categoryId, categories.id))
    .where(eq(categoryAuthors.userId, userId))
    .orderBy(asc(categories.sortOrder), asc(categories.id));
}

// 1人＝1連載の運用：その書き手の担当を「この連載だけ」に置き換える。
// categoryId が null なら担当をすべて外す（未割り当てに戻す）。
export async function setUserCategory(
  userId: number,
  categoryId: number | null,
): Promise<void> {
  await db.delete(categoryAuthors).where(eq(categoryAuthors.userId, userId));
  if (categoryId !== null) {
    await db.insert(categoryAuthors).values({ categoryId, userId });
  }
}

// その連載の担当者一覧（連載の編集画面で「担当者」を表示するのに使う）。
export async function getAuthorsForCategory(
  categoryId: number,
): Promise<{ id: number; name: string }[]> {
  return db
    .select({ id: users.id, name: users.name })
    .from(categoryAuthors)
    .innerJoin(users, eq(categoryAuthors.userId, users.id))
    .where(eq(categoryAuthors.categoryId, categoryId))
    .orderBy(asc(users.name));
}
