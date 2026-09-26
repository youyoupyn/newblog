import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-4 py-20 text-center">
        <p className="text-5xl font-bold text-slate-300">404</p>
        <p className="mt-4 text-lg text-slate-700">页面不存在</p>
        <Link
          href="/"
          className="mt-6 rounded-md bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
        >
          返回首页
        </Link>
      </main>

      <SiteFooter />
    </div>
  );
}
