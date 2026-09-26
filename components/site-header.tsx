"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { site } from "@/lib/site-content";

const NAV = [
  { href: "/", label: "首页" },
  { href: "/about", label: "关于我" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // 切换页面后收起移动端菜单
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  function isActive(href: string) {
    if (href === "/") return pathname === "/" || pathname.startsWith("/posts");
    return pathname === href;
  }

  return (
    <header className="relative border-b border-sky-200 bg-sky-100">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 md:px-6">
        <Link href="/" className="text-lg font-bold tracking-tight text-slate-900">
          {site.name}
        </Link>

        <button
          type="button"
          aria-label="打开导航菜单"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-md text-slate-600 hover:bg-sky-200 md:hidden"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            {open ? (
              <path
                d="M5 5l10 10M15 5L5 15"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            ) : (
              <path
                d="M3 6h14M3 10h14M3 14h14"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            )}
          </svg>
        </button>

        {/* 小屏时是下拉面板，桌面时是横向导航，始终只有这一份 DOM */}
        <nav
          aria-label="站点导航"
          className={`${
            open ? "flex" : "hidden"
          } absolute inset-x-0 top-full z-20 flex-col gap-1 border-b border-sky-200 bg-sky-100 px-4 py-3 shadow-sm md:static md:flex md:flex-row md:items-center md:gap-6 md:border-0 md:bg-transparent md:p-0 md:shadow-none`}
        >
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={`rounded-md px-3 py-2 text-sm font-medium md:px-0 md:py-0 ${
                isActive(item.href)
                  ? "bg-white/70 text-slate-900 md:bg-transparent"
                  : "text-slate-600 hover:bg-sky-200/70 hover:text-slate-900 md:hover:bg-transparent"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
