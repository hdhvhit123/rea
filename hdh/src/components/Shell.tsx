import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main id="main">{children}</main>
      <SiteFooter />
    </>
  );
}
