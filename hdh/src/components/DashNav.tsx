"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  ["/dashboard", "Links"],
  ["/dashboard/trash", "Trash"],
  ["/page", "Bio page"],
  ["/dashboard/settings", "Settings"],
];

export function DashNav() {
  const p = usePathname();
  return (
    <nav aria-label="Dashboard" className="mt-5 flex gap-1 overflow-x-auto border-b border-line">
      {TABS.map(([href, label]) => {
        const active = p === href;
        return (
          <Link key={href} href={href} aria-current={active ? "page" : undefined} className={`-mb-px whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium ${active ? "border-brand text-ink" : "border-transparent text-ink-3 hover:text-ink"}`}>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
