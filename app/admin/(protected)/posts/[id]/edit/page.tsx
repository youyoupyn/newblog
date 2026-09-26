import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PostForm } from "@/components/post-form";
import { getPostById } from "@/lib/posts";

export const metadata: Metadata = { title: "编辑文章" };

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const postId = Number(id);
  if (!Number.isInteger(postId)) notFound();

  const post = await getPostById(postId);
  if (!post) notFound();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-slate-900">编辑文章</h1>
      <PostForm post={post} />
    </div>
  );
}
