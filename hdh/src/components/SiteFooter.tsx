import Link from "next/link";
import { Logo } from "./icons";

const GROUPS = [
  { title: "Product", links: [["/#top", "Shorten a link"], ["/#features", "Features"], ["/#check", "Check a link"], ["/d/demo", "View demo stats"]] },
  { title: "Account", links: [["/register", "Sign up"], ["/login", "Log in"], ["/forgot-password", "Reset password"]] },
  { title: "More", links: [["/terms", "Terms"], ["/privacy", "Privacy"], ["/docs", "Documentation"], ["/docs/api", "API"], ["/abuse", "Report abuse"]] },
];

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-line bg-surface">
      <div className="container-x grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <Logo />
          <p className="mt-3 max-w-sm text-sm text-ink-2">Short links with QR codes, expiry, passwords and clear click analytics. Free, with or without an account.</p>
        </div>
        {GROUPS.map((g) => (
          <div key={g.title}>
            <h2 className="text-sm font-semibold text-ink">{g.title}</h2>
            <ul className="mt-3 space-y-2">
              {g.links.map(([href, label]) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-ink-2 hover:text-brand">{label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-line">
        <div className="container-x flex flex-col gap-1 py-5 text-xs text-ink-3 sm:flex-row sm:justify-between">
          <span>© {new Date().getFullYear()} hdh. All rights reserved.</span>
          <span>Made for sharing, measured with care.</span>
        </div>
      </div>
    </footer>
  );
}
