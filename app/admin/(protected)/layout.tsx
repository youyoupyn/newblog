import { redirect } from "next/navigation";
import { AdminNav } from "@/components/admin-nav";
import { isLoggedIn } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function ProtectedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // proxy 只看有没有 Cookie，这里才验签名；两处结论不一致会导致重定向死循环
  if (!(await isLoggedIn())) redirect("/admin/login");

  return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      <AdminNav />
      <main className="min-w-0 flex-1 p-4 md:p-8">{children}</main>
    </div>
  );
}
