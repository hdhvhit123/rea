import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";

export function Shell({ children, home = false }: { children: React.ReactNode; home?: boolean }) {
  return (
    <>
      <SiteHeader home={home} />
      <main id="main">{children}</main>
      <SiteFooter />
    </>
  );
}
