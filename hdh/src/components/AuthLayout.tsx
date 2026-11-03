import { Shell } from "./Shell";
import { CheckIcon } from "./icons";

export function AuthLayout({ title, intro, children }: { title: string; intro: string; children: React.ReactNode }) {
  return (
    <Shell>
      <div className="container-x grid gap-10 py-12 sm:py-16 lg:grid-cols-2 lg:items-center">
        <div className="mx-auto w-full max-w-md">
          <h1 className="text-3xl font-extrabold tracking-tight">{title}</h1>
          <p className="mt-2 text-ink-2">{intro}</p>
          <div className="card mt-6 p-6">{children}</div>
        </div>
        <aside className="hidden rounded-3xl bg-brand-soft p-10 lg:block">
          <p className="eyebrow">Every link, measured</p>
          <h2 className="mt-2 text-2xl font-bold">Shorten, brand and track your links from one dashboard.</h2>
          <div className="card mt-6 p-4">
            <p className="font-bold text-brand">hdh.link/spring</p>
            <p className="text-xs text-ink-3">example.com/spring-collection</p>
            <p className="mt-3 text-sm"><span className="text-2xl font-extrabold">842</span> <span className="text-ok">+24%</span> clicks this week</p>
          </div>
          <ul className="mt-6 space-y-2 text-ink-2">
            {["Click analytics by country, device and source", "Custom aliases, expiry and passwords", "Guest links join your account when you sign in"].map((t) => (
              <li key={t} className="flex gap-2"><CheckIcon className="mt-0.5 shrink-0 text-ok" />{t}</li>
            ))}
          </ul>
        </aside>
      </div>
    </Shell>
  );
}
