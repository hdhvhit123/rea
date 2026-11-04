import Link from "next/link";
import { Shell } from "@/components/Shell";
import { ShortenForm } from "@/components/ShortenForm";
import { RecentLinks } from "@/components/RecentLinks";
import { CheckLinkForm } from "@/components/CheckLinkForm";
import { currentUser } from "@/lib/auth";
import { ArrowIcon, BoltIcon, CardIcon, ChevronIcon, ChartIcon, CheckIcon, ClockIcon, CloudIcon, GridIcon, KeyIcon, LinkIcon, LockIcon, MonitorIcon, PhoneIcon, QrIcon, SearchIcon, ShieldIcon, SlidersIcon, SparkIcon, TagIcon, UserIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

const FAQ = [
  ["Is hdh really free?", "Yes. Shortening, QR codes, analytics and the dashboard are free. Fair-use limits protect the service from abuse."],
  ["Do I need an account to shorten links?", "No. Guests can shorten links right away. A free account adds a dashboard that follows you across devices, a trash for deleted links and a bio page."],
  ["Do my short links expire?", "Only if you want them to. By default links never expire. In Options you can set a time span in minutes, hours or days, or a click limit."],
  ["Can I choose my own short link?", "Yes. Open Options and type a custom alias of 5–64 letters, digits, dots, underscores or hyphens. Some names are reserved for the site itself."],
  ["How do I see how many people clicked my link?", "Use the Stats button next to the link, or open /d/ followed by the code. Full links need their secret code (or your account); Stats only links are public."],
  ["Can I change where a link goes after creating it?", "For Full links, yes: with the secret code or from your dashboard you can change the destination, title, password and expiry, or delete the link."],
  ["How does hdh keep links safe?", "Every destination is checked before it's saved and again when it's edited. Links found to be harmful are blocked and visitors see a warning. You can report abuse any time."],
  ["Is there an API?", "Yes. A small JSON API lets you create links, read stats, preview, update and delete. See the API reference in the docs."],
];

export default async function Home() {
  const user = await currentUser();
  return (
    <Shell home>
      {/* Hero */}
      <section id="top" className="relative overflow-hidden pt-[88px] sm:pt-[112px]">
        <div aria-hidden className="grid-bg pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] [mask-image:linear-gradient(to_bottom,black,transparent)]" />
        <div aria-hidden className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[420px] w-[900px] -translate-x-1/2 bg-[radial-gradient(50%_50%_at_50%_40%,color-mix(in_oklab,var(--brand)_14%,transparent),transparent)]" />
        <div className="container-x text-center">
          <h1 className="mx-auto max-w-3xl text-[1.9rem] font-semibold leading-[1.12] tracking-[-0.035em] sm:text-[2.9rem]">
            Shorten links,<br className="sm:hidden" />{" "}
            <span className="bg-[linear-gradient(100deg,var(--brand)_10%,var(--accent)_90%)] bg-clip-text text-transparent">track every click</span>
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-[15px] leading-[26px] text-ink-3 sm:text-base">
            Free short links with QR codes, expiry, passwords and click stats. No account needed.
          </p>
          <div className="mx-auto mt-8 max-w-3xl">
            <ShortenForm signedIn={Boolean(user)} />
            <div className="text-left"><RecentLinks /></div>
          </div>
        </div>

        <div className="container-x mt-12 sm:mt-16">
          <PreviewCard />
          <ul className="mx-auto mt-14 grid max-w-[64rem] grid-cols-2 overflow-hidden rounded-xl border border-line bg-surface lg:grid-cols-4">
            {[
              [SparkIcon, "Free forever"],
              [UserIcon, "No sign-up needed"],
              [ShieldIcon, "Every link checked for safety"],
              [BoltIcon, "Fast redirects"],
            ].map(([Icon, t], i) => {
              const I = Icon as typeof SparkIcon;
              return (
                <li key={t as string} className={`flex items-center gap-3 border-line px-4 py-4 text-sm font-medium sm:px-5 sm:py-5 sm:text-[15px] ${i % 2 ? "border-l" : ""} ${i > 1 ? "border-t lg:border-t-0" : ""} ${i === 2 ? "lg:border-l" : ""}`}>
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-soft text-brand"><I width={16} height={16} /></span>
                  {t as string}
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-20 sm:py-28">
        <div className="container-x">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">How it works</p>
            <h2 className="h2 mx-auto mt-3 max-w-[42rem]">From long URL to<br className="hidden sm:block" /> tracked link in seconds</h2>
          </div>
          <ol className="relative mx-auto mt-12 grid max-w-[64rem] gap-8 md:mt-14 md:grid-cols-3 md:gap-6">
            <span aria-hidden className="absolute left-[16.6%] right-[16.6%] top-7 hidden h-px bg-line md:block" />
            {[
              [LinkIcon, "Paste your link", "Drop in any long address. We add https:// if you leave it out and check it for safety."],
              [SlidersIcon, "Make it yours", "Pick a custom alias, set an expiry by time or clicks, or lock it with a password."],
              [ChartIcon, "Share and measure", "Copy the link or its QR code, then watch clicks by country, device and source."],
            ].map(([Icon, t, d], i) => {
              const I = Icon as typeof LinkIcon;
              return (
                <li key={t as string} className="relative flex gap-4 md:block md:text-center">
                  <span className="relative grid h-14 w-14 shrink-0 place-items-center rounded-full border border-line bg-surface text-brand shadow-card md:mx-auto">
                    <I width={20} height={20} />
                    <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-ink text-[11px] font-semibold text-bg">{i + 1}</span>
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold tracking-[-0.02em] md:mt-6">{t as string}</h3>
                    <p className="mx-auto mt-1.5 max-w-xs text-[15px] leading-6 text-ink-3">{d as string}</p>
                  </div>
                </li>
              );
            })}
          </ol>
          <div className="mx-auto mt-14 flex max-w-3xl flex-col gap-4 rounded-xl border border-line bg-surface-2/70 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <span className="hidden h-10 w-10 shrink-0 place-items-center rounded-md border border-line bg-surface text-brand sm:grid"><ChartIcon /></span>
              <div>
                <h3 className="font-semibold">See it in action</h3>
                <p className="text-[15px] text-ink-3">Open a sample stats page to see what you get for every link.</p>
              </div>
            </div>
            <Link href="/d/demo" className="btn-ghost h-11 shrink-0">View demo stats <ArrowIcon width={16} height={16} /></Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-line py-20 sm:py-28">
        <div className="container-x">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">Features</p>
            <h2 className="h2 mt-3">Everything a link needs.<br />Nothing it doesn&apos;t.</h2>
            <p className="mt-4 text-[17px] text-ink-3">The essentials of a professional link manager, free for everyone.</p>
          </div>
          <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-6">
            <Feature className="lg:col-span-4" icon={ChartIcon} title="Analytics you can read" text="Clicks per day, top countries and cities, devices, browsers, systems and referrers, on one clean page.">
              <div className="flex h-28 items-end gap-2" aria-hidden>
                {[30, 45, 38, 58, 50, 72, 62, 85, 78, 100].map((h, i, a) => (
                  <span key={i} className={`flex-1 rounded-t-[3px] ${i === a.length - 1 ? "bg-brand" : "bg-brand/25"}`} style={{ height: `${h}%` }} />
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5" aria-hidden>
                {["Search", "Social", "Email", "Direct"].map((t, i) => (
                  <span key={t} className="chip"><span className={`h-1.5 w-1.5 rounded-full ${i ? "bg-line-strong" : "bg-brand"}`} />{t}</span>
                ))}
              </div>
            </Feature>
            <Feature className="lg:col-span-2" icon={QrIcon} title="QR codes" text="Every link gets a QR code: PNG for screens, SVG for print. Scans are counted on their own.">
              <div className="grid h-full min-h-28 place-items-center" aria-hidden>
                <span className="grid h-24 w-24 place-items-center rounded-lg border border-line bg-surface shadow-card"><QrIcon width={64} height={64} strokeWidth={1.6} className="text-ink" /></span>
              </div>
            </Feature>
            <Feature className="lg:col-span-2" icon={TagIcon} title="Custom aliases" text="Pick a readable ending like /spring-sale. 5–64 characters, first come, first served.">
              <div className="grid h-full min-h-28 place-items-center" aria-hidden>
                <div className="flex w-full max-w-64 overflow-hidden rounded-md border border-brand ring-4 ring-brand/15 font-mono text-sm">
                  <span className="border-r border-line bg-surface-2 px-2.5 py-2 text-ink-3">hdh/</span>
                  <span className="bg-surface px-2.5 py-2 font-medium">spring-sale</span>
                </div>
              </div>
            </Feature>
            <Feature className="lg:col-span-2" icon={ClockIcon} title="Expiry and passwords" text="Links that stop after a date or a number of clicks, or only open with a password.">
              <div className="space-y-2 text-sm" aria-hidden>
                {[[ClockIcon, "Expires", "3d 04h", "text-warn"], [ChartIcon, "Clicks", "412 / 500", "text-brand"], [LockIcon, "Password", "••••••", "text-ok"]].map(([Icon, k, v, c]) => {
                  const I = Icon as typeof ClockIcon;
                  return (
                    <div key={k as string} className="flex items-center justify-between rounded-md border border-line bg-surface px-3 py-2">
                      <span className="flex items-center gap-2"><I width={14} height={14} className={c as string} />{k as string}</span>
                      <span className="font-medium tabular-nums">{v as string}</span>
                    </div>
                  );
                })}
              </div>
            </Feature>
            <Feature className="lg:col-span-2" icon={SlidersIcon} title="Privacy by choice" text="Full control, public stats, or no tracking at all. You decide per link.">
              <div className="space-y-2 text-[13px]" aria-hidden>
                {[["Full", "Stats + edit/delete with a secret code"], ["Stats only", "Anyone with the link can view stats"], ["None", "No tracking, no management"]].map(([t, d], i) => (
                  <div key={t} className={`flex gap-2.5 rounded-md border px-3 py-2 ${i ? "border-line bg-surface" : "border-brand-line bg-brand-soft"}`}>
                    <span className={`mt-0.5 h-3.5 w-3.5 shrink-0 rounded-full border ${i ? "border-line-strong" : "border-brand bg-[radial-gradient(circle,var(--brand)_40%,transparent_45%)]"}`} />
                    <span><span className="block font-medium">{t}</span><span className="text-ink-3">{d}</span></span>
                  </div>
                ))}
              </div>
            </Feature>
            <Feature className="lg:col-span-4" icon={ShieldIcon} title="Safety built in" text="Destinations are checked against a blocklist (and Google Safe Browsing when configured). Harmful links show a warning.">
              <div className="grid gap-2 text-sm sm:grid-cols-3" aria-hidden>
                {["Safe Browsing check", "Domain blocklist", "Abuse reports"].map((t) => (
                  <span key={t} className="flex items-center gap-2 rounded-md border border-line bg-surface px-3 py-2.5">
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-ok-soft text-ok"><CheckIcon width={12} height={12} /></span>{t}
                  </span>
                ))}
              </div>
            </Feature>
            <Feature className="lg:col-span-2" icon={BoltIcon} title="Fast redirects" text="A single lookup and a plain redirect. Counting happens in the same step.">
              <div className="flex items-center gap-3 font-mono text-xs" aria-hidden>
                <span className="rounded-sm border border-line bg-surface px-2 py-1">hdh/abc</span>
                <span className="relative h-px flex-1 bg-line-strong"><span className="absolute left-0 top-1/2 h-0.5 w-1/4 -translate-y-1/2 rounded bg-brand" /></span>
                <span className="rounded-sm border border-line bg-surface px-2 py-1 text-ink-3">302</span>
              </div>
            </Feature>
            <article className="card grid gap-6 p-6 md:col-span-2 lg:col-span-6 lg:grid-cols-[2fr_3fr] lg:items-center">
              <div>
                <h3 className="flex items-center gap-3 text-[17px] font-semibold tracking-[-0.02em]"><span className="icon-tile"><CardIcon width={16} height={16} /></span>Bio link page</h3>
                <p className="mt-3 text-[15px] leading-6 text-ink-3">Gather all your links on one page with your name, a short bio and your colours. Free with an account.</p>
                <Link href={user ? "/page" : "/register"} className="btn-ghost mt-5 h-9 text-sm">Create page <ArrowIcon width={14} height={14} /></Link>
              </div>
              <div className="flex items-center justify-center gap-3 rounded-lg border border-line bg-surface-2 p-4" aria-hidden>
                {["bg-[oklch(25%_0.05_280)]", "bg-[linear-gradient(160deg,oklch(62%_0.2_35),oklch(85%_0.17_90))]", "bg-[linear-gradient(160deg,oklch(95%_0.04_155),oklch(88%_0.08_155))]"].map((bg, i) => (
                  <span key={i} className={`flex h-32 w-24 flex-col items-center gap-2 rounded-lg p-3 shadow-card ${bg} ${i === 2 ? "hidden sm:flex" : ""}`}>
                    <span className="h-7 w-7 rounded-full bg-white/85" />
                    <span className="h-1.5 w-10 rounded bg-white/50" />
                    <span className="mt-1 h-3 w-full rounded bg-white/30" />
                    <span className="h-3 w-full rounded bg-white/30" />
                    <span className="h-3 w-full rounded bg-white/30" />
                  </span>
                ))}
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* Account */}
      <section id="account" className="border-t border-line bg-surface-2/40 py-20 sm:py-28">
        <div className="container-x grid gap-12 lg:grid-cols-2 lg:gap-14">
          <div>
            <p className="eyebrow">Free account</p>
            <h2 className="h2 mt-3">Keep every link<br className="hidden sm:block" /> in one place</h2>
            <p className="mt-4 max-w-md text-[17px] leading-7 text-ink-3">Guests can do almost everything. An account adds a dashboard that follows you across devices.</p>
            <ul className="mt-8 grid gap-x-8 gap-y-7 sm:grid-cols-2">
              {[
                [CloudIcon, "Saved in the cloud", "Your links follow you to every device and browser."],
                [GridIcon, "A real dashboard", "Search, filter and sort; edit destinations, passwords and expiry; restore from trash."],
                [KeyIcon, "Claim guest links", "Links made on this device join your account when you sign in."],
                [UserIcon, "Sign in your way", "Email and password, or Google and GitHub when enabled."],
              ].map(([Icon, t, d]) => {
                const I = Icon as typeof CloudIcon;
                return (
                  <li key={t as string}>
                    <span className="grid h-9 w-9 place-items-center rounded-md bg-brand-soft text-brand"><I width={16} height={16} /></span>
                    <p className="mt-3 font-semibold tracking-[-0.01em]">{t as string}</p>
                    <p className="mt-1 text-sm leading-6 text-ink-3">{d as string}</p>
                  </li>
                );
              })}
            </ul>
            <div className="mt-9 flex flex-wrap items-center gap-2">
              {user ? (
                <Link href="/dashboard" className="btn-primary h-11">Open dashboard <ArrowIcon width={16} height={16} /></Link>
              ) : (
                <>
                  <Link href="/register" className="btn-primary h-11">Create free account <ArrowIcon width={16} height={16} /></Link>
                  <Link href="/login" className="btn-quiet h-11">Log in</Link>
                </>
              )}
            </div>
          </div>
          <div className="self-start overflow-hidden rounded-xl border border-line bg-surface shadow-card">
            <table className="w-full text-sm">
              <caption className="sr-only">Guest vs Free account</caption>
              <thead>
                <tr className="border-b border-line bg-surface-2 text-left">
                  <th scope="col" className="px-4 py-3.5 font-normal text-ink-3 sm:px-5">Feature</th>
                  <th scope="col" className="px-2 py-3.5 text-center font-semibold">Guest</th>
                  <th scope="col" className="bg-brand-soft/60 px-2 py-3.5 text-center font-semibold text-brand">Free account</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Shorten links", true, true],
                  ["Custom alias", true, true],
                  ["Expiry and password", true, true],
                  ["QR code", true, true],
                  ["Click analytics", "With secret code", true],
                  ["Edit or delete", "With secret code", true],
                  ["Dashboard on every device", false, true],
                  ["Bio link page", false, true],
                ].map(([f, g, a]) => (
                  <tr key={f as string} className="border-t border-line first:border-t-0">
                    <th scope="row" className="px-4 py-3 text-left font-normal sm:px-5">{f as string}</th>
                    <td className="px-2 py-3 text-center"><Cell v={g} /></td>
                    <td className="bg-brand-soft/60 px-2 py-3 text-center"><Cell v={a} /></td>
                  </tr>
                ))}
                <tr className="border-t border-line bg-surface-2">
                  <th scope="row" className="px-4 py-3.5 text-left font-normal sm:px-5">Price</th>
                  <td className="px-2 py-3.5 text-center font-semibold">Free</td>
                  <td className="bg-brand-soft/60 px-2 py-3.5 text-center font-semibold text-brand">Free</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Check */}
      <section id="check" className="py-20 sm:py-24">
        <div className="container-x grid gap-6 lg:grid-cols-2">
          <div className="card p-6 sm:p-7">
            <span className="grid h-10 w-10 place-items-center rounded-md border border-line bg-surface-2 text-brand"><SearchIcon /></span>
            <h2 className="mt-5 text-xl font-semibold tracking-[-0.02em]">Check a short link</h2>
            <p className="mt-1.5 text-[15px] text-ink-3">Paste a short link or just its code to open its stats page and see the destination before you click.</p>
            <CheckLinkForm />
          </div>
          <div className="rounded-xl border border-brand-line bg-brand-soft/70 p-6 sm:p-7">
            <span className="grid h-10 w-10 place-items-center rounded-md bg-brand text-brand-ink"><ShieldIcon /></span>
            <h2 className="mt-5 text-xl font-semibold tracking-[-0.02em]">Know where you land</h2>
            <p className="mt-1.5 text-[15px] text-ink-2">Every destination is checked when it&apos;s saved and again when it changes. Unsafe links show a warning page instead of redirecting.</p>
            <ul className="mt-5 space-y-3 text-[15px]">
              {["See the destination before you click", "Blocked links show a warning, not the site", "Report abuse from any page"].map((t) => (
                <li key={t} className="flex items-center gap-2.5">
                  <span className="grid h-5 w-5 place-items-center rounded-full border border-line bg-surface text-ok"><CheckIcon width={12} height={12} /></span>{t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="pb-20 sm:pb-28">
        <div className="container-x grid gap-10 lg:grid-cols-[2fr_3fr] lg:gap-16">
          <div>
            <p className="eyebrow">FAQ</p>
            <h2 className="h2 mt-3">Frequently<br className="hidden lg:block" /> asked questions</h2>
            <p className="mt-4 max-w-sm text-[17px] leading-7 text-ink-3">Quick answers about hdh. For step-by-step help, read the user guide.</p>
            <Link href="/docs/guide" className="btn-ghost mt-6 h-11">Read the user guide <ArrowIcon width={16} height={16} /></Link>
          </div>
          <div className="self-start divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface shadow-card">
            {FAQ.map(([q, a], i) => (
              <details key={q} className="group" open={i === 0}>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-[15px] font-semibold tracking-[-0.01em] hover:bg-surface-2/60 sm:px-6">
                  {q}
                  <ChevronIcon className="shrink-0 text-ink-3 transition-transform group-open:rotate-180" />
                </summary>
                <p className="px-5 pb-5 text-sm leading-6 text-ink-3 sm:px-6">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section>
        <div className="container-x">
          <div className="relative overflow-hidden rounded-2xl bg-[linear-gradient(135deg,oklch(52%_0.24_285),oklch(30%_0.16_279)_45%,oklch(26%_0.13_275))] px-6 py-16 text-center text-white sm:px-12 sm:py-20">
            <div aria-hidden className="grid-bg absolute inset-0 opacity-20" />
            <div aria-hidden className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-[radial-gradient(circle,oklch(60%_0.14_230/.6),transparent_70%)]" />
            <div className="relative">
              <h2 className="mx-auto max-w-md text-[2rem] font-semibold leading-[1.1] tracking-[-0.035em] sm:text-[2.9rem]">Ready to shorten your first link?</h2>
              <p className="mx-auto mt-4 max-w-xl text-white/75">It takes a second, and you don&apos;t need an account.</p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Link href="/#top" className="btn h-12 bg-white px-6 text-[oklch(30%_0.16_279)] shadow-lift hover:bg-white/90">Shorten a link <ArrowIcon width={16} height={16} /></Link>
                {!user && <Link href="/register" className="btn h-12 border border-white/25 bg-white/5 px-6 text-white hover:bg-white/10">Create free account</Link>}
              </div>
            </div>
          </div>
        </div>
      </section>
    </Shell>
  );
}

function Feature({ icon: Icon, title, text, className = "", children }: { icon: typeof ChartIcon; title: string; text: string; className?: string; children: React.ReactNode }) {
  return (
    <article className={`card flex flex-col p-6 ${className}`}>
      <h3 className="flex items-center gap-3 text-[17px] font-semibold tracking-[-0.02em]"><span className="icon-tile"><Icon width={16} height={16} /></span>{title}</h3>
      <p className="mt-3 text-[15px] leading-6 text-ink-3">{text}</p>
      <div className="mt-6 flex-1 rounded-lg border border-line bg-surface-2 p-4">{children}</div>
    </article>
  );
}

function Cell({ v }: { v: string | boolean | undefined }) {
  if (v === true) return <><CheckIcon width={16} height={16} className="inline text-ok" /><span className="sr-only">Yes</span></>;
  if (v === false || v === undefined) return <><span aria-hidden className="text-line-strong">—</span><span className="sr-only">No</span></>;
  return <span className="text-xs text-ink-3">{v}</span>;
}

function PreviewCard() {
  const pts = [22, 30, 27, 36, 35, 44, 41, 52, 48, 58, 66, 62, 78, 88];
  const W = 700, H = 230, max = 100;
  const xy = pts.map((p, i) => [(i / (pts.length - 1)) * W, H - (p / max) * H] as const);
  const line = xy.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  return (
    <figure aria-label="Example stats" className="mx-auto max-w-[64rem] overflow-hidden rounded-2xl border border-line bg-surface shadow-lift">
      <div className="flex items-center gap-3 border-b border-line bg-surface-2 px-4 py-2.5">
        <span aria-hidden className="flex gap-1.5">{[0, 1, 2].map((i) => <span key={i} className="h-2.5 w-2.5 rounded-full bg-line-strong" />)}</span>
        <span className="mx-auto flex items-center gap-1.5 rounded-md border border-line bg-surface px-4 py-1 text-xs text-ink-3 sm:px-24"><LockIcon width={11} height={11} />hdh.link/d/launch</span>
        <span className="hidden rounded-md bg-brand-soft px-2 py-0.5 text-xs font-medium text-brand sm:inline">Example</span>
      </div>
      <div className="grid text-left lg:grid-cols-[1fr_272px]">
        <div className="p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-mono text-lg font-medium sm:text-xl">hdh.link/<span className="text-brand">launch</span></p>
              <p className="mt-1 flex items-center gap-1.5 truncate text-sm text-ink-3"><ArrowIcon width={13} height={13} />example.com/spring-collection-2026</p>
            </div>
            <div className="sm:text-right">
              <p className="text-xs text-ink-3">Clicks · last 14 days</p>
              <p className="mt-0.5 flex items-center gap-2 text-2xl font-medium tabular-nums sm:justify-end">1,284 <span className="rounded-full bg-ok-soft px-2 py-0.5 text-xs font-medium text-ok">↗ 18%</span></p>
            </div>
          </div>
          <svg viewBox={`0 0 ${W} ${H}`} className="mt-5 h-40 w-full sm:h-56" preserveAspectRatio="none" aria-hidden>
            <defs>
              <linearGradient id="pv-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="var(--brand)" stopOpacity="0.28" />
                <stop offset="1" stopColor="var(--brand)" stopOpacity="0" />
              </linearGradient>
            </defs>
            {[0.25, 0.5, 0.75].map((f) => <line key={f} x1="0" x2={W} y1={H * f} y2={H * f} stroke="var(--line)" strokeDasharray="4 4" />)}
            <path d={`${line} L${W},${H} L0,${H} Z`} fill="url(#pv-fill)" />
            <path d={line} fill="none" stroke="var(--brand)" strokeWidth="2.2" vectorEffect="non-scaling-stroke" />
          </svg>
          <div className="mt-2 flex justify-between border-t border-line pt-2 text-xs text-ink-3"><span>Oct 9</span><span>Oct 15</span><span>Oct 22</span></div>
        </div>
        <div className="grid border-t border-line sm:grid-cols-2 lg:grid-cols-1 lg:border-l lg:border-t-0">
          <div className="p-5">
            <p className="text-xs font-medium">Top countries</p>
            {[["Vietnam", 46], ["United States", 21], ["Japan", 12], ["Singapore", 8]].map(([c, p]) => (
              <div key={c} className="mt-3">
                <div className="flex justify-between text-[13px]"><span>{c}</span><span className="tabular-nums text-ink-3">{p}%</span></div>
                <div className="mt-1 h-1 rounded bg-surface-3"><div className="h-1 rounded bg-brand" style={{ width: `${(Number(p) / 46) * 92}%` }} /></div>
              </div>
            ))}
          </div>
          <div className="flex items-start justify-between gap-4 border-t border-line p-5 sm:border-l sm:border-t-0 lg:border-l-0 lg:border-t">
            <div className="flex-1">
              <p className="text-xs font-medium">Devices</p>
              {[[PhoneIcon, "Mobile", 64], [MonitorIcon, "Desktop", 31]].map(([Icon, c, p]) => {
                const I = Icon as typeof PhoneIcon;
                return (
                  <div key={c as string} className="mt-3 flex items-center justify-between text-[13px]">
                    <span className="flex items-center gap-2"><I width={14} height={14} className="text-ink-3" />{c as string}</span>
                    <span className="tabular-nums">{p as number}%</span>
                  </div>
                );
              })}
            </div>
            <div className="text-center">
              <span className="grid h-[72px] w-[72px] place-items-center rounded-md border border-line bg-surface"><QrIcon width={52} height={52} strokeWidth={1.6} /></span>
              <p className="mt-1.5 text-[11px] text-ink-3">Scan to open</p>
            </div>
          </div>
        </div>
      </div>
    </figure>
  );
}
