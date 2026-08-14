// 連載(categories)のデータアクセス層 ＋ 担当名簿(category_authors)の窓口。
// 「連載」＝このサイトでの「カテゴリ」の呼び名。親子（入れ子）構造あり（parentId が親の id）。
// 担当名簿＝「この書き手は、この連載の担当」を記録する表。1人＝1連載の運用。

import { eq, asc, desc, sql } from 'drizzle-orm';
import { db } from './index';
import { categories, categoryAuthors, articles, users } from './schema';
import { toPublicUser, type PublicUser } from './users';

// schema から型を自動生成（手書きしない＝設計とズレない）
export type Category = typeof categories.$inferSelect; // DBから読んだ1件の形
export type NewCategoryInput = {
  name: string;
  slug?: string | null;
  parentId?: number | null;
  sortOrder?: number;
  imagePath?: string | null; // 連載のイメージ画像パス（右サイドバー「小商店」に表示）
  reading?: string | null; // ヨミガナ（カタカナ・記事ページのカテゴリー帯に表示）
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

// ── Read：ある連載の「子連載」一覧（親ページで子をカバー画像で並べる用）──
// 例：「度々の旅」（親・記事なしの器）を開くと、子の「山陰編」などをカバーで見せる。
// 並びは「新しく作った子連載が先（左上）」＝id の大きい順（SAKIさん指定 2026-08-12）。
// あとから作った子連載ほど id が大きくなるので、管理画面の「並び順」の数字を
// 付け替えなくても、新しい「〇〇編」が自動で左上に入り、古いものが下に送られる。
export async function getChildCategories(parentId: number): Promise<Category[]> {
  return db
    .select()
    .from(categories)
    .where(eq(categories.parentId, parentId))
    .orderBy(desc(categories.id));
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

// ── Read：1件（slug で取得。連載別一覧ページのURL用）──────────────
export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const rows = await db
    .select()
    .from(categories)
    .where(eq(categories.slug, slug))
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
      imagePath: input.imagePath ?? null,
      reading: input.reading ?? null,
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
  if (input.imagePath !== undefined) patch.imagePath = input.imagePath;
  if (input.reading !== undefined) patch.reading = input.reading;

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

// 投稿フォームで「その人が選べる連載」を返す（字下げ用の depth つき）。
//  - 投稿者(author)で担当連載が登録済み → その担当連載と、その子連載（範囲内だけで選べる）
//  - 管理者(admin)、または担当未設定の投稿者 → 全連載（親子を字下げ表示）
//
// ★ 担当が親連載なら、その子連載にも書ける ★
//   「度々の旅」のような親は記事を入れない“器”で、実際の記事は子の「欧州編」などに入る。
//   担当連載だけを返していたころは、親を担当する人が子を選べず**どこにも書けなかった**
//   （2026-07-29 minowanaokoさんから「欧州編が選べない」と連絡があり判明）。
//   子孫まで含めることで、新しい旅の編を作っても担当の付け替えなしで書けるようにする。
export async function listSelectableCategories(user: {
  id: number;
  role: 'admin' | 'author';
}): Promise<{ id: number; name: string; depth: number }[]> {
  const all = await listCategories();
  if (user.role === 'author') {
    const ids = await getWritableCategoryIds(user.id, all);
    if (ids.size > 0) {
      // 並びは連載の並び順（listCategories の順）に合わせる。
      // 子は親の下に来るので、親を担当している場合だけ字下げして分かりやすくする。
      return all
        .filter((c) => ids.has(c.id))
        .map((c) => ({
          id: c.id,
          name: c.name,
          // 親も選べる場合のみ子を字下げ（担当が子だけなら字下げ不要）
          depth: c.parentId != null && ids.has(c.parentId) ? 1 : 0,
        }));
    }
  }
  return buildCategoryTree(all).map((c) => ({
    id: c.id,
    name: c.name,
    depth: c.depth,
  }));
}

// その書き手が「書いてよい」連載の id 一式（担当連載＋その子孫）。担当未登録なら空。
//
// ★ 投稿フォームの選択肢と、保存するときの合否判定は必ずこれを使う ★
//   以前は「プルダウンを作る側」だけが子孫を含めていて、「保存する側」は
//   担当そのものしか許していなかった。そのため、あとから作った子連載は
//   **画面には出るのに、投稿を押すと「担当の連載の中から選んでください。」で
//   はじかれる**という食い違いが起きていた
//   （2026-08-15 minowanaokoさんから「瀬戸内海編が選べない」と連絡があり判明）。
export async function getWritableCategoryIds(
  userId: number,
  cats?: Category[],
): Promise<Set<number>> {
  const all = cats ?? (await listCategories());
  const assigned = await getCategoriesForUser(userId);
  // 担当そのものが子孫にも含まれうるので **Set で重複を取り除く**
  // （例: 度々の旅・山陰編・欧州編 を担当していると、「度々の旅の子孫」として
  // 山陰編・欧州編が二重に出てしまうため）。
  const ids = new Set<number>();
  for (const c of assigned) {
    ids.add(c.id);
    for (const d of getDescendantIds(all, c.id)) ids.add(d);
  }
  return ids;
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
      imagePath: categories.imagePath,
      reading: categories.reading,
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

// 全員ぶんの「担当連載」を一度にまとめて取得する（ユーザー一覧の表示用）。
// 戻り値は { 投稿者id: { id, name } }。1人1連載の前提（複数あれば最後の1件）。
export async function getAssignmentsMap(): Promise<
  Record<number, { id: number; name: string }>
> {
  const rows = await db
    .select({
      userId: categoryAuthors.userId,
      id: categories.id,
      name: categories.name,
    })
    .from(categoryAuthors)
    .innerJoin(categories, eq(categoryAuthors.categoryId, categories.id));
  const map: Record<number, { id: number; name: string }> = {};
  for (const r of rows) map[r.userId] = { id: r.id, name: r.name };
  return map;
}

// お便りフォームの宛先解決用：その連載の担当書き手の「メールアドレス」を取り出す。
//  - 連載名と、担当者のメール一覧を返す（メールはサーバー側だけで使う＝ブラウザに渡さない）。
//  - 担当が未登録なら emails は空配列（呼び出し側で店主へフォールバックする）。
export async function getCategoryAuthorEmails(
  categoryId: number,
): Promise<{ categoryName: string | null; emails: string[] }> {
  const cat = await getCategoryById(categoryId);
  if (!cat) return { categoryName: null, emails: [] };
  const rows = await db
    .select({ email: users.email })
    .from(categoryAuthors)
    .innerJoin(users, eq(categoryAuthors.userId, users.id))
    .where(eq(categoryAuthors.categoryId, categoryId));
  return { categoryName: cat.name, emails: rows.map((r) => r.email) };
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

// その連載の担当書き手のプロフィール一式（連載ページ下部の「書き手」欄用）。
// 担当2名の連載（CAL TATAU・エフェメラ！など）は全員ぶん返す。
export async function getPublicAuthorsForCategory(
  categoryId: number,
): Promise<PublicUser[]> {
  const rows = await db
    .select({ user: users })
    .from(categoryAuthors)
    .innerJoin(users, eq(categoryAuthors.userId, users.id))
    .where(eq(categoryAuthors.categoryId, categoryId))
    .orderBy(asc(users.name));
  return rows.map((r) => toPublicUser(r.user));
}
