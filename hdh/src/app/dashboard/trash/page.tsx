import type { Metadata } from "next";
import { DashShell } from "@/components/DashShell";
import { TrashList } from "@/components/TrashList";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Trash", robots: { index: false } };

export default function TrashPage() {
  return <DashShell path="/dashboard/trash">{() => <TrashList />}</DashShell>;
}
