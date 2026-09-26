/**
 * 由标题生成网址后缀。
 * - 去掉标点与符号（"你好，世界" → "你好世界"）
 * - 空格转连字符（"Hello World" → "hello-world"）
 * - 保留中文、字母、数字
 */
export function slugify(title: string): string {
  const base = title
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "") // 只保留字母、数字、空白与连字符
    .replace(/\s+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || "post";
}

/** 生成链接时使用：把中文 slug 编成 %XX 形式 */
export function encodeSlug(slug: string): string {
  return encodeURIComponent(slug);
}

/**
 * 读取路由参数时使用：Next 传进来的 params.slug 是 URL 编码形式，
 * 中文会变成 %E4%BD%A0... ，查库前必须还原。
 */
export function decodeSlug(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}
