"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { logoutAction } from "@/actions/auth";
import { site } from "@/lib/site-content";

const NAV = [
  { href: "/admin", label: "仪表盘", exact: true },
  { href: "/admin/posts", label: "文章管理", exact: false },
];

function NavLinks({ variant }: { variant: "desktop" | "mobile" }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label={variant === "desktop" ? "后台导航" : "后台导航（移动端）"}
      className="flex flex-col gap-1 px-3"
    >
      {NAV.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`rounded-md px-3 py-2 text-sm font-medium ${
              active ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function LogoutButton({ variant }: { variant: "desktop" | "mobile" }) {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        aria-label={variant === "desktop" ? "退出登录" : "退出登录（移动端）"}
        className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
      >
        退出登录
      </button>
    </form>
  );
}

export function AdminNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      {/* 移动端顶栏 */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
        <Link href="/admin" className="font-semibold text-slate-900">
          {site.name} 后台
        </Link>
        <button
          type="button"
          aria-label="打开后台菜单"
          onClick={() => setOpen(true)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path
              d="M3 6h14M3 10h14M3 14h14"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      {/* 桌面侧边栏 */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
        <div className="px-5 py-6 text-lg font-semibold text-slate-900">{site.name}</div>
        <NavLinks variant="desktop" />
        <div className="mt-auto p-4">
          <LogoutButton variant="desktop" />
        </div>
      </aside>

      {/* 移动端抽屉：只在打开时渲染，避免与桌面侧边栏的按钮重复出现在 DOM 里 */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute inset-y-0 left-0 flex w-64 flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between px-4 py-4">
              <span className="font-semibold text-slate-900">{site.name}</span>
              <button
                type="button"
                aria-label="关闭后台菜单"
                onClick={() => setOpen(false)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path
                    d="M5 5l10 10M15 5L5 15"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
            <NavLinks variant="mobile" />
            <div className="mt-auto p-4">
              <LogoutButton variant="mobile" />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
