import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getBioByHandle } from "@/lib/bio";
import { BioView } from "@/components/BioView";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }): Promise<Metadata> {
  const { handle } = await params;
  const p = getBioByHandle(handle);
  return p ? { title: p.displayName, description: p.bio || `Links from ${p.displayName}` } : { title: "Page not found" };
}

export default async function PublicBio({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const page = getBioByHandle(handle);
  if (!page) notFound();
  return (
    <main id="main" className="min-h-dvh">
      <BioView page={page} />
    </main>
  );
}
