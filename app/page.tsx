import { PostCard } from "@/components/post-card";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { listPublishedPosts } from "@/lib/posts";

// 每次请求都读库，保证后台一发布前台就能看到
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const posts = await listPublishedPosts();

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 md:px-6">
        <h1 className="sr-only">文章列表</h1>

        {posts.length === 0 ? (
          <p className="py-24 text-center text-slate-500">还没有文章</p>
        ) : (
          <div className="flex flex-col gap-5">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
