import { expect, test, type Page } from "@playwright/test";

// External destinations are intercepted so tests never leave the local app.
async function stubDestinations(page: Page) {
  await page.route(/^https:\/\/(example\.com|example\.org|docs\.example\.net)\//, (r) =>
    r.fulfill({ status: 200, contentType: "text/html", body: `<title>Destination</title><h1>dest:${r.request().url()}</h1>` }),
  );
}

test.beforeEach(async ({ page }) => stubDestinations(page));

test("guest shortens with options, redirects and sees stats", async ({ page, request }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.keyboard.press("/");
  await expect(page.getByLabel("Long URL")).toBeFocused();
  await page.getByLabel("Long URL").fill("example.com/guest-flow");
  await page.getByRole("button", { name: /Options/ }).click();
  await page.getByLabel("Custom alias").fill("guest-flow");
  await page.getByRole("button", { name: "Shorten", exact: true }).click();
  await expect(page.getByText("Your short link is ready")).toBeVisible();
  await expect(page.getByTestId("short-url")).toHaveText(/\/guest-flow$/);
  const secret = await page.getByTestId("secret-code").textContent();
  expect(secret).toMatch(/^[A-Za-z0-9]{24}$/);
  await expect(page.getByRole("region", { name: "Recent links" })).toContainText("guest-flow");

  const res = await request.get("/guest-flow", { maxRedirects: 0, headers: { referer: "https://t.co/x", "accept-language": "vi-VN" } });
  expect(res.status()).toBe(302);
  expect(res.headers().location).toBe("https://example.com/guest-flow");

  await page.goto("/d/guest-flow");
  await expect(page.getByRole("heading", { name: /guest-flow/ })).toBeVisible();
  await expect(page.getByText("Total clicks").locator("..")).toContainText("1");
  await expect(page.getByRole("region", { name: "Recent clicks" })).toContainText("t.co");

  // duplicate alias is rejected with the stable error message
  await page.goto("/");
  await page.getByLabel("Long URL").fill("example.org/other");
  await page.getByRole("button", { name: /Options/ }).click();
  await page.getByLabel("Custom alias").fill("guest-flow");
  await page.getByRole("button", { name: "Shorten", exact: true }).click();
  await expect(page.locator("main").getByRole("alert")).toContainText("already taken");
});

test("validation errors show inline", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Shorten", exact: true }).click();
  await expect(page.locator("main").getByRole("alert")).toContainText("Paste a link");
  await page.getByLabel("Long URL").fill("not a url");
  await page.getByRole("button", { name: "Shorten", exact: true }).click();
  await expect(page.locator("main").getByRole("alert")).toContainText("valid web address");
});

test("password gate, expiry page and stats lock", async ({ page, request }) => {
  const created = await (await request.post("/api/links", { data: { originalUrl: "example.com/secret-page", password: "letmein", customCode: "pw-gate" } })).json();
  await page.goto("/pw-gate");
  await expect(page.getByRole("heading", { name: "This link is password-protected" })).toBeVisible();
  await page.getByLabel("Password").fill("wrong");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.locator("main").getByRole("alert")).toContainText("Wrong password");
  await page.getByLabel("Password").fill("letmein");
  // The 303 to the destination is a redirect, which page.route can't stub, so assert the request itself.
  const dest = page.waitForRequest("https://example.com/secret-page");
  await page.getByRole("button", { name: "Continue" }).click();
  expect((await dest).url()).toBe("https://example.com/secret-page");
  await page.waitForURL((u) => u.host !== "localhost:3200");

  // stats need the secret code on another device (no local storage)
  await page.goto("/d/pw-gate");
  await expect(page.getByRole("heading", { name: /are protected/ })).toBeVisible();
  await page.getByLabel("Secret code").fill("wrong-secret");
  await page.getByRole("button", { name: "View stats" }).click();
  await expect(page.locator("main").getByRole("alert")).toContainText("not correct");
  await page.getByLabel("Secret code").fill(created.secretCode);
  await page.getByRole("button", { name: "View stats" }).click();
  await expect(page.getByText("Total clicks").locator("..")).toContainText("1");

  // manage: set a click limit already reached -> rejected; then expire via 1-click link
  await page.getByRole("button", { name: "Edit" }).click();
  await page.getByLabel("Expiry action").selectOption("clicks");
  await page.getByLabel("Expiry amount").fill("1");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.locator("main").getByRole("alert")).toContainText("higher than the clicks");

  await request.post("/api/links", { data: { originalUrl: "example.com/once", customCode: "only-once", expireMode: "clicks", expireAfter: 1 } });
  expect((await request.get("/only-once", { maxRedirects: 0 })).status()).toBe(302);
  await page.goto("/only-once");
  await expect(page.getByRole("heading", { name: "This link has expired" })).toBeVisible();
});

test("check a link, demo stats and 404s", async ({ page }) => {
  await page.goto("/#check");
  await page.getByLabel("Short link or code").fill("http://localhost:3200/demo");
  await page.getByRole("button", { name: "Check link" }).click();
  await expect(page).toHaveURL(/\/d\/demo$/);
  await expect(page.getByText("Demo: these are generated sample clicks")).toBeVisible();
  await expect(page.getByRole("region", { name: "Devices" })).toContainText("Mobile");
  await page.getByRole("tab", { name: "Cities" }).click();
  await expect(page.getByRole("region", { name: "Locations" })).toContainText("Hanoi");

  const r = await page.goto("/no-such-code");
  expect(r?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
});

test("account: register, claim guest link, manage, trash, export, bio page", async ({ page }) => {
  // a guest link on this device
  await page.goto("/");
  await page.getByLabel("Long URL").fill("example.com/claim-me");
  await page.getByRole("button", { name: "Shorten", exact: true }).click();
  await expect(page.getByText("Your short link is ready")).toBeVisible();

  await page.goto("/register");
  await page.getByLabel("Email").fill(`user${Date.now()}@example.com`);
  await page.getByLabel(/^Password/).fill("short");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.locator("main").getByRole("alert")).toContainText("8 characters");
  await page.getByLabel(/^Password/).fill("correct horse battery");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByTestId("dash-row")).toContainText("example.com/claim-me");

  // create from dashboard
  await page.getByRole("button", { name: "New link" }).click();
  await page.getByLabel("Long URL").fill("docs.example.net/handbook");
  await page.getByRole("button", { name: /Options/ }).click();
  await page.getByLabel("Custom alias").fill("handbook");
  await page.getByRole("button", { name: "Shorten", exact: true }).click();
  await expect(page.getByTestId("dash-row")).toHaveCount(2);

  // search + filter
  await page.getByLabel("Search links").fill("handbook");
  await expect(page.getByTestId("dash-row")).toHaveCount(1);
  await page.getByLabel("Search links").fill("");
  await page.getByLabel("Filter").selectOption("protected");
  await expect(page.getByText("No links match")).toBeVisible();
  await page.getByLabel("Filter").selectOption("all");

  // edit title
  const row = page.getByTestId("dash-row").filter({ hasText: "handbook" });
  await row.getByRole("button", { name: "Edit" }).click();
  await page.getByLabel("Title").fill("Team handbook");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByTestId("dash-row").filter({ hasText: "Team handbook" })).toBeVisible();

  // export
  const dl = page.waitForEvent("download");
  await page.getByRole("button", { name: "Import / Export" }).click();
  await page.getByRole("link", { name: "CSV" }).click();
  const csv = await (await dl).path();
  const text = (await import("node:fs")).readFileSync(csv!, "utf8");
  expect(text.split("\n")[0]).toContain("shortCode,shortUrl,originalUrl");
  expect(text).toContain("handbook");

  // delete -> trash -> restore
  await page.getByTestId("dash-row").filter({ hasText: "Team handbook" }).getByRole("button", { name: "Edit" }).click();
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Delete link" }).click();
  await expect(page.getByTestId("dash-row")).toHaveCount(1);
  await page.getByRole("link", { name: "Trash" }).click();
  await expect(page.getByTestId("trash-row")).toContainText("handbook");
  await page.getByRole("button", { name: "Restore" }).click();
  await expect(page.getByText("Trash is empty.")).toBeVisible();

  // owner sees stats without a secret
  await page.goto("/d/handbook");
  await expect(page.getByText("Your link", { exact: true })).toBeVisible();

  // bio page
  await page.goto("/page");
  await page.getByLabel("Address", { exact: true }).fill("hdh-team");
  await page.getByRole("button", { name: "Next" }).click();
  await page.getByLabel("Display name").fill("HDH Team");
  await page.getByLabel(/Short bio/).fill("Links we like.");
  await page.getByRole("button", { name: "Next" }).click();
  await page.getByLabel("Link 1 title").fill("Handbook");
  await page.getByLabel("Link 1 URL").fill("docs.example.net/handbook");
  await page.getByRole("button", { name: "Next" }).click();
  await page.getByRole("button", { name: "Save page" }).click();
  await expect(page.getByRole("status")).toContainText("Published");
  await page.goto("/u/hdh-team");
  await expect(page.getByRole("heading", { name: "HDH Team" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Handbook" })).toHaveAttribute("href", "https://docs.example.net/handbook");

  // settings + logout
  await page.goto("/dashboard/settings");
  await page.getByRole("button", { name: "Sign out other sessions" }).click();
  await expect(page.getByRole("status")).toContainText("Signed out");
  await page.getByRole("button", { name: "Log out" }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login\?next=%2Fdashboard/);
});

test("forgot password writes a reset mail to the outbox and the link works", async ({ page, request }) => {
  const email = `reset${Date.now()}@example.com`;
  await request.post("/api/auth/register", { data: { email, password: "first-password" } });
  await page.goto("/forgot-password");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Send reset link" }).click();
  await expect(page.getByText("Check your inbox")).toBeVisible();
  const fs = await import("node:fs");
  const dir = "data/e2e/outbox";
  const file = fs.readdirSync(dir).find((f) => f.includes(email.replace(/[^a-z0-9@.]/gi, "_")))!;
  const token = fs.readFileSync(`${dir}/${file}`, "utf8").match(/token=([A-Za-z0-9]+)/)![1];
  await page.goto(`/reset-password?token=${token}`);
  await page.getByLabel(/New password/).fill("second-password");
  await page.getByRole("button", { name: "Set new password" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
});

test("abuse report form validates and submits", async ({ page }) => {
  await page.goto("/abuse");
  await page.getByRole("button", { name: "Send report" }).click();
  await expect(page.locator("main").getByRole("alert")).toContainText("short link");
  await page.getByLabel("Short link").fill("guest-flow");
  await page.getByLabel("What's wrong?").selectOption("spam");
  await page.getByLabel("Details").fill("Sent to me in an unsolicited message.");
  await page.getByRole("button", { name: "Send report" }).click();
  await expect(page.getByRole("status")).toContainText("report was received");
});

test("api contract basics", async ({ request }) => {
  const simple = await request.get("/api/links/create?url=example.org/simple&format=simple");
  expect(simple.status()).toBe(201);
  expect(await simple.text()).toMatch(/^http:\/\/localhost:3200\/[A-Za-z0-9]{6}$/);
  const self = await request.post("/api/links", { data: { originalUrl: "http://localhost:3200/x" } });
  expect(self.status()).toBe(400); // localhost has no TLD -> invalid URL
  const bad = await request.post("/api/links", { data: { originalUrl: "a.com", customCode: "-bad1" } });
  expect((await bad.json()).errorKey).toBe("customCodeErr.startsWithSymbol");
  const prev = await request.get("/api/links/guest-flow/preview");
  expect((await prev.json()).originalUrl).toBe("https://example.com/guest-flow");
  const svg = await request.get("/api/links/guest-flow/qr?format=svg");
  expect(svg.headers()["content-type"]).toContain("image/svg+xml");
  const total = await (await request.get("/api/links/stats/total")).json();
  expect(total.total).toBeGreaterThan(3);
});
