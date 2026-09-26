import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { formatDate } from "@/lib/format";
import { getPublishedPostBySlug } from "@/lib/posts";
import { decodeSlug } from "@/lib/slug";

export const dynamic = "force-dynamic";

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  // 路由参数是 URL 编码形式（中文会变成 %XX），查库前必须还原
  const post = await getPublishedPostBySlug(decodeSlug(slug));

  if (!post) notFound();

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 md:px-6">
        <article>
          <h1 className="text-3xl font-bold leading-snug text-slate-900">{post.title}</h1>
          <time
            className="mt-3 block text-sm text-slate-400"
            dateTime={post.publishedAt?.toISOString()}
          >
            {formatDate(post.publishedAt)}
          </time>

          <div className="prose prose-slate mt-8 max-w-none">
            <ReactMarkdown>{post.content}</ReactMarkdown>
          </div>
        </article>

        <div className="mt-12 border-t border-slate-200 pt-6">
          <Link href="/" className="text-sm text-slate-600 hover:text-slate-900">
            ← 返回首页
          </Link>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
