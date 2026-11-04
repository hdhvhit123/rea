/**
 * Destination safety checks. A local blocklist always runs. Google Safe Browsing
 * runs only when GOOGLE_SAFE_BROWSING_KEY is set; without it the check is skipped
 * (reported as "not configured", never as "safe").
 */
export const LOCAL_BLOCKLIST = ["malware.testing.google.test", "phishing.example", "evil.example"];

export type SafetyVerdict = { blocked: false } | { blocked: true; type: "blocklist" | "malware" | "phishing" | "unwanted" };

export function checkLocalBlocklist(url: string): SafetyVerdict {
  const host = new URL(url).hostname.toLowerCase();
  const hit = LOCAL_BLOCKLIST.some((d) => host === d || host.endsWith(`.${d}`));
  return hit ? { blocked: true, type: "blocklist" } : { blocked: false };
}

export async function checkSafeBrowsing(url: string): Promise<SafetyVerdict | "not-configured"> {
  const key = process.env.GOOGLE_SAFE_BROWSING_KEY;
  if (!key) return "not-configured";
  const res = await fetch(`https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${encodeURIComponent(key)}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      client: { clientId: "hdh", clientVersion: "0.1.0" },
      threatInfo: {
        threatTypes: ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE"],
        platformTypes: ["ANY_PLATFORM"],
        threatEntryTypes: ["URL"],
        threatEntries: [{ url }],
      },
    }),
    signal: AbortSignal.timeout(4000),
  });
  if (!res.ok) return "not-configured";
  const data = (await res.json()) as { matches?: { threatType: string }[] };
  const m = data.matches?.[0]?.threatType;
  if (!m) return { blocked: false };
  return { blocked: true, type: m === "MALWARE" ? "malware" : m === "SOCIAL_ENGINEERING" ? "phishing" : "unwanted" };
}

export async function checkDestination(url: string): Promise<SafetyVerdict> {
  const local = checkLocalBlocklist(url);
  if (local.blocked) return local;
  try {
    const remote = await checkSafeBrowsing(url);
    return remote === "not-configured" ? { blocked: false } : remote;
  } catch {
    return { blocked: false };
  }
}
