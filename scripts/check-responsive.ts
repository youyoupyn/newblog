import "./load-env";
import { createClient } from "@libsql/client";
import puppeteer, { type Page } from "puppeteer-core";

const BASE = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const CHROME =
  process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const USERNAME = process.env.ADMIN_USERNAME ?? "";
const PASSWORD = process.env.ADMIN_PASSWORD ?? "";
const DB_URL = process.env.DATABASE_URL ?? "file:./data/blog.db";

const TEST_TITLE = "CHECK-响应式临时文章";
const TEST_SLUG = "check-responsive-temp";

const VIEWPORTS = [
  { name: "手机 375", width: 375, height: 812 },
  { name: "平板 768", width: 768, height: 1024 },
  { name: "桌面 1440", width: 1440, height: 900 },
];

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

/** 清掉登录态：每个视口都要从"未登录"开始，才能看到登录页 */
async function clearCookies(page: Page) {
  const session = await page.createCDPSession();
  await session.send("Network.clearBrowserCookies");
  await session.detach();
}

async function noHorizontalScroll(page: Page): Promise<boolean> {
  return (await page.evaluate(
    "document.documentElement.scrollWidth <= window.innerWidth + 1",
  )) as boolean;
}

async function hasText(page: Page, text: string): Promise<boolean> {
  return page.evaluate(
    `document.body.innerText.includes(${JSON.stringify(text)})`,
  ) as Promise<boolean>;
}

async function login(page: Page) {
  await page.goto(`${BASE}/admin/login`, { waitUntil: "load" });
  await page.waitForSelector("#username");
  await setField(page, "#username", USERNAME);
  await setField(page, "#password", PASSWORD);
  await page.click('button[aria-label="登录"]');
  await page.waitForFunction('location.pathname === "/admin"', { timeout: 15000 });
}

const client = createClient({ url: DB_URL });

async function seedTestPost() {
  await client.execute({ sql: "DELETE FROM posts WHERE slug = ?", args: [TEST_SLUG] });
  const now = Math.floor(Date.now() / 1000);
  await client.execute({
    sql: `INSERT INTO posts (title, slug, content, status, published_at, created_at, updated_at)
          VALUES (?, ?, ?, 'published', ?, ?, ?)`,
    args: [
      TEST_TITLE,
      TEST_SLUG,
      "# 用于响应式检查的临时文章\n\n这段文字用来确认正文区域在三种宽度下都不会溢出。",
      now,
      now,
      now,
    ],
  });
}

async function removeTestPost() {
  await client.execute({ sql: "DELETE FROM posts WHERE slug = ?", args: [TEST_SLUG] });
}

async function checkViewport(page: Page, vp: (typeof VIEWPORTS)[number]) {
  const prefix = `[${vp.name}]`;
  console.log(`\n── ${vp.name}（${vp.width}px） ──`);
  await page.setViewport({ width: vp.width, height: vp.height });

  /* 前台首页 */
  await page.goto(BASE, { waitUntil: "load" });
  check(`${prefix} 首页无横向滚动`, await noHorizontalScroll(page));
  check(`${prefix} 首页显示文章卡片`, await hasText(page, TEST_TITLE));

  // 首页列表固定为一行一篇，三档都应如此
  const cardsPerRow = (await page.evaluate(`(() => {
    const list = document.querySelector("main .flex.flex-col");
    if (!list) return 0;
    const tops = Array.from(list.children).map((el) => el.getBoundingClientRect().top);
    return tops.filter((top) => Math.abs(top - tops[0]) < 2).length;
  })()`)) as number;
  check(`${prefix} 首页一行只显示一篇`, cardsPerRow === 1, `实际一行 ${cardsPerRow} 篇`);

  /* 关于我 */
  await page.goto(`${BASE}/about`, { waitUntil: "load" });
  check(`${prefix} 关于我无横向滚动`, await noHorizontalScroll(page));

  /* 详情页 */
  await page.goto(`${BASE}/posts/${TEST_SLUG}`, { waitUntil: "load" });
  check(`${prefix} 详情页无横向滚动`, await noHorizontalScroll(page));
  check(`${prefix} 详情页正文可见`, await hasText(page, "用于响应式检查的临时文章"));

  /* 登录页（先清掉登录态，否则会被重定向到仪表盘） */
  await clearCookies(page);
  await page.goto(`${BASE}/admin/login`, { waitUntil: "load" });
  await page.waitForSelector("#username");
  check(`${prefix} 登录页无横向滚动`, await noHorizontalScroll(page));
  check(`${prefix} 登录表单可见`, await hasText(page, "管理员登录"));

  /* 登录进后台 */
  await login(page);

  await page.goto(`${BASE}/admin`, { waitUntil: "load" });
  check(`${prefix} 仪表盘无横向滚动`, await noHorizontalScroll(page));

  if (vp.width >= 1024) {
    const sidebarVisible = (await page.evaluate(`(() => {
      const nav = document.querySelector('[aria-label="后台导航"]');
      if (!nav) return false;
      const aside = nav.closest("aside");
      return Boolean(aside) && getComputedStyle(aside).display !== "none";
    })()`)) as boolean;
    check(`${prefix} 桌面侧边栏常驻显示`, sidebarVisible);

    const hamburgerHidden = (await page.evaluate(
      `!document.querySelector('button[aria-label="打开后台菜单"]')?.checkVisibility()`,
    )) as boolean;
    check(`${prefix} 宽屏不显示汉堡按钮`, hamburgerHidden);
  } else {
    await page.click('button[aria-label="打开后台菜单"]');
    await page.waitForSelector('[aria-label="后台导航（移动端）"]', { timeout: 5000 });
    check(`${prefix} 汉堡按钮可打开抽屉导航`, true);
    check(
      `${prefix} 抽屉里能点到退出登录`,
      (await page.evaluate(
        `Boolean(document.querySelector('button[aria-label="退出登录（移动端）"]')?.checkVisibility())`,
      )) === true,
    );
    await page.click('button[aria-label="关闭后台菜单"]');
  }

  /* 文章列表 */
  await page.goto(`${BASE}/admin/posts`, { waitUntil: "load" });
  check(`${prefix} 文章列表无横向滚动`, await noHorizontalScroll(page));
  check(`${prefix} 文章列表显示操作按钮`, await hasText(page, "编辑"));

  /* 点击区域尺寸：只检查操作类元素，正文链接不在此列 */
  if (vp.width <= 400) {
    const tooSmall = (await page.evaluate(`(() => {
      const nodes = Array.from(document.querySelectorAll("button, a[aria-label]"));
      return nodes.filter((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return false;
        return rect.height < 44;
      }).length;
    })()`)) as number;
    check(`${prefix} 操作类元素高度均不小于 44px`, tooSmall === 0, `${tooSmall} 个偏小`);
  }
}

async function main() {
  if (!USERNAME || !PASSWORD) {
    throw new Error("请在 .env 中配置 ADMIN_USERNAME 与 ADMIN_PASSWORD");
  }

  await seedTestPost();

  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  const page = await browser.newPage();

  try {
    for (const vp of VIEWPORTS) {
      await checkViewport(page, vp);
    }
  } finally {
    await browser.close();
    await removeTestPost();
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

main().catch(async (error) => {
  console.error(error);
  await removeTestPost().catch(() => {});
  process.exit(1);
});
