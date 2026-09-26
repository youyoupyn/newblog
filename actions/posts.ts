"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { posts } from "@/lib/db/schema";
import type { ActionState } from "@/lib/action-state";
import { getPostById } from "@/lib/posts";
import { isLoggedIn } from "@/lib/session";
import { slugify } from "@/lib/slug";

const postSchema = z.object({
  title: z.string().min(1, "标题不能为空").max(200, "标题不能超过 200 字"),
  content: z.string().min(1, "正文不能为空"),
  status: z.enum(["draft", "published"]),
});

function collectFieldErrors(error: z.ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "");
    if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return fieldErrors;
}

/** 操作入口独立于页面门禁，必须自己再验一次登录态 */
async function assertLoggedIn(): Promise<void> {
  if (!(await isLoggedIn())) redirect("/admin/login");
}

/** 生成不重复的 slug，编辑时排除自己 */
async function buildUniqueSlug(base: string, excludeId?: number): Promise<string> {
  let candidate = base;
  let suffix = 2;
  for (;;) {
    const rows = await db
      .select({ id: posts.id })
      .from(posts)
      .where(eq(posts.slug, candidate))
      .limit(1);
    const found = rows[0];
    if (!found || found.id === excludeId) return candidate;
    candidate = `${base}-${suffix++}`;
  }
}

function parseForm(formData: FormData) {
  return postSchema.safeParse({
    title: String(formData.get("title") ?? "").trim(),
    content: String(formData.get("content") ?? "").trim(),
    status: String(formData.get("status") ?? "draft"),
  });
}

function refreshViews(): void {
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/posts");
}

export async function createPostAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await assertLoggedIn();

  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { ok: false, fieldErrors: collectFieldErrors(parsed.error) };
  }

  const { title, content, status } = parsed.data;
  const now = new Date();

  await db.insert(posts).values({
    title,
    content,
    status,
    slug: await buildUniqueSlug(slugify(title)),
    publishedAt: status === "published" ? now : null,
    createdAt: now,
    updatedAt: now,
  });

  refreshViews();
  redirect("/admin/posts");
}

export async function updatePostAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await assertLoggedIn();

  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return { ok: false, error: "文章不存在" };

  const existing = await getPostById(id);
  if (!existing) return { ok: false, error: "文章不存在" };

  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { ok: false, fieldErrors: collectFieldErrors(parsed.error) };
  }

  const { title, content, status } = parsed.data;

  // 草稿阶段跟着标题改地址；一旦发布过就固定下来，避免已分享的链接失效
  const slug =
    !existing.publishedAt && title !== existing.title
      ? await buildUniqueSlug(slugify(title), existing.id)
      : existing.slug;

  const now = new Date();
  const firstPublish = status === "published" && !existing.publishedAt;

  await db
    .update(posts)
    .set({
      title,
      content,
      status,
      slug,
      // 发布时间只在首次转为已发布时写入，之后不再改动
      publishedAt: firstPublish ? now : existing.publishedAt,
      updatedAt: now,
    })
    .where(eq(posts.id, id));

  refreshViews();
  redirect("/admin/posts");
}

export async function deletePostAction(formData: FormData): Promise<void> {
  await assertLoggedIn();

  const id = Number(formData.get("id"));
  if (Number.isInteger(id)) {
    await db.delete(posts).where(eq(posts.id, id));
    refreshViews();
  }

  redirect("/admin/posts");
}
