import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

/** 文章表 */
export const posts = sqliteTable("posts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  /** 网址后缀，由标题生成，全站唯一 */
  slug: text("slug").notNull().unique(),
  /** Markdown 正文原文 */
  content: text("content").notNull(),
  /** draft（草稿，访客不可见）/ published（已发布） */
  status: text("status", { enum: ["draft", "published"] })
    .notNull()
    .default("draft"),
  /** 首次转为已发布时写入，之后编辑不改动 */
  publishedAt: integer("published_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

/** 管理员表（只有一个账号，由 seed 从 .env 写入） */
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
});

export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
export type User = typeof users.$inferSelect;
