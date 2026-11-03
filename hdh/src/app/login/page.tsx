import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AuthLayout } from "@/components/AuthLayout";
import { AuthForm } from "@/components/AuthForm";
import { currentUser } from "@/lib/auth";
import { oauthProviders } from "@/lib/config";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Log in" };

export default async function Login() {
  if (await currentUser()) redirect("/dashboard");
  return (
    <AuthLayout title="Welcome back" intro="Log in to manage your links on any device.">
      <Suspense><AuthForm mode="login" providers={oauthProviders()} /></Suspense>
    </AuthLayout>
  );
}
