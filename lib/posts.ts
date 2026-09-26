import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { posts, type Post } from "@/lib/db/schema";

/** 首页列表：只取已发布，按发布时间倒序 */
export async function listPublishedPosts(): Promise<Post[]> {
  return db
    .select()
    .from(posts)
    .where(eq(posts.status, "published"))
    .orderBy(desc(posts.publishedAt), desc(posts.createdAt));
}

/** 详情页：已发布的才返回，草稿与不存在一律当作 404 */
export async function getPublishedPostBySlug(slug: string): Promise<Post | null> {
  const rows = await db
    .select()
    .from(posts)
    .where(and(eq(posts.slug, slug), eq(posts.status, "published")))
    .limit(1);
  return rows[0] ?? null;
}

/** 后台列表：全部文章 */
export async function listAllPosts(): Promise<Post[]> {
  return db
    .select()
    .from(posts)
    .orderBy(desc(posts.createdAt), desc(posts.id));
}

export async function getPostById(id: number): Promise<Post | null> {
  const rows = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
  return rows[0] ?? null;
}

export type PostStats = { total: number; published: number; draft: number };

/** 仪表盘统计：直接数当前库里的真实条数 */
export async function getPostStats(): Promise<PostStats> {
  const all = await db.select({ status: posts.status }).from(posts);
  const published = all.filter((p) => p.status === "published").length;
  return {
    total: all.length,
    published,
    draft: all.length - published,
  };
}
