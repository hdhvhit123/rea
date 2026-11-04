import type { Metadata } from "next";
import { DocPage } from "@/components/DocPage";
import { AbuseForm } from "@/components/AbuseForm";

export const metadata: Metadata = { title: "Report abuse" };

export default function Abuse() {
  return (
    <DocPage title="Report abuse" lead="Tell us about a short link used for phishing, malware or spam. We review every report.">
      <AbuseForm />
    </DocPage>
  );
}
