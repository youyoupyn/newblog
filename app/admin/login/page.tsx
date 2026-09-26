import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { isLoggedIn } from "@/lib/session";
import { site } from "@/lib/site-content";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "管理员登录" };

export default async function LoginPage() {
  // proxy 对登录页直接放行，这里的验签结果才是"已登录"的唯一依据
  if (await isLoggedIn()) redirect("/admin");

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-xl font-bold text-slate-900">{site.name}</h1>
        <p className="mb-6 text-sm text-slate-500">管理员登录</p>
        <LoginForm />
      </div>
    </main>
  );
}
