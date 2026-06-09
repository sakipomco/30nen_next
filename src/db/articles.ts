// 記事(articles)のデータアクセス層。
// 「DBとのやり取り役」をここに集約する。公開ページの表示も、投稿画面の保存も、ここの関数を呼ぶ。
// CRUD = Create(作る) / Read(読む) / Update(直す) / Delete(消す)。

import { eq, ne, lt, gt, desc, asc, and, or, lte, sql, type SQL } from 'drizzle-orm';
import { db } from './index';
import { articles, users, categories } from './schema';
import type { PublicUser } from './users';

// schema から型を自動生成（手書きしない＝設計とズレない）
export type Article = typeof articles.$inferSelect; // DBから読んだ1件の形

// この記事を編集・削除してよい人か？
//  - admin（管理者）は全記事OK。
//  - author（投稿者）は自分が書いた記事だけOK（authorId が本人）。
// ※ 画面のボタン非表示だけでは Server Action への直接送信を防げないため、
//   更新・削除・編集画面の入口で必ずこの判定を通す（R-01 対策）。
export function canManageArticle(
  user: PublicUser,
  article: Pick<Article, 'authorId'>,
): boolean {
  return user.role === 'admin' || article.authorId === user.id;
}
export type NewArticleInput = {
  title: string;
  content?: string;
  slug?: string | null;
  excerpt?: string | null;
  status?: 'draft' | 'published';
  authorId?: number | null;
  categoryId?: number | null;
  publishedAt?: string | null;
  featuredImagePath?: string | null;
};
export type UpdateArticleInput = Partial<NewArticleInput>;

const now = () => new Date().toISOString().slice(0, 19).replace('T', ' '); // 'YYYY-MM-DD HH:MM:SS'

// ── Read：一覧 ───────────────────────────────────────────
// status を渡すと下書き/公開で絞り込み。新しい順（作成日時の降順）に返す。
export async function listArticles(options?: {
  status?: 'draft' | 'published';
  authorId?: number; // 指定すると、その投稿者の記事だけに絞る（投稿者の管理一覧用）
  limit?: number;
  offset?: number;
}): Promise<Article[]> {
  const filters: SQL[] = [];
  if (options?.status) filters.push(eq(articles.status, options.status));
  if (options?.authorId != null)
    filters.push(eq(articles.authorId, options.authorId));

  return db
    .select()
    .from(articles)
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(desc(articles.createdAt))
    .limit(options?.limit ?? 50)
    .offset(options?.offset ?? 0);
}

// ── Read：1件（id で取得）────────────────────────────────
export async function getArticleById(id: number): Promise<Article | null> {
  const rows = await db.select().from(articles).where(eq(articles.id, id)).limit(1);
  return rows[0] ?? null;
}

// ── Read：1件（slug で取得。公開ページのURL用）──────────────
export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const rows = await db.select().from(articles).where(eq(articles.slug, slug)).limit(1);
  return rows[0] ?? null;
}

// ── Create：新規作成 ─────────────────────────────────────
// status が 'published' のときは公開日時を自動で入れる（未指定なら今）。
export async function createArticle(input: NewArticleInput): Promise<Article> {
  const status = input.status ?? 'draft';
  const [row] = await db
    .insert(articles)
    .values({
      title: input.title,
      content: input.content ?? '',
      slug: input.slug ?? null,
      excerpt: input.excerpt ?? null,
      featuredImagePath: input.featuredImagePath ?? null,
      status,
      authorId: input.authorId ?? null,
      categoryId: input.categoryId ?? null,
      publishedAt:
        input.publishedAt ?? (status === 'published' ? now() : null),
    })
    .returning();
  return row;
}

// ── Update：更新（渡した項目だけ書き換え）────────────────────
// updated_at は常に今に更新。下書き→公開へ変えたとき、公開日時が空なら今を入れる。
export async function updateArticle(
  id: number,
  input: UpdateArticleInput,
): Promise<Article | null> {
  const patch: Partial<typeof articles.$inferInsert> = { updatedAt: now() };

  if (input.title !== undefined) patch.title = input.title;
  if (input.content !== undefined) patch.content = input.content;
  if (input.slug !== undefined) patch.slug = input.slug;
  if (input.excerpt !== undefined) patch.excerpt = input.excerpt;
  if (input.featuredImagePath !== undefined)
    patch.featuredImagePath = input.featuredImagePath;
  if (input.authorId !== undefined) patch.authorId = input.authorId;
  if (input.categoryId !== undefined) patch.categoryId = input.categoryId;
  if (input.publishedAt !== undefined) patch.publishedAt = input.publishedAt;
  if (input.status !== undefined) {
    patch.status = input.status;
    if (input.status === 'published' && input.publishedAt === undefined) {
      const current = await getArticleById(id);
      if (current && !current.publishedAt) patch.publishedAt = now();
    }
  }

  const [row] = await db
    .update(articles)
    .set(patch)
    .where(eq(articles.id, id))
    .returning();
  return row ?? null;
}

// ── Delete：削除（消せたら true）──────────────────────────
export async function deleteArticle(id: number): Promise<boolean> {
  const rows = await db.delete(articles).where(eq(articles.id, id)).returning({ id: articles.id });
  return rows.length > 0;
}

// ────────────────────────────────────────────────────────
// 公開ページ用（著者・連載情報を JOIN して取得）
// 「公開済み」＋「公開日時が今以前」の記事だけを対象にする（予約投稿対応）。
// ────────────────────────────────────────────────────────

export type PublicArticle = {
  id: number;
  title: string;
  slug: string | null;
  content: string;
  excerpt: string | null;
  featuredImagePath: string | null;
  publishedAt: string | null;
  authorId: number | null;
  authorName: string | null;
  authorAvatarPath: string | null;
  categoryId: number | null;
  categoryName: string | null;
  categorySlug: string | null;
  categoryImagePath: string | null;
  categoryReading: string | null;
};

// 公開記事を絞り込むフィルター（status=published かつ publishedAt が今以前）
function publicFilters(categoryId?: number): SQL[] {
  const filters: SQL[] = [
    eq(articles.status, 'published'),
    lte(articles.publishedAt, now()),
  ];
  if (categoryId != null) filters.push(eq(articles.categoryId, categoryId));
  return filters;
}

// JOIN して取得するときの select 項目
const publicColumns = {
  id: articles.id,
  title: articles.title,
  slug: articles.slug,
  content: articles.content,
  excerpt: articles.excerpt,
  featuredImagePath: articles.featuredImagePath,
  publishedAt: articles.publishedAt,
  authorId: articles.authorId,
  authorName: users.name,
  authorAvatarPath: users.avatarPath,
  categoryId: articles.categoryId,
  categoryName: categories.name,
  categorySlug: categories.slug,
  categoryImagePath: categories.imagePath,
  categoryReading: categories.reading,
};

// ── 公開記事一覧 ────────────────────────────────────────
export async function listPublishedArticles(options?: {
  limit?: number;
  offset?: number;
  categoryId?: number;
}): Promise<PublicArticle[]> {
  const filters = publicFilters(options?.categoryId);
  return db
    .select(publicColumns)
    .from(articles)
    .leftJoin(users, eq(articles.authorId, users.id))
    .leftJoin(categories, eq(articles.categoryId, categories.id))
    .where(and(...filters))
    .orderBy(desc(articles.publishedAt))
    .limit(options?.limit ?? 20)
    .offset(options?.offset ?? 0);
}

// ── 公開記事の件数（ページ数の計算用）──────────────────
export async function countPublishedArticles(categoryId?: number): Promise<number> {
  const filters = publicFilters(categoryId);
  const rows = await db
    .select({ n: sql<number>`count(*)` })
    .from(articles)
    .where(and(...filters));
  return rows[0]?.n ?? 0;
}

// ── アーカイブ用: 公開記事を「年月（日本時間JST）」ごとに件数集計 ──
// publishedAt はUTC保存なので +9時間してJSTの年月でまとめる。新しい月が上。
export type ArchiveMonth = { year: number; month: number; count: number };

export async function listArchiveMonths(): Promise<ArchiveMonth[]> {
  const jst = sql`datetime(${articles.publishedAt}, '+9 hours')`;
  const ym = sql<string>`strftime('%Y-%m', ${jst})`;
  const rows = await db
    .select({
      year: sql<number>`cast(strftime('%Y', ${jst}) as integer)`,
      month: sql<number>`cast(strftime('%m', ${jst}) as integer)`,
      count: sql<number>`count(*)`,
    })
    .from(articles)
    .where(and(...publicFilters()))
    .groupBy(ym)
    .orderBy(sql`${ym} desc`);
  return rows;
}

// ── 公開記事を slug で取得（記事詳細ページ用）────────────
export async function getPublishedArticleBySlug(slug: string): Promise<PublicArticle | null> {
  const rows = await db
    .select(publicColumns)
    .from(articles)
    .leftJoin(users, eq(articles.authorId, users.id))
    .leftJoin(categories, eq(articles.categoryId, categories.id))
    .where(and(eq(articles.slug, slug), eq(articles.status, 'published'), lte(articles.publishedAt, now())))
    .limit(1);
  return rows[0] ?? null;
}

// ── 公開記事を id で取得（slug がない記事のフォールバック用）──
export async function getPublishedArticleById(id: number): Promise<PublicArticle | null> {
  const rows = await db
    .select(publicColumns)
    .from(articles)
    .leftJoin(users, eq(articles.authorId, users.id))
    .leftJoin(categories, eq(articles.categoryId, categories.id))
    .where(and(eq(articles.id, id), eq(articles.status, 'published'), lte(articles.publishedAt, now())))
    .limit(1);
  return rows[0] ?? null;
}

// ── 「前後の日記」を取得（記事詳細ページの ← → ナビ用）──
// 公開日時の並びで、今の記事の「1つ古い記事(prev)」と「1つ新しい記事(next)」を返す。
// 公開日時が同じ記事があってもズレないよう、id を第2の基準にする（同時刻の取りこぼし防止）。
// categoryId を渡すとその連載内だけ／省くと三十年商店“全体”の前後になる。
export async function getAdjacentArticles(params: {
  publishedAt: string;
  articleId: number;
  categoryId?: number;
}): Promise<{ prev: PublicArticle | null; next: PublicArticle | null }> {
  const { categoryId, publishedAt, articleId } = params;
  const base = [
    eq(articles.status, 'published'),
    lte(articles.publishedAt, now()),
    ...(categoryId != null ? [eq(articles.categoryId, categoryId)] : []),
  ];

  const select = () =>
    db
      .select(publicColumns)
      .from(articles)
      .leftJoin(users, eq(articles.authorId, users.id))
      .leftJoin(categories, eq(articles.categoryId, categories.id));

  // 前の日記＝これより古い中で一番近い記事（新しい順に並べた先頭）
  const prevRows = await select()
    .where(
      and(
        ...base,
        or(
          lt(articles.publishedAt, publishedAt),
          and(eq(articles.publishedAt, publishedAt), lt(articles.id, articleId)),
        ),
      ),
    )
    .orderBy(desc(articles.publishedAt), desc(articles.id))
    .limit(1);

  // 次の日記＝これより新しい中で一番近い記事（古い順に並べた先頭）
  const nextRows = await select()
    .where(
      and(
        ...base,
        or(
          gt(articles.publishedAt, publishedAt),
          and(eq(articles.publishedAt, publishedAt), gt(articles.id, articleId)),
        ),
      ),
    )
    .orderBy(asc(articles.publishedAt), asc(articles.id))
    .limit(1);

  return { prev: prevRows[0] ?? null, next: nextRows[0] ?? null };
}

// ── 同カテゴリーの記事をランダムに取得（記事詳細ページの「関連記事」用）──
// 今見ている記事(excludeId)を除き、同じ連載の公開記事から無作為に limit 件返す。
export async function getRandomCategoryArticles(
  categoryId: number,
  excludeId: number,
  limit = 3,
): Promise<PublicArticle[]> {
  return db
    .select(publicColumns)
    .from(articles)
    .leftJoin(users, eq(articles.authorId, users.id))
    .leftJoin(categories, eq(articles.categoryId, categories.id))
    .where(
      and(
        eq(articles.status, 'published'),
        lte(articles.publishedAt, now()),
        eq(articles.categoryId, categoryId),
        ne(articles.id, excludeId),
      ),
    )
    .orderBy(sql`random()`)
    .limit(limit);
}
