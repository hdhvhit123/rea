import { baseUrl } from "./config";
import { err } from "./errors";

/**
 * OAuth adapters for Google and GitHub. They are active only when the matching
 * client id/secret env vars are set. Not verified end to end in this repo (no credentials).
 */
export type Provider = "google" | "github";

const CFG = {
  google: {
    authorize: "https://accounts.google.com/o/oauth2/v2/auth",
    token: "https://oauth2.googleapis.com/token",
    scope: "openid email",
    id: () => process.env.GOOGLE_CLIENT_ID,
    secret: () => process.env.GOOGLE_CLIENT_SECRET,
  },
  github: {
    authorize: "https://github.com/login/oauth/authorize",
    token: "https://github.com/login/oauth/access_token",
    scope: "read:user user:email",
    id: () => process.env.GITHUB_CLIENT_ID,
    secret: () => process.env.GITHUB_CLIENT_SECRET,
  },
} as const;

export function isProvider(p: string): p is Provider {
  return p === "google" || p === "github";
}

const redirectUri = (p: Provider) => `${baseUrl()}/api/auth/oauth/${p}/callback`;

export function authorizeUrl(p: Provider, state: string): string {
  const c = CFG[p];
  const id = c.id();
  if (!id || !c.secret()) throw err(501, "auth.providerNotConfigured", `${p} sign-in is not configured.`);
  const u = new URL(c.authorize);
  u.searchParams.set("client_id", id);
  u.searchParams.set("redirect_uri", redirectUri(p));
  u.searchParams.set("response_type", "code");
  u.searchParams.set("scope", c.scope);
  u.searchParams.set("state", state);
  return u.toString();
}

export async function exchangeCode(p: Provider, code: string): Promise<{ providerId: string; email: string }> {
  const c = CFG[p];
  const tokenRes = await fetch(c.token, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" },
    body: new URLSearchParams({
      client_id: c.id() ?? "",
      client_secret: c.secret() ?? "",
      code,
      redirect_uri: redirectUri(p),
      grant_type: "authorization_code",
    }),
  });
  const tok = (await tokenRes.json()) as { access_token?: string };
  if (!tok.access_token) throw err(401, "auth.oauthFailed", "Sign-in was not completed.");
  const auth = { authorization: `Bearer ${tok.access_token}`, accept: "application/json", "user-agent": "hdh" };
  if (p === "google") {
    const info = (await (await fetch("https://openidconnect.googleapis.com/v1/userinfo", { headers: auth })).json()) as {
      sub?: string;
      email?: string;
      email_verified?: boolean;
    };
    if (!info.sub || !info.email || !info.email_verified) throw err(401, "auth.oauthFailed", "Google didn't return a verified email.");
    return { providerId: info.sub, email: info.email };
  }
  const user = (await (await fetch("https://api.github.com/user", { headers: auth })).json()) as { id?: number };
  const emails = (await (await fetch("https://api.github.com/user/emails", { headers: auth })).json()) as {
    email: string;
    primary: boolean;
    verified: boolean;
  }[];
  const primary = Array.isArray(emails) ? emails.find((e) => e.primary && e.verified) : undefined;
  if (!user.id || !primary) throw err(401, "auth.oauthFailed", "GitHub didn't return a verified email.");
  return { providerId: String(user.id), email: primary.email };
}
