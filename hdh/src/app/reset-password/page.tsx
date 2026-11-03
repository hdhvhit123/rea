import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthLayout } from "@/components/AuthLayout";
import { ResetForm } from "@/components/ResetForms";

export const metadata: Metadata = { title: "Choose a new password" };

export default function Reset() {
  return (
    <AuthLayout title="Choose a new password" intro="After saving you'll be signed in, and other sessions are signed out.">
      <Suspense><ResetForm /></Suspense>
    </AuthLayout>
  );
}
