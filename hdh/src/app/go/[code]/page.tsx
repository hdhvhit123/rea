import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Shell } from "@/components/Shell";
import { findLink, linkState } from "@/lib/links";
import { LockIcon, ShieldIcon, ClockIcon } from "@/components/icons";
import { RevealDestination } from "@/components/RevealDestination";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Open link", robots: { index: false } };

const ERR: Record<string, string> = {
  "auth.invalidPassword": "Wrong password. Try again.",
  "auth.passwordRequired": "Enter the password to continue.",
  "rateLimit.tooManyAttempts": "Too many wrong attempts. Please wait a few minutes and try again.",
};

export default async function Gate({ params, searchParams }: { params: Promise<{ code: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { code } = await params;
  const sp = await searchParams;
  const row = findLink(code);
  const box = (icon: React.ReactNode, title: string, body: React.ReactNode, tone = "bg-brand-soft text-brand") => (
    <Shell>
      <div className="container-x max-w-md py-16 sm:py-24">
        <div className="card p-6 text-center">
          <span className={`mx-auto grid h-12 w-12 place-items-center rounded-xl ${tone}`}>{icon}</span>
          <h1 className="mt-4 text-xl font-bold">{title}</h1>
          <div className="mt-2 text-ink-2">{body}</div>
        </div>
      </div>
    </Shell>
  );

  if (!row) notFound();

  const st = linkState(row);
  if (st.state === "deleted")
    return box(<ClockIcon />, "This link was deleted", <><p>Its owner removed it, so it no longer redirects.</p><Link href="/" className="btn-primary mt-5">Shorten your own link</Link></>, "bg-surface-2 text-ink-2");
  if (st.state === "expired")
    return box(
      <ClockIcon />,
      "This link has expired",
      <><p>{st.reason === "clicks" ? "It reached its click limit." : "Its time limit has passed."} The destination is no longer available through this link.</p><Link href="/" className="btn-primary mt-5">Shorten your own link</Link></>,
      "bg-warn-soft text-warn",
    );
  if (st.state === "blocked")
    return box(
      <ShieldIcon />,
      "Warning: this link may be harmful",
      <>
        <p>We blocked it because it was flagged as <strong>{st.blockedType}</strong>. We recommend not visiting it.</p>
        <RevealDestination code={row.code} />
      </>,
      "bg-bad-soft text-bad",
    );

  const isQr = sp.qr === "1";
  return box(
    <LockIcon />,
    "This link is password-protected",
    <>
      <p>Enter the password to continue to the destination.</p>
      <form method="post" action={`/api/go/${encodeURIComponent(row.code)}`} className="mt-5 text-left">
        {isQr && <input type="hidden" name="qr" value="1" />}
        <label htmlFor="pw" className="label">Password</label>
        <input id="pw" name="password" type="password" className="input" autoFocus required autoComplete="off" aria-invalid={Boolean(sp.error)} aria-describedby={sp.error ? "pw-err" : undefined} />
        {sp.error && <p id="pw-err" role="alert" className="mt-2 text-sm text-bad">{ERR[sp.error] ?? "Couldn't open the link."}</p>}
        <button className="btn-primary mt-4 w-full">Continue</button>
      </form>
    </>,
  );
}
