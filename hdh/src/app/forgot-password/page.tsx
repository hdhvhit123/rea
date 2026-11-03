import type { Metadata } from "next";
import { AuthLayout } from "@/components/AuthLayout";
import { ForgotForm } from "@/components/ResetForms";

export const metadata: Metadata = { title: "Reset password" };

export default function Forgot() {
  return (
    <AuthLayout title="Reset your password" intro="Enter the email you signed up with and we'll send you a reset link.">
      <ForgotForm />
    </AuthLayout>
  );
}
