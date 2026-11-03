import type { Metadata } from "next";
import { DashShell } from "@/components/DashShell";
import { BioEditor } from "@/components/BioEditor";
import { getBioByUser } from "@/lib/bio";
import { baseUrl } from "@/lib/config";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Bio page", robots: { index: false } };

export default function BioPageEditor() {
  return <DashShell path="/page">{(u) => <BioEditor initial={getBioByUser(u.id)} base={baseUrl()} />}</DashShell>;
}
