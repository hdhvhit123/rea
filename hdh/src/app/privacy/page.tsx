import type { Metadata } from "next";
import { DocPage } from "@/components/DocPage";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function Privacy() {
  return (
    <DocPage title="Privacy Policy" lead="What hdh stores and why. Placeholder text — have it reviewed before going live.">
      <h2>When you create a link</h2>
      <p>We store the destination, the settings you chose, a hashed password if you set one, and the secret code for Full links.</p>
      <h2>When someone clicks a link</h2>
      <p>For links with statistics we store the time, country and city (from network geo headers when available, otherwise estimated from the browser language), device type, browser, operating system and the referring site. We don&apos;t store IP addresses in the click log.</p>
      <h2>Accounts</h2>
      <p>We store your email, a hashed password and login sessions. Connected Google or GitHub accounts store only their account id.</p>
      <h2>On your device</h2>
      <p>Recent links (including secret codes) are kept in your browser&apos;s local storage. Clear the list anytime from the home page.</p>
      <h2>Your choices</h2>
      <p>Pick the privacy mode “None” to create links that collect no statistics. Delete links or your data from the dashboard.</p>
    </DocPage>
  );
}
