import "./load-env";
import { createClient } from "@libsql/client";
import puppeteer, { type Page } from "puppeteer-core";

const BASE = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const CHROME =
  process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const USERNAME = process.env.ADMIN_USERNAME ?? "";
const PASSWORD = process.env.ADMIN_PASSWORD ?? "";
const DB_URL = process.env.DATABASE_URL ?? "file:./data/blog.db";

const DRAFT_TITLE = "E2E-草稿文章";
const PUBLISHED_TITLE = "E2E-已发布文章";
const DUPLICATE_TITLE = "E2E-重名文章";
const VALIDATION_TITLE = "E2E-校验用标题";

let passed = 0;
let failed = 0;
const failures: string[] = [];

function check(name: string, ok: boolean, detail = "") {
  if (ok) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    failures.push(name);
    console.log(`  ✗ ${name}${detail ? `  (${detail})` : ""}`);
  }
}

function section(title: string) {
  console.log(`\n── ${title} ──`);
}

/* ---------- 页面辅助（传字符串表达式，避免函数序列化问题） ---------- */

async function bodyText(page: Page): Promise<string> {
  return page.evaluate("document.body.innerText") as Promise<string>;
}

async function waitForText(page: Page, text: string, timeout = 10000) {
  await page.waitForFunction(`document.body.innerText.includes(${JSON.stringify(text)})`, {
    timeout,
  });
}

async function waitForPath(page: Page, path: string, timeout = 15000) {
  await page.waitForFunction(`location.pathname === ${JSON.stringify(path)}`, { timeout });
}

async function setField(page: Page, selector: string, value: string) {
  await page.evaluate(`(() => {
    const el = document.querySelector(${JSON.stringify(selector)});
    if (!el) throw new Error("找不到元素 " + ${JSON.stringify(selector)});
    const proto = el.tagName === "TEXTAREA"
      ? window.HTMLTextAreaElement.prototype
      : window.HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, "value").set;
    setter.call(el, ${JSON.stringify(value)});
    el.dispatchEvent(new Event("input", { bubbles: true }));
  })()`);
}

async function login(page: Page) {
  await page.goto(`${BASE}/admin/login`, { waitUntil: "load" });
  await page.waitForSelector("#username");
  await setField(page, "#username", USERNAME);
  await setField(page, "#password", PASSWORD);
  await page.click('button[aria-label="登录"]');
  await waitForPath(page, "/admin");
}

async function fillPostForm(
  page: Page,
  input: { title?: string; content?: string; status?: "draft" | "published" },
) {
  await page.waitForSelector("#title");
  if (input.title !== undefined) await setField(page, "#title", input.title);
  if (input.content !== undefined) await setField(page, "#content", input.content);
  if (input.status) await page.click(`input[name="status"][value="${input.status}"]`);
}

async function savePost(page: Page) {
  await page.click('button[aria-label="保存文章"]');
  await waitForPath(page, "/admin/posts");
}

async function deletePostByTitle(page: Page, title: string) {
  await page.goto(`${BASE}/admin/posts`, { waitUntil: "load" });
  const del = `button[aria-label="删除《${title}》"]`;
  await page.waitForSelector(del);

  // 可能有多篇同名文章，所以用"按钮数量减少"判断删除完成，
  // 而不是"标题消失"——后者在同名文章存在时永远不成立
  const before = (await page.evaluate(
    `document.querySelectorAll(${JSON.stringify(del)}).length`,
  )) as number;

  await page.click(del);
  await page.waitForSelector(`button[aria-label="确认删除《${title}》"]`);
  await page.click(`button[aria-label="确认删除《${title}》"]`);
  await page.waitForFunction(
    `document.querySelectorAll(${JSON.stringify(del)}).length < ${before}`,
    { timeout: 15000 },
  );
}

/** 清掉所有以 E2E- 开头的测试文章，保证脚本可反复运行 */
async function cleanupTestPosts(page: Page) {
  await page.goto(`${BASE}/admin/posts`, { waitUntil: "load" });
  for (let i = 0; i < 40; i++) {
    const titles = (await page.evaluate(
      `Array.from(document.querySelectorAll('button[aria-label^="删除《E2E-"]'))
         .map((el) => el.getAttribute("aria-label").slice(3, -1))`,
    )) as string[];
    if (titles.length === 0) return;
    await deletePostByTitle(page, titles[0]);
  }
  throw new Error("清理测试数据超过 40 次仍未完成");
}

/* ---------- 数据库辅助（断言与真实数据比对，不写死数字） ---------- */

const client = createClient({ url: DB_URL });

async function dbStats() {
  const result = await client.execute("SELECT status FROM posts");
  const published = result.rows.filter((row) => row.status === "published").length;
  return { total: result.rows.length, published, draft: result.rows.length - published };
}

async function dbSlug(title: string): Promise<string | null> {
  const result = await client.execute({
    sql: "SELECT slug FROM posts WHERE title = ? LIMIT 1",
    args: [title],
  });
  const row = result.rows[0];
  return row ? String(row.slug) : null;
}

async function dbPublishedAt(title: string): Promise<number | null> {
  const result = await client.execute({
    sql: "SELECT published_at FROM posts WHERE title = ? LIMIT 1",
    args: [title],
  });
  const row = result.rows[0];
  return row && row.published_at !== null ? Number(row.published_at) : null;
}

async function main() {
  if (!USERNAME || !PASSWORD) {
    throw new Error("请在 .env 中配置 ADMIN_USERNAME 与 ADMIN_PASSWORD");
  }

  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  try {
    /* ===== 前台 ===== */
    section("前台基础");
    await page.goto(BASE, { waitUntil: "load" });
    check("首页可访问并显示站名", (await bodyText(page)).includes("newblog"));

    await page.goto(`${BASE}/about`, { waitUntil: "load" });
    const about = await bodyText(page);
    check("关于我页面显示标题", about.includes("关于我"));
    check("关于我页面显示联系方式", about.includes("联系我"));

    await page.goto(`${BASE}/no-such-path-404`, { waitUntil: "load" });
    await waitForText(page, "页面不存在");
    check("不存在的路径显示 404 页", (await bodyText(page)).includes("页面不存在"));

    /* ===== 登录与门禁 ===== */
    section("登录与门禁");
    await page.goto(`${BASE}/admin`, { waitUntil: "load" });
    await waitForPath(page, "/admin/login");
    check("未登录访问仪表盘跳转登录页", true);

    await page.goto(`${BASE}/admin/posts`, { waitUntil: "load" });
    await waitForPath(page, "/admin/login");
    check("未登录访问文章管理跳转登录页", true);

    await page.goto(`${BASE}/admin/login`, { waitUntil: "load" });
    await page.waitForSelector("#username");
    await setField(page, "#username", USERNAME);
    await setField(page, "#password", "deliberately-wrong");
    await page.click('button[aria-label="登录"]');
    await waitForText(page, "账号或密码错误");
    check("密码错误时给出提示", true);
    check("密码错误后停在登录页", page.url().endsWith("/admin/login"));
    check(
      "错误提示不泄露账号是否存在",
      !(await bodyText(page)).includes("账号不存在"),
    );

    await setField(page, "#password", PASSWORD);
    await page.click('button[aria-label="登录"]');
    await waitForPath(page, "/admin");
    await waitForText(page, "仪表盘");
    check("正确账号密码可登录", true);

    await page.goto(`${BASE}/admin/login`, { waitUntil: "load" });
    await waitForPath(page, "/admin");
    check("已登录访问登录页自动跳仪表盘", true);

    /* ===== 仪表盘统计 ===== */
    section("仪表盘统计");
    await page.goto(`${BASE}/admin`, { waitUntil: "load" });
    await page.waitForSelector('[data-stat="total"]');

    const stats = await dbStats();
    const shown = (await page.evaluate(`(() => {
      const read = (key) =>
        Number(document.querySelector('[data-stat="' + key + '"]').innerText.replace(/\\D/g, ""));
      return { total: read("total"), published: read("published"), draft: read("draft") };
    })()`)) as { total: number; published: number; draft: number };

    check("统计-总数与数据库一致", shown.total === stats.total, `${shown.total} / ${stats.total}`);
    check(
      "统计-已发布与数据库一致",
      shown.published === stats.published,
      `${shown.published} / ${stats.published}`,
    );
    check("统计-草稿与数据库一致", shown.draft === stats.draft, `${shown.draft} / ${stats.draft}`);

    /* ===== 新建草稿与隔离 ===== */
    section("新建草稿与草稿隔离");
    await cleanupTestPosts(page);

    await page.goto(`${BASE}/admin/posts/new`, { waitUntil: "load" });
    await fillPostForm(page, {
      title: DRAFT_TITLE,
      content: "## 草稿小标题\n\n这是草稿的正文内容。",
      status: "draft",
    });
    await savePost(page);
    await waitForText(page, DRAFT_TITLE);
    check("新建草稿后返回列表并显示", true);

    await page.goto(`${BASE}/admin/posts?status=draft`, { waitUntil: "load" });
    check("草稿筛选里能看到该文章", (await bodyText(page)).includes(DRAFT_TITLE));

    await page.goto(BASE, { waitUntil: "load" });
    check("首页不显示草稿", !(await bodyText(page)).includes(DRAFT_TITLE));

    const draftSlug = await dbSlug(DRAFT_TITLE);
    check("草稿自动生成了地址", Boolean(draftSlug));
    if (draftSlug) {
      const res = await fetch(`${BASE}/posts/${encodeURIComponent(draftSlug)}`);
      check("直接访问草稿地址返回 404", res.status === 404, `状态码 ${res.status}`);
    }

    /* ===== 发布 ===== */
    section("发布文章");
    await page.goto(`${BASE}/admin/posts`, { waitUntil: "load" });
    await page.click(`a[aria-label="编辑《${DRAFT_TITLE}》"]`);
    await fillPostForm(page, { title: PUBLISHED_TITLE, status: "published" });
    await savePost(page);
    await waitForText(page, PUBLISHED_TITLE);
    check("编辑并发布成功", true);

    await page.goto(BASE, { waitUntil: "load" });
    check("首页显示已发布文章", (await bodyText(page)).includes(PUBLISHED_TITLE));

    const publishedSlug = await dbSlug(PUBLISHED_TITLE);
    check("已发布文章地址可用", Boolean(publishedSlug));
    if (publishedSlug) {
      await page.goto(`${BASE}/posts/${encodeURIComponent(publishedSlug)}`, { waitUntil: "load" });
      const detail = await bodyText(page);
      check("详情页显示标题", detail.includes(PUBLISHED_TITLE));
      check("详情页渲染 Markdown 正文", detail.includes("这是草稿的正文内容"));
      check("详情页显示发布日期", /\d{4}年\d{1,2}月\d{1,2}日/.test(detail));
      check("详情页有返回首页入口", detail.includes("返回首页"));
    }

    /* ===== 状态筛选 ===== */
    section("状态筛选");
    await page.goto(`${BASE}/admin/posts?status=published`, { waitUntil: "load" });
    check("已发布筛选包含该文章", (await bodyText(page)).includes(PUBLISHED_TITLE));

    await page.goto(`${BASE}/admin/posts?status=draft`, { waitUntil: "load" });
    check("草稿筛选不包含已发布文章", !(await bodyText(page)).includes(PUBLISHED_TITLE));

    /* ===== 发布状态互转 ===== */
    section("发布状态互转");
    const publishedAtBefore = await dbPublishedAt(PUBLISHED_TITLE);

    await page.goto(`${BASE}/admin/posts`, { waitUntil: "load" });
    await page.click(`a[aria-label="编辑《${PUBLISHED_TITLE}》"]`);
    await fillPostForm(page, { status: "draft" });
    await savePost(page);
    await page.goto(BASE, { waitUntil: "load" });
    check("改回草稿后首页立即不可见", !(await bodyText(page)).includes(PUBLISHED_TITLE));

    await page.goto(`${BASE}/admin/posts`, { waitUntil: "load" });
    await page.click(`a[aria-label="编辑《${PUBLISHED_TITLE}》"]`);
    await fillPostForm(page, { status: "published" });
    await savePost(page);
    await page.goto(BASE, { waitUntil: "load" });
    check("重新发布后首页再次可见", (await bodyText(page)).includes(PUBLISHED_TITLE));
    check(
      "首次发布时间不被后续编辑改动",
      (await dbPublishedAt(PUBLISHED_TITLE)) === publishedAtBefore,
    );

    /* ===== slug 生成 ===== */
    section("地址生成与去重");
    await page.goto(`${BASE}/admin/posts/new`, { waitUntil: "load" });
    await fillPostForm(page, {
      title: DUPLICATE_TITLE,
      content: "第一篇重名文章正文。",
      status: "published",
    });
    await savePost(page);

    await page.goto(`${BASE}/admin/posts/new`, { waitUntil: "load" });
    await fillPostForm(page, {
      title: DUPLICATE_TITLE,
      content: "第二篇重名文章正文。",
      status: "published",
    });
    await savePost(page);

    const duplicates = await client.execute({
      sql: "SELECT slug FROM posts WHERE title = ? ORDER BY id",
      args: [DUPLICATE_TITLE],
    });
    check("重名文章各自生成了地址", duplicates.rows.length === 2);
    check(
      "重名文章的地址互不相同",
      duplicates.rows.length === 2 && duplicates.rows[0].slug !== duplicates.rows[1].slug,
    );

    if (duplicates.rows[0]) {
      const zhSlug = String(duplicates.rows[0].slug);
      const res = await fetch(`${BASE}/posts/${encodeURIComponent(zhSlug)}`);
      check("中文地址的文章可正常访问", res.status === 200, `状态码 ${res.status}`);
    }

    /* ===== 表单校验 ===== */
    section("表单校验");
    await page.goto(`${BASE}/admin/posts/new`, { waitUntil: "load" });
    await fillPostForm(page, { content: "只填了正文" });
    await page.click('button[aria-label="保存文章"]');
    await waitForText(page, "标题不能为空");
    check("标题为空时给出提示", true);

    await page.goto(`${BASE}/admin/posts/new`, { waitUntil: "load" });
    await fillPostForm(page, { title: VALIDATION_TITLE });
    await page.click('button[aria-label="保存文章"]');
    await waitForText(page, "正文不能为空");
    check("正文为空时给出提示", true);
    check(
      "校验失败后已填内容不丢失",
      (await page.evaluate('document.querySelector("#title").value')) === VALIDATION_TITLE,
    );

    /* ===== 删除 ===== */
    section("删除文章");
    await page.goto(`${BASE}/admin/posts`, { waitUntil: "load" });
    await page.click(`button[aria-label="删除《${PUBLISHED_TITLE}》"]`);
    await page.waitForSelector(`button[aria-label="确认删除《${PUBLISHED_TITLE}》"]`);
    check("删除前弹出二次确认", true);

    await page.click(`button[aria-label="取消删除《${PUBLISHED_TITLE}》"]`);
    check("取消后文章仍在列表中", (await bodyText(page)).includes(PUBLISHED_TITLE));

    await deletePostByTitle(page, PUBLISHED_TITLE);
    check("确认删除后列表不再显示", !(await bodyText(page)).includes(PUBLISHED_TITLE));

    await page.goto(BASE, { waitUntil: "load" });
    check("删除后首页不再显示", !(await bodyText(page)).includes(PUBLISHED_TITLE));

    const leftover = await client.execute({
      sql: "SELECT COUNT(*) AS c FROM posts WHERE title = ?",
      args: [PUBLISHED_TITLE],
    });
    check("删除后数据库里也没有了", Number(leftover.rows[0].c) === 0);

    /* ===== 退出登录 ===== */
    section("退出登录");
    await page.goto(`${BASE}/admin`, { waitUntil: "load" });
    await page.click('button[aria-label="退出登录"]');
    await waitForPath(page, "/admin/login");
    check("退出登录后回到登录页", true);

    await page.goto(`${BASE}/admin`, { waitUntil: "load" });
    await waitForPath(page, "/admin/login");
    check("退出后无法再访问后台", true);

    /* ===== 清理 ===== */
    section("清理测试数据");
    await login(page);
    await cleanupTestPosts(page);
    const remaining = await client.execute("SELECT COUNT(*) AS c FROM posts WHERE title LIKE 'E2E-%'");
    check("测试数据已清理干净", Number(remaining.rows[0].c) === 0);
  } finally {
    await browser.close();
    client.close();
  }

  console.log(`\n${"─".repeat(40)}`);
  console.log(`通过 ${passed} 项，失败 ${failed} 项`);
  if (failures.length > 0) {
    console.log("\n失败项：");
    for (const name of failures) console.log(`  · ${name}`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
