import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

const url = process.env.DATABASE_URL ?? "file:./data/blog.db";

// 开发模式下模块会被反复热更新，用 globalThis 缓存连接，避免每次新建
const globalForDb = globalThis as unknown as {
  __libsqlClient?: ReturnType<typeof createClient>;
};

const client = globalForDb.__libsqlClient ?? createClient({ url });
globalForDb.__libsqlClient = client;

export const db = drizzle(client, { schema });
