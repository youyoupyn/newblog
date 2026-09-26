import type { Metadata } from "next";
import Link from "next/link";
import { DeletePostButton } from "@/components/delete-post-button";
import { formatDateTime } from "@/lib/format";
import { listAllPosts } from "@/lib/posts";

export const metadata: Metadata = { title: "文章管理" };

const FILTERS = [
  { key: "all", label: "全部", href: "/admin/posts" },
  { key: "published", label: "已发布", href: "/admin/posts?status=published" },
  { key: "draft", label: "草稿", href: "/admin/posts?status=draft" },
] as const;

export default async function PostsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const current = status === "published" || status === "draft" ? status : "all";

  const all = await listAllPosts();
  const posts = current === "all" ? all : all.filter((post) => post.status === current);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900">文章管理</h1>
        <Link
          href="/admin/posts/new"
          className="inline-flex min-h-11 items-center rounded-md bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800 md:min-h-10"
        >
          新建文章
        </Link>
      </div>

      <div className="flex gap-2">
        {FILTERS.map((filter) => {
          const active = current === filter.key;
          return (
            <Link
              key={filter.key}
              href={filter.href}
              aria-current={active ? "page" : undefined}
              className={`inline-flex min-h-11 items-center rounded-md px-4 text-sm font-medium md:min-h-9 ${
                active
                  ? "bg-slate-900 text-white"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {filter.label}
            </Link>
          );
        })}
      </div>

      {posts.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
          暂无文章
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          {/* 窄屏堆叠成卡片，宽屏是标准表格，始终只有一份 DOM */}
          <table className="w-full text-left text-sm">
            <thead className="hidden md:table-header-group">
              <tr className="border-b border-slate-200 text-xs text-slate-500">
                <th className="px-4 py-3 font-medium">标题</th>
                <th className="px-4 py-3 font-medium">状态</th>
                <th className="px-4 py-3 font-medium">发布时间</th>
                <th className="px-4 py-3 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="block md:table-row-group">
              {posts.map((post) => (
                <tr
                  key={post.id}
                  className="block border-b border-slate-100 p-4 last:border-b-0 md:table-row md:p-0"
                >
                  <td className="block md:table-cell md:px-4 md:py-4">
                    <span className="block text-xs text-slate-400 md:hidden">标题</span>
                    <span className="font-medium text-slate-800">{post.title}</span>
                  </td>
                  <td className="mt-2 block md:mt-0 md:table-cell md:px-4 md:py-4">
                    <span className="mr-2 text-xs text-slate-400 md:hidden">状态</span>
                    <span
                      className={
                        post.status === "published" ? "text-emerald-600" : "text-amber-600"
                      }
                    >
                      {post.status === "published" ? "已发布" : "草稿"}
                    </span>
                  </td>
                  <td className="mt-2 block text-slate-500 md:mt-0 md:table-cell md:px-4 md:py-4">
                    <span className="mr-2 text-xs text-slate-400 md:hidden">发布时间</span>
                    {formatDateTime(post.publishedAt)}
                  </td>
                  <td className="mt-3 flex items-center gap-1 md:mt-0 md:table-cell md:px-4 md:py-4 md:text-right">
                    <Link
                      href={`/admin/posts/${post.id}/edit`}
                      aria-label={`编辑《${post.title}》`}
                      className="inline-flex min-h-11 items-center rounded-md px-3 text-sm text-slate-600 hover:bg-slate-100 md:min-h-9"
                    >
                      编辑
                    </Link>
                    <DeletePostButton id={post.id} title={post.title} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
