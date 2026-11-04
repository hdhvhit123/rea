import type { Metadata } from "next";
import { DashShell } from "@/components/DashShell";
import { SettingsPanel } from "@/components/SettingsPanel";
import { oauthProviders } from "@/lib/config";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Settings", robots: { index: false } };

export default function SettingsPage() {
  return (
    <DashShell path="/dashboard/settings">
      {(u) => <SettingsPanel email={u.email} hasPassword={Boolean(u.password_hash)} google={Boolean(u.google_id)} github={Boolean(u.github_id)} providers={oauthProviders()} />}
    </DashShell>
  );
}
