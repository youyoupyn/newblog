"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { createPostAction, updatePostAction } from "@/actions/posts";
import { EMPTY_ACTION_STATE } from "@/lib/action-state";
import type { Post } from "@/lib/db/schema";

export function PostForm({ post }: { post?: Post }) {
  const [state, formAction, pending] = useActionState(
    post ? updatePostAction : createPostAction,
    EMPTY_ACTION_STATE,
  );

  // 受控输入：action 完成后 React 会重置表单，受控值不受影响，
  // 校验失败时用户填的内容不会丢
  const [title, setTitle] = useState(post?.title ?? "");
  const [content, setContent] = useState(post?.content ?? "");
  const [status, setStatus] = useState<"draft" | "published">(post?.status ?? "draft");

  return (
    <form action={formAction} className="flex max-w-3xl flex-col gap-5">
      {post && <input type="hidden" name="id" value={post.id} />}

      <div>
        <label htmlFor="title" className="mb-1 block text-sm font-medium text-slate-700">
          标题
        </label>
        <input
          id="title"
          name="title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="min-h-11 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-slate-900"
        />
        {state.fieldErrors?.title && (
          <p className="mt-1 text-sm text-red-600">{state.fieldErrors.title}</p>
        )}
      </div>

      <div>
        <label htmlFor="content" className="mb-1 block text-sm font-medium text-slate-700">
          正文（支持 Markdown）
        </label>
        <textarea
          id="content"
          name="content"
          rows={16}
          value={content}
          onChange={(event) => setContent(event.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-sm text-slate-900 outline-none focus:border-slate-900"
        />
        {state.fieldErrors?.content && (
          <p className="mt-1 text-sm text-red-600">{state.fieldErrors.content}</p>
        )}
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-slate-700">状态</legend>
        <div className="flex gap-6">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="radio"
              name="status"
              value="draft"
              checked={status === "draft"}
              onChange={() => setStatus("draft")}
            />
            草稿（访客不可见）
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="radio"
              name="status"
              value="published"
              checked={status === "published"}
              onChange={() => setStatus("published")}
            />
            已发布
          </label>
        </div>
      </fieldset>

      {state.error && (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          aria-label="保存文章"
          disabled={pending}
          className="rounded-md bg-slate-900 px-5 py-2.5 font-medium text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {pending ? "保存中…" : "保存"}
        </button>
        <Link
          href="/admin/posts"
          className="rounded-md border border-slate-200 px-5 py-2.5 text-slate-600 hover:bg-slate-50"
        >
          返回列表
        </Link>
      </div>
    </form>
  );
}
