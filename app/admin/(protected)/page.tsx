import type { Metadata } from "next";
import Link from "next/link";
import { formatDateTime } from "@/lib/format";
import { getPostStats, listAllPosts } from "@/lib/posts";

export const metadata: Metadata = { title: "仪表盘" };

export default async function DashboardPage() {
  const [stats, posts] = await Promise.all([getPostStats(), listAllPosts()]);
  const recent = posts.slice(0, 5);

  const cards = [
    { key: "total", label: "文章总数", value: stats.total },
    { key: "published", label: "已发布", value: stats.published },
    { key: "draft", label: "草稿", value: stats.draft },
  ];

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-bold text-slate-900">仪表盘</h1>

      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map((card) => (
          <div
            key={card.key}
            data-stat={card.key}
            className="rounded-xl border border-slate-200 bg-white p-5"
          >
            <p className="text-sm text-slate-500">{card.label}</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{card.value}</p>
          </div>
        ))}
      </div>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-slate-900">最近文章</h2>

        {recent.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
            还没有文章
          </p>
        ) : (
          <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white">
            {recent.map((post) => (
              <li key={post.id}>
                <Link
                  href={`/admin/posts/${post.id}/edit`}
                  className="flex min-h-14 items-center justify-between gap-4 px-5 py-3 hover:bg-slate-50"
                >
                  <span className="min-w-0 truncate font-medium text-slate-800">
                    {post.title}
                  </span>
                  <span className="flex shrink-0 items-center gap-3 text-xs">
                    <span
                      className={
                        post.status === "published" ? "text-emerald-600" : "text-amber-600"
                      }
                    >
                      {post.status === "published" ? "已发布" : "草稿"}
                    </span>
                    <span className="text-slate-400">{formatDateTime(post.updatedAt)}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
