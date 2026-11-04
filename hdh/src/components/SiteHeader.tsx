import Link from "next/link";
import { currentUser } from "@/lib/auth";
import { Logo } from "./icons";
import { MobileMenu } from "./MobileMenu";

/** Section links shown next to the logo on the home page only (as on the reference). */
export const HOME_NAV = [
  { href: "/#features", label: "Features" },
  { href: "/#how", label: "How it works" },
  { href: "/#check", label: "Check a link" },
];
export const NAV = [...HOME_NAV, { href: "/docs", label: "Docs" }];

export async function SiteHeader({ home = false }: { home?: boolean }) {
  const user = await currentUser();
  return (
    <header className={`top-0 z-40 ${home ? "absolute inset-x-0" : "sticky border-b border-line bg-bg/80 backdrop-blur"}`}>
      <div className="container-x flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-8">
          <Link href="/" aria-label="hdh home" className="-m-1 rounded-md p-1">
            <Logo />
          </Link>
          {home && (
            <nav aria-label="Main" className="hidden items-center gap-0.5 md:flex">
              {HOME_NAV.map((n) => (
                <Link key={n.href} href={n.href} className="btn-quiet h-9 px-3 text-sm">
                  {n.label}
                </Link>
              ))}
            </nav>
          )}
        </div>
        <div className="hidden items-center gap-1 md:flex">
          <Link href="/docs" className="btn-quiet h-9 px-3 text-sm">Docs</Link>
          <span className="inline-flex h-9 items-center px-2.5 text-sm font-medium text-ink-2" title="Language: English">EN</span>
          <span aria-hidden className="mx-2 h-5 w-px bg-line" />
          {user ? (
            <Link href="/dashboard" className="btn-dark h-9 px-3 text-sm">Dashboard</Link>
          ) : (
            <>
              <Link href="/login" className="btn-quiet h-9 px-3 text-sm">Log in</Link>
              <Link href="/register" className="btn-dark h-9 px-3 text-sm">Sign up</Link>
            </>
          )}
        </div>
        <MobileMenu nav={NAV} signedIn={Boolean(user)} />
      </div>
    </header>
  );
}
