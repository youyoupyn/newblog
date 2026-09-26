"use client";

import { useState } from "react";
import { deletePostAction } from "@/actions/posts";

export function DeletePostButton({ id, title }: { id: number; title: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-label={`删除《${title}》`}
        onClick={() => setOpen(true)}
        className="inline-flex min-h-11 items-center rounded-md px-3 text-sm text-red-600 hover:bg-red-50 md:min-h-9"
      >
        删除
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={`删除确认：${title}`}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        >
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <p className="text-slate-800">
              确认删除《{title}》吗？删除后无法恢复。
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                aria-label={`取消删除《${title}》`}
                onClick={() => setOpen(false)}
                className="inline-flex min-h-11 items-center rounded-md border border-slate-200 px-4 text-sm text-slate-600 hover:bg-slate-50 md:min-h-10"
              >
                取消
              </button>
              <form action={deletePostAction}>
                <input type="hidden" name="id" value={id} />
                <button
                  type="submit"
                  aria-label={`确认删除《${title}》`}
                  className="inline-flex min-h-11 items-center rounded-md bg-red-600 px-4 text-sm font-medium text-white hover:bg-red-700 md:min-h-10"
                >
                  确认删除
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
