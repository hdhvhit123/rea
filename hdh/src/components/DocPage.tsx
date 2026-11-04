import Link from "next/link";
import { Shell } from "./Shell";

const NAV = [
  ["/docs", "Overview"],
  ["/docs/api", "API reference"],
  ["/docs/guide", "User guide"],
];

export function DocPage({ title, lead, current, eyebrow, toc, children }: { title: string; lead: string; current?: string; eyebrow?: string; toc?: [string, string][]; children: React.ReactNode }) {
  return (
    <Shell>
      <div className="relative border-b border-line">
        <div aria-hidden className="grid-bg pointer-events-none absolute inset-0 -z-10 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
        <div className="container-x pt-10 sm:pt-14">
  {(eyebrow ?? (current === "/docs" ? "hdh docs" : NAV.find(([h]) => h === current)?.[1])) && (
            <p className="eyebrow mb-3">{eyebrow ?? (current === "/docs" ? "hdh docs" : NAV.find(([h]) => h === current)?.[1])}</p>
          )}
          <h1 className=" text-[2rem] font-semibold leading-[1.1] tracking-[-0.035em] sm:text-[2.6rem]">{title}</h1>
          <p className="mt-4 max-w-xl text-[17px] leading-7 text-ink-3">{lead}</p>
          {current ? (
            <nav aria-label="Documentation" className="-mb-px mt-8 flex gap-1 overflow-x-auto">
              {NAV.map(([href, label]) => (
                <Link key={href} href={href} aria-current={current === href ? "page" : undefined} className={`whitespace-nowrap border-b-2 px-3 pb-3 pt-1 text-sm font-medium ${current === href ? "border-brand text-ink" : "border-transparent text-ink-3 hover:text-ink"}`}>{label}</Link>
              ))}
            </nav>
          ) : (
            <div className="pb-10" />
          )}
        </div>
      </div>
      <div className={`container-x py-12 ${toc ? "lg:grid lg:grid-cols-[180px_minmax(0,1fr)] lg:gap-14" : ""}`}>
        {toc && (
          <nav aria-label="On this page" className="hidden lg:sticky lg:top-24 lg:block lg:self-start">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-3">{NAV.find(([h]) => h === current)?.[1] ?? "On this page"}</p>
            <ul className="mt-3 space-y-0.5 border-l border-line">
              {toc.map(([id, label]) => (
                <li key={id}><a href={`#${id}`} className="-ml-px block border-l border-transparent py-1 pl-3 text-[13px] text-ink-3 hover:border-ink-3 hover:text-ink">{label}</a></li>
              ))}
            </ul>
          </nav>
        )}
        <article className="prose-doc min-w-0 max-w-3xl">{children}</article>
      </div>
    </Shell>
  );
}
