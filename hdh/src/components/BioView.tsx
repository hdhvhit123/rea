import type { BioPage } from "@/lib/bio";

/** Shared renderer for the public bio page and the editor preview. */
export function BioView({ page }: { page: Pick<BioPage, "displayName" | "bio" | "theme" | "accent" | "links" | "handle"> }) {
  const dark = page.theme === "dark";
  const initials = page.displayName.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "?";
  return (
    <div className="min-h-full w-full px-5 py-12" style={{ background: dark ? "#111120" : "#f7f7fc", color: dark ? "#f2f2fa" : "#15142a" }}>
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-full text-2xl font-bold text-white" style={{ background: page.accent }} aria-hidden>
          {initials}
        </div>
        <h1 className="mt-4 text-2xl font-bold">{page.displayName || "Your name"}</h1>
        {page.bio && <p className="mt-2 whitespace-pre-line text-sm opacity-80">{page.bio}</p>}
        <ul className="mt-8 grid gap-3">
          {page.links.length === 0 && <li className="text-sm opacity-60">No links yet.</li>}
          {page.links.map((l, i) => (
            <li key={i}>
              <a
                href={l.url || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-xl px-4 py-3.5 text-sm font-semibold transition-transform hover:-translate-y-0.5"
                style={{ background: page.accent, color: "#fff" }}
              >
                {l.title || "Untitled link"}
              </a>
            </li>
          ))}
        </ul>
        <p className="mt-10 text-xs opacity-60">Made with hdh</p>
      </div>
    </div>
  );
}
