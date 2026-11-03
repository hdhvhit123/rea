export interface ClientInfo {
  device: string;
  browser: string;
  os: string;
}

export function parseUserAgent(ua: string | null | undefined): ClientInfo {
  const s = ua ?? "";
  const bot = /bot|crawl|spider|slurp|preview|facebookexternalhit/i.test(s);
  const tablet = /iPad|Tablet|Nexus 7|Nexus 10|SM-T|Kindle|Silk/i.test(s) || (/Android/i.test(s) && !/Mobile/i.test(s));
  const mobile = !tablet && /Mobi|iPhone|iPod|Android.*Mobile|Windows Phone/i.test(s);
  const device = bot ? "Bot" : tablet ? "Tablet" : mobile ? "Mobile" : s ? "Desktop" : "Unknown";

  let browser = "Other";
  if (/Edg\//.test(s)) browser = "Edge";
  else if (/OPR\/|Opera/.test(s)) browser = "Opera";
  else if (/SamsungBrowser/.test(s)) browser = "Samsung Internet";
  else if (/Firefox\/|FxiOS/.test(s)) browser = "Firefox";
  else if (/Chrome\/|CriOS|HeadlessChrome/.test(s)) browser = "Chrome";
  else if (/Safari\//.test(s)) browser = "Safari";
  else if (!s) browser = "Unknown";

  let os = "Other";
  if (/Windows/.test(s)) os = "Windows";
  else if (/iPhone|iPad|iPod/.test(s)) os = "iOS";
  else if (/Mac OS X|Macintosh/.test(s)) os = "macOS";
  else if (/Android/.test(s)) os = "Android";
  else if (/CrOS/.test(s)) os = "ChromeOS";
  else if (/Linux/.test(s)) os = "Linux";
  else if (!s) os = "Unknown";

  return { device, browser, os };
}

/**
 * Country/city come from edge geo headers when a proxy (Cloudflare, Vercel) adds them.
 * Without such headers the country falls back to the Accept-Language region and is
 * labelled as an estimate; the city is "Unknown".
 */
export function geoFromHeaders(h: Headers): { country: string; city: string } {
  const country = h.get("cf-ipcountry") || h.get("x-vercel-ip-country") || h.get("x-country");
  const city = h.get("x-vercel-ip-city") || h.get("cf-ipcity") || h.get("x-city");
  if (country && /^[A-Z]{2}$/i.test(country) && country.toUpperCase() !== "XX")
    return { country: country.toUpperCase(), city: city ? decodeURIComponent(city) : "Unknown" };
  const lang = h.get("accept-language") ?? "";
  const m = lang.match(/^[a-z]{2,3}-([A-Z]{2})\b/i);
  return { country: m ? m[1].toUpperCase() : "Unknown", city: "Unknown" };
}

export function referrerHost(h: Headers): string {
  const ref = h.get("referer");
  if (!ref) return "Direct";
  try {
    return new URL(ref).hostname.replace(/^www\./, "") || "Direct";
  } catch {
    return "Direct";
  }
}
