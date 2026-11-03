export const BRAND = "hdh";

export function baseUrl(): string {
  return (process.env.HDH_BASE_URL || "http://localhost:3000").replace(/\/+$/, "");
}

export function baseHost(): string {
  try {
    return new URL(baseUrl()).host;
  } catch {
    return "localhost:3000";
  }
}

export const shortUrlFor = (code: string) => `${baseUrl()}/${code}`;
export const statsUrlFor = (code: string) => `${baseUrl()}/d/${code}`;

export const oauthProviders = () => ({
  google: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
  github: Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET),
});
