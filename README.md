# newblog

个人博客系统，包含两个端：

- **用户端**：首页（文章列表）、文章详情页、关于我
- **博主管理后台**：管理员登录、仪表盘（文章统计）、文章管理（列表 / 新建 / 编辑 / 删除）

需求见 `doc/PRD.md`，技术方案见 `doc/tech.md`。

## 技术栈

Next.js 16（App Router）· React 19 · TypeScript · Tailwind CSS v4 · SQLite（libsql）· Drizzle ORM · bcryptjs

## 快速开始

```bash
npm install

# 1. 准备环境变量（复制后按需修改账号密码与密钥）
cp .env.example .env

# 2. 初始化数据库并写入管理员账号
npm run seed

# 3. 启动开发服务器
npm run dev
```

打开 http://localhost:3000 ，后台入口是 `/admin/login`，用 `.env` 里的 `ADMIN_USERNAME` / `ADMIN_PASSWORD` 登录。

> 修改 `.env` 里的管理员密码后，需要重跑 `npm run seed` 才会生效。

## 常用命令

| 命令 | 说明 |
| --- | --- |
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 生产构建 |
| `npm run start` | 运行生产构建 |
| `npm run seed` | 建表 + 写入管理员账号（可重复执行） |
| `npm run e2e` | 端到端验收（45 项，需先启动 dev） |
| `npm run check:responsive` | 响应式检查（40 项，需先启动 dev） |
| `npm run typecheck` | TypeScript 类型检查 |

验收脚本通过 puppeteer-core 驱动系统 Chrome，默认路径为 macOS 的 Chrome；其他位置可用 `CHROME_PATH` 指定：

```bash
CHROME_PATH=/path/to/chrome npm run e2e
```

## 目录结构

```
app/          页面（前台三页 + 后台五个页面，admin/(protected) 是登录门禁）
actions/      Server Actions（登录、登出、文章增删改）
components/   页头、页脚、文章卡片、后台导航、表单、删除确认
lib/          数据库连接与表结构、会话签名、slug 生成、查询封装
scripts/      seed（初始化）、e2e（端到端验收）、check-responsive（响应式检查）
proxy.ts      中间件：后台路径的登录粗筛
```

## 几点说明

- 文章有**草稿 / 已发布**两种状态，草稿对访客完全不可见（直接访问其地址也会返回 404）
- 文章地址由标题自动生成并自动去重（支持中文），**草稿阶段改标题会同步更新地址，发布后地址固定**，避免已分享的链接失效
- 数据全部存在 `data/blog.db` 一个文件里，备份就是复制该文件
