import Link from "next/link";
import { Logo } from "./icons";

const GROUPS = [
  { title: "Product", links: [["/#top", "Shorten a link"], ["/#features", "Features"], ["/#check", "Check a link"], ["/d/demo", "View demo stats"]] },
  { title: "Account", links: [["/register", "Sign up"], ["/login", "Log in"], ["/forgot-password", "Reset password"]] },
  { title: "More", links: [["/terms", "Terms"], ["/privacy", "Privacy"], ["/docs", "Documentation"], ["/docs/api", "API"], ["/abuse", "Report abuse"]] },
];

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-line bg-surface-2/50">
      <div className="container-x grid gap-10 pb-12 pt-14 sm:grid-cols-3 lg:grid-cols-[1fr_auto_auto_auto] lg:gap-x-28">
        <div className="sm:col-span-3 lg:col-span-1">
          <Logo />
          <p className="mt-4 max-w-xs text-sm leading-6 text-ink-3">Short links with QR codes and click analytics. Free for everyone.</p>
        </div>
        {GROUPS.map((g) => (
          <div key={g.title}>
            <h2 className="text-sm font-semibold text-ink">{g.title}</h2>
            <ul className="mt-4 space-y-3">
              {g.links.map(([href, label]) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-ink-3 hover:text-ink">{label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="container-x">
        <div className="flex flex-col gap-2 border-t border-line py-6 text-[13px] text-ink-3 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} hdh · Short links, measured.</span>
          <span className="font-medium text-ink-2">EN</span>
        </div>
      </div>
    </footer>
  );
}
