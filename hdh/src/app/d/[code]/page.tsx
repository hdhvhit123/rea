import type { Metadata } from "next";
import { Shell } from "@/components/Shell";
import { StatsView } from "@/components/StatsView";
import { DEMO_CODE, ensureDemo } from "@/lib/demo";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const { code } = await params;
  return { title: `Stats for /${code}`, robots: { index: false } };
}

export default async function StatsPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const isDemo = code.toLowerCase() === DEMO_CODE;
  if (isDemo) ensureDemo();
  return (
    <Shell>
      <div className="container-x">
        <StatsView code={code} isDemo={isDemo} />
      </div>
    </Shell>
  );
}
