import type { Metadata } from "next";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { site } from "@/lib/site-content";

export const metadata: Metadata = { title: "关于我" };

export default function AboutPage() {
  const about = site.about;

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 md:px-6">
        <h1 className="text-3xl font-bold text-slate-900">{about.title}</h1>

        <div className="mt-6 flex flex-col gap-4 leading-relaxed text-slate-600">
          <p>{about.intro}</p>
          <p>{about.intro2}</p>
        </div>

        <h2 className="mt-10 text-xl font-semibold text-slate-900">{about.skillsTitle}</h2>
        <ul className="mt-4 list-disc pl-5 leading-relaxed text-slate-600">
          {about.skills.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>

        <h2 className="mt-10 text-xl font-semibold text-slate-900">{about.contactTitle}</h2>
        <ul className="mt-4 flex flex-col gap-2 text-slate-600">
          {about.contact.map((item) => (
            <li key={item.label}>
              {item.label}：{item.value}
            </li>
          ))}
        </ul>
      </main>

      <SiteFooter />
    </div>
  );
}
