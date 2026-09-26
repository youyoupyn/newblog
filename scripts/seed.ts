import "./load-env";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import bcrypt from "bcryptjs";
import { createClient } from "@libsql/client";

async function main() {
  const url = process.env.DATABASE_URL ?? "file:./data/blog.db";

  // 数据库文件所在目录可能还不存在，先建出来
  if (url.startsWith("file:")) {
    mkdirSync(dirname(resolve(url.slice("file:".length))), { recursive: true });
  }

  const client = createClient({ url });

  await client.execute(`
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      content TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      published_at INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL
    )
  `);

  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  if (!username || !password) {
    throw new Error("请在 .env 中配置 ADMIN_USERNAME 与 ADMIN_PASSWORD");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  // 账号已存在就更新密码，改完 .env 重跑本脚本即可生效
  await client.execute({
    sql: `INSERT INTO users (username, password_hash) VALUES (?, ?)
          ON CONFLICT(username) DO UPDATE SET password_hash = excluded.password_hash`,
    args: [username, passwordHash],
  });

  // 全站只保留一个管理员：换了用户名时清掉旧账号
  await client.execute({
    sql: "DELETE FROM users WHERE username != ?",
    args: [username],
  });

  client.close();

  console.log(`✓ 初始化完成`);
  console.log(`  管理员账号：${username}`);
  console.log(`  数据库位置：${url}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
