import type { Metadata } from "next";
import { DashShell } from "@/components/DashShell";
import { LinksDashboard } from "@/components/LinksDashboard";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Dashboard", robots: { index: false } };

export default function DashboardPage() {
  return <DashShell path="/dashboard">{() => <LinksDashboard />}</DashShell>;
}
