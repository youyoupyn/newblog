/**
 * 只放常量，不引入 node:crypto / next/headers ——
 * proxy.ts（中间件）也要用它，那里不能用 Node 专有 API。
 */
export const SESSION_COOKIE = "blog_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 天
