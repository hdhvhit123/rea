import Link from "next/link";
import { Shell } from "./Shell";

const NAV = [
  ["/docs", "Overview"],
  ["/docs/guide", "User guide"],
  ["/docs/api", "API reference"],
];

export function DocPage({ title, lead, current, children }: { title: string; lead: string; current?: string; children: React.ReactNode }) {
  return (
    <Shell>
      <div className="container-x grid gap-10 py-12 lg:grid-cols-[200px_1fr]">
        {current && (
          <nav aria-label="Documentation" className="lg:sticky lg:top-24 lg:self-start">
            <ul className="flex gap-1 overflow-x-auto lg:flex-col">
              {NAV.map(([href, label]) => (
                <li key={href}>
                  <Link href={href} aria-current={current === href ? "page" : undefined} className={`block whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium ${current === href ? "bg-brand-soft text-brand" : "text-ink-2 hover:bg-surface-2"}`}>{label}</Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
        <article className={`prose-doc min-w-0 max-w-3xl ${current ? "" : "lg:col-span-2 lg:mx-auto"}`}>
          <h1 className="text-3xl font-extrabold tracking-tight text-ink">{title}</h1>
          <p className="mt-3 text-lg text-ink-2">{lead}</p>
          {children}
        </article>
      </div>
    </Shell>
  );
}
