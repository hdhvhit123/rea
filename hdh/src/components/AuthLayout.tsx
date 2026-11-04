import { Shell } from "./Shell";
import { CheckIcon, Logo } from "./icons";

export function AuthLayout({ title, intro, children }: { title: string; intro: string; children: React.ReactNode }) {
  const bars = [30, 42, 36, 50, 44, 62, 56, 72, 66, 82, 76, 100];
  return (
    <Shell>
      <div className="container-x grid gap-10 py-10 sm:py-14 lg:grid-cols-[1fr_minmax(0,34rem)] lg:items-center lg:gap-14">
        <div className="mx-auto w-full max-w-sm">
          <h1 className="text-[1.75rem] font-semibold tracking-[-0.03em]">{title}</h1>
          <p className="mt-1.5 text-ink-3">{intro}</p>
          <div className="mt-7">{children}</div>
        </div>
        <aside className="relative hidden min-h-[36rem] flex-col justify-end overflow-hidden rounded-2xl bg-[linear-gradient(160deg,oklch(52%_0.24_285),oklch(32%_0.17_279)_55%,oklch(26%_0.13_275))] p-10 text-white lg:flex">
          <div aria-hidden className="grid-bg absolute inset-0 opacity-20" />
          <div className="absolute left-10 top-8 [&_.text-\[21px\]]:text-white"><Logo /></div>
          <div className="relative">
            <h2 className="text-[1.9rem] font-semibold leading-tight tracking-[-0.03em]">Every link, measured.</h2>
            <p className="mt-3 max-w-sm text-white/70">Shorten, brand and track your links from one clean dashboard.</p>
            <div className="mt-7 rounded-xl border border-white/15 bg-white/10 p-4 backdrop-blur" aria-hidden>
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm">hdh.link/<span className="text-white/70">spring</span></span>
                <span className="rounded-full bg-white/15 px-2 py-0.5 text-xs">↗ 24%</span>
              </div>
              <div className="mt-4 flex h-14 items-end gap-1.5">
                {bars.map((h, i) => <span key={i} className={`flex-1 rounded-t-[2px] ${i === bars.length - 1 ? "bg-white" : "bg-white/30"}`} style={{ height: `${h}%` }} />)}
              </div>
            </div>
            <ul className="mt-7 space-y-2.5 text-sm text-white/85">
              {["Click analytics by country, device and source", "Custom aliases, expiry and passwords", "Guest links join your account when you sign in"].map((t) => (
                <li key={t} className="flex items-center gap-2.5"><span className="grid h-5 w-5 place-items-center rounded-full bg-white/15"><CheckIcon width={12} height={12} /></span>{t}</li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </Shell>
  );
}
