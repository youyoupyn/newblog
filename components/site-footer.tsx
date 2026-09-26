import { site } from "@/lib/site-content";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-slate-200">
      <div className="mx-auto max-w-3xl px-4 py-8 text-sm text-slate-500 md:px-6">
        {site.footer}
      </div>
    </footer>
  );
}
