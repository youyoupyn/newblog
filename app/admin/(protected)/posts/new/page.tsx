import type { Metadata } from "next";
import { PostForm } from "@/components/post-form";

export const metadata: Metadata = { title: "新建文章" };

export default function NewPostPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-slate-900">新建文章</h1>
      <PostForm />
    </div>
  );
}
