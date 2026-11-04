import Link from "next/link";
import { redirect } from "next/navigation";
import { Shell } from "./Shell";
import { currentUser, type User } from "@/lib/auth";
import { DashNav } from "./DashNav";

export async function DashShell({ path, children }: { path: string; children: (user: User) => React.ReactNode }) {
  const user = await currentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(path)}`);
  return (
    <Shell>
      <div className="container-x py-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">Dashboard</p>
            <p className="mt-1 text-sm text-ink-2">Signed in as <span className="font-medium text-ink">{user.email}</span></p>
          </div>
          <Link href="/" className="text-sm font-medium text-ink-2 hover:text-brand">← Home</Link>
        </div>
        <DashNav />
        <div className="mt-6">{children(user)}</div>
      </div>
    </Shell>
  );
}
