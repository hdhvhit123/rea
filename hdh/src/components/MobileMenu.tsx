"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MenuIcon, XIcon } from "./icons";

export function MobileMenu({ nav, signedIn }: { nav: { href: string; label: string }[]; signedIn: boolean }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);
  return (
    <div className="md:hidden">
      <button type="button" className="btn-quiet h-9 px-2" aria-expanded={open} aria-controls="mobile-nav" aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen((v) => !v)}>
        {open ? <XIcon /> : <MenuIcon />}
      </button>
      {open && (
        <div id="mobile-nav" className="animate-pop absolute inset-x-0 top-16 border-b border-line bg-surface shadow-lg">
          <nav aria-label="Mobile" className="container-x flex flex-col py-3">
            {nav.map((n) => (
              <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className="rounded-lg px-2 py-3 text-base font-medium text-ink hover:bg-surface-2">
                {n.label}
              </Link>
            ))}
            <div className="mt-2 flex gap-2 border-t border-line pt-3">
              {signedIn ? (
                <Link href="/dashboard" className="btn-dark flex-1" onClick={() => setOpen(false)}>Dashboard</Link>
              ) : (
                <>
                  <Link href="/login" className="btn-ghost flex-1" onClick={() => setOpen(false)}>Log in</Link>
                  <Link href="/register" className="btn-dark flex-1" onClick={() => setOpen(false)}>Sign up</Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}
