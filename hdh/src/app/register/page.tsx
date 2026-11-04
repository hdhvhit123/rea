import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AuthLayout } from "@/components/AuthLayout";
import { AuthForm } from "@/components/AuthForm";
import { currentUser } from "@/lib/auth";
import { oauthProviders } from "@/lib/config";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Create your account" };

export default async function Register() {
  if (await currentUser()) redirect("/dashboard");
  return (
    <AuthLayout title="Create your account" intro="It's free, and keeps all your links in one place.">
      <Suspense><AuthForm mode="register" providers={oauthProviders()} /></Suspense>
    </AuthLayout>
  );
}
