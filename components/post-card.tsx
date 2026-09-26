import Link from "next/link";
import { excerpt } from "@/lib/excerpt";
import { formatDate } from "@/lib/format";
import { encodeSlug } from "@/lib/slug";
import type { Post } from "@/lib/db/schema";

export function PostCard({ post }: { post: Post }) {
  return (
    <Link
      href={`/posts/${encodeSlug(post.slug)}`}
      className="flex h-full flex-col gap-3 rounded-xl border border-slate-200 p-5 transition hover:border-slate-300 hover:shadow-sm"
    >
      <h2 className="text-lg font-semibold leading-snug text-slate-900">{post.title}</h2>
      <p className="flex-1 text-sm leading-relaxed text-slate-600">{excerpt(post.content)}</p>
      <time className="text-xs text-slate-400" dateTime={post.publishedAt?.toISOString()}>
        {formatDate(post.publishedAt)}
      </time>
    </Link>
  );
}
