import Link from "next/link";
import { Shell } from "@/components/Shell";
import { ShortenForm } from "@/components/ShortenForm";
import { RecentLinks } from "@/components/RecentLinks";
import { CheckLinkForm } from "@/components/CheckLinkForm";
import { currentUser } from "@/lib/auth";
import { ChartIcon, QrIcon, TagIcon, ClockIcon, EyeIcon, ShieldIcon, BoltIcon, UserIcon, CheckIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

const FEATURES = [
  { icon: ChartIcon, title: "Analytics you can read", text: "Clicks per day, top countries and cities, devices, browsers, systems and referrers — on one clean page." },
  { icon: QrIcon, title: "QR codes", text: "Every link gets a QR code. Download PNG for screens or SVG for print; scans are counted on their own." },
  { icon: TagIcon, title: "Custom aliases", text: "Pick a readable ending like /spring-sale. 5–64 characters, first come, first served." },
  { icon: ClockIcon, title: "Expiry and passwords", text: "Let links end after minutes, hours, days or a number of clicks, and lock them with a password." },
  { icon: EyeIcon, title: "Privacy by choice", text: "Full, Stats only or None: decide who sees statistics and whether the link can be managed at all." },
  { icon: ShieldIcon, title: "Safety built in", text: "Destinations are checked against a blocklist (and Google Safe Browsing when configured). Harmful links show a warning." },
  { icon: BoltIcon, title: "Fast redirects", text: "A single lookup and a plain redirect. Counting happens in the same step, nothing else in the way." },
  { icon: UserIcon, title: "Bio link page", text: "Gather all your links on one page with your name, a short bio and your colours. Free with an account." },
];

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
    <Shell>
      {/* Hero */}
      <section id="top" className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-40 -z-10 h-[520px] bg-[radial-gradient(60%_60%_at_50%_30%,color-mix(in_oklab,var(--brand)_18%,transparent),transparent)]" />
        <div className="container-x grid items-start gap-10 pb-16 pt-12 sm:pt-16 lg:grid-cols-[1.15fr_1fr] lg:gap-14 lg:pt-20">
          <div>
            <p className="eyebrow">Free link shortener</p>
            <h1 className="mt-3 text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.4rem]">
              Shorten links, <span className="text-brand">track every click</span>
            </h1>
            <p className="mt-4 max-w-xl text-lg text-ink-2">
              Turn long addresses into short, memorable links with a QR code, optional expiry and password, and analytics that are easy to read.
            </p>
            <div className="mt-7">
              <ShortenForm signedIn={Boolean(user)} />
              <RecentLinks />
            </div>
            <ul className="mt-6 grid grid-cols-1 gap-2 text-sm text-ink-2 sm:grid-cols-2">
              {["Free to use", "No sign-up needed", "Links checked for safety", "Redirects in one hop"].map((t) => (
                <li key={t} className="flex items-center gap-2"><CheckIcon width={16} height={16} className="text-ok" />{t}</li>
              ))}
            </ul>
          </div>
          <PreviewCard />
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-y border-line bg-surface py-16 sm:py-20">
        <div className="container-x">
          <p className="eyebrow">How it works</p>
          <h2 className="h2 mt-2">From long URL to tracked link in seconds</h2>
          <ol className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              ["Paste your link", "Drop any http or https address into the box. No need to type https://."],
              ["Make it yours", "Optionally set an alias, an expiry, a password and who can see stats."],
              ["Share and measure", "Copy the link or download its QR code, then watch clicks arrive on the stats page."],
            ].map(([t, d], i) => (
              <li key={t} className="card p-6">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-soft text-sm font-bold text-brand">{i + 1}</span>
                <h3 className="mt-4 text-lg font-semibold">{t}</h3>
                <p className="mt-1.5 text-ink-2">{d}</p>
              </li>
            ))}
          </ol>
          <div className="mt-10 flex flex-col items-start justify-between gap-4 rounded-2xl bg-brand-soft p-6 sm:flex-row sm:items-center">
            <div>
              <h3 className="text-lg font-semibold">See it in action</h3>
              <p className="text-ink-2">Open a sample stats page filled with demo clicks.</p>
            </div>
            <Link href="/d/demo" className="btn-primary">View demo stats</Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-16 sm:py-20">
        <div className="container-x">
          <p className="eyebrow">Features</p>
          <h2 className="h2 mt-2">Everything a link needs. Nothing it doesn&apos;t.</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <article key={title} className="card p-5 transition-shadow hover:shadow-md">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-soft text-brand"><Icon /></span>
                <h3 className="mt-4 font-semibold">{title}</h3>
                <p className="mt-1.5 text-sm leading-6 text-ink-2">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Account */}
      <section id="account" className="border-y border-line bg-surface py-16 sm:py-20">
        <div className="container-x grid gap-10 lg:grid-cols-2">
          <div>
            <p className="eyebrow">Free account</p>
            <h2 className="h2 mt-2">Keep every link in one place</h2>
            <ul className="mt-6 space-y-4">
              {[
                ["Saved in the cloud", "Your links follow you to every device and browser."],
                ["A real dashboard", "Search, filter and sort; edit destinations, passwords and expiry; restore from trash."],
                ["Claim guest links", "Links made on this device join your account when you sign in."],
                ["Sign in your way", "Email and password, or Google and GitHub when enabled."],
              ].map(([t, d]) => (
                <li key={t} className="flex gap-3">
                  <CheckIcon className="mt-0.5 shrink-0 text-ok" />
                  <div><p className="font-semibold">{t}</p><p className="text-sm text-ink-2">{d}</p></div>
                </li>
              ))}
            </ul>
            <div className="mt-7 flex flex-wrap gap-2">
              {user ? (
                <Link href="/dashboard" className="btn-primary">Open dashboard</Link>
              ) : (
                <>
                  <Link href="/register" className="btn-primary">Create free account</Link>
                  <Link href="/login" className="btn-ghost">Log in</Link>
                </>
              )}
            </div>
          </div>
          <div className="card overflow-x-auto p-2">
            <table className="w-full min-w-[340px] text-sm">
              <caption className="px-3 pb-2 pt-3 text-left font-semibold">Guest vs Free account</caption>
              <thead>
                <tr className="text-left text-ink-3">
                  <th scope="col" className="px-3 py-2 font-medium">Feature</th>
                  <th scope="col" className="px-3 py-2 font-medium">Guest</th>
                  <th scope="col" className="px-3 py-2 font-medium">Free account</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Shorten links", "✓", "✓"],
                  ["Custom alias", "✓", "✓"],
                  ["Expiry and password", "✓", "✓"],
                  ["QR code", "✓", "✓"],
                  ["Click analytics", "With secret code", "✓"],
                  ["Edit or delete", "With secret code", "✓"],
                  ["Dashboard on every device", "—", "✓"],
                  ["Bio link page", "—", "✓"],
                  ["Price", "Free", "Free"],
                ].map(([f, g, a]) => (
                  <tr key={f} className="border-t border-line">
                    <th scope="row" className="px-3 py-2.5 text-left font-medium">{f}</th>
                    <td className="px-3 py-2.5 text-ink-2">{g}</td>
                    <td className="px-3 py-2.5 font-medium text-ok">{a}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Check */}
      <section id="check" className="py-16 sm:py-20">
        <div className="container-x max-w-3xl">
          <p className="eyebrow">Check a short link</p>
          <h2 className="h2 mt-2">Where does this link go?</h2>
          <p className="mt-2 text-ink-2">Paste a short link or just its code to open its stats page and see the destination before you click.</p>
          <CheckLinkForm />
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-t border-line bg-surface py-16 sm:py-20">
        <div className="container-x max-w-3xl">
          <h2 className="h2">Frequently asked questions</h2>
          <div className="mt-8 divide-y divide-line rounded-2xl border border-line">
            {FAQ.map(([q, a]) => (
              <details key={q} className="group px-5 py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                  {q}
                  <span aria-hidden className="text-ink-3 transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-2 text-ink-2">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="container-x">
          <div className="rounded-3xl bg-brand px-6 py-12 text-center text-brand-ink sm:px-12">
            <h2 className="text-2xl font-bold sm:text-3xl">Ready to shorten your first link?</h2>
            <p className="mx-auto mt-2 max-w-xl opacity-90">It takes a second, and you don&apos;t need an account.</p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <Link href="/#top" className="btn bg-white text-[#15142a] hover:opacity-90">Shorten a link</Link>
              {!user && <Link href="/register" className="btn border border-white/50 text-inherit hover:bg-white/10">Create free account</Link>}
            </div>
          </div>
        </div>
      </section>
    </Shell>
  );
}

function PreviewCard() {
  const bars = [3, 5, 4, 7, 6, 9, 8, 12, 10, 14, 11, 16, 15, 19];
  const max = Math.max(...bars);
  return (
    <aside aria-label="Example stats" className="card hidden p-5 shadow-[0_30px_80px_-40px_rgba(21,20,42,0.35)] md:block">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-bold text-brand">hdh.link/launch</p>
          <p className="text-xs text-ink-3">example.com/products/spring-launch-2026</p>
        </div>
        <span className="chip">Example</span>
      </div>
      <div className="mt-5 flex items-end justify-between">
        <div>
          <p className="text-3xl font-extrabold">1,284</p>
          <p className="text-xs text-ink-3">clicks · last 14 days</p>
        </div>
        <p className="rounded-full bg-ok-soft px-2 py-0.5 text-xs font-semibold text-ok">+18%</p>
      </div>
      <div className="mt-4 flex h-28 items-end gap-1.5" aria-hidden>
        {bars.map((b, i) => (
          <span key={i} className="flex-1 rounded-t bg-brand/80" style={{ height: `${(b / max) * 100}%` }} />
        ))}
      </div>
      <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-3">Top countries</p>
          {[["Vietnam", 46], ["United States", 21], ["Japan", 12]].map(([c, p]) => (
            <div key={c} className="mb-1.5">
              <div className="flex justify-between text-xs"><span>{c}</span><span className="text-ink-3">{p}%</span></div>
              <div className="mt-0.5 h-1.5 rounded bg-surface-2"><div className="h-1.5 rounded bg-brand" style={{ width: `${p}%` }} /></div>
            </div>
          ))}
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-3">Devices</p>
          {[["Mobile", 64], ["Desktop", 31], ["Tablet", 5]].map(([c, p]) => (
            <div key={c} className="mb-1.5">
              <div className="flex justify-between text-xs"><span>{c}</span><span className="text-ink-3">{p}%</span></div>
              <div className="mt-0.5 h-1.5 rounded bg-surface-2"><div className="h-1.5 rounded bg-ok" style={{ width: `${p}%` }} /></div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
