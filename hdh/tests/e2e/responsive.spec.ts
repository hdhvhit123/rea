import { expect, test } from "@playwright/test";

const VIEWPORTS = [
  { name: "mobile", width: 360, height: 800 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1440, height: 900 },
];
const PAGES = [
  ["home", "/"],
  ["stats-demo", "/d/demo"],
  ["docs-api", "/docs/api"],
  ["docs-guide", "/docs/guide"],
  ["login", "/login"],
  ["register", "/register"],
  ["gate-notfound", "/go/does-not-exist"],
];

for (const vp of VIEWPORTS) {
  test.describe(`${vp.name} ${vp.width}x${vp.height}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    for (const [name, path] of PAGES) {
      test(`${name} has no horizontal overflow`, async ({ page }) => {
        await page.goto(path);
        await page.waitForLoadState("networkidle");
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(overflow).toBeLessThanOrEqual(0);
        await page.screenshot({ path: `evidence/build/${vp.name}-${name}.png`, fullPage: true });
      });
    }

    test("navigation works at this size", async ({ page }) => {
      await page.goto("/");
      if (vp.width < 768) {
        await page.getByRole("button", { name: "Open menu" }).click();
        await page.getByRole("navigation", { name: "Mobile" }).getByRole("link", { name: "Docs" }).click();
      } else {
        await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Docs" }).click();
      }
      await expect(page).toHaveURL(/\/docs$/);
      await page.goBack();
      await expect(page).toHaveURL(/\/$/);
      await page.goForward();
      await expect(page.getByRole("heading", { name: "Documentation" })).toBeVisible();
    });

    test("options panel and result fit", async ({ page }) => {
      await page.goto("/");
      await page.getByLabel("Long URL").fill(`example.com/${vp.name}/${"long-segment/".repeat(20)}`);
      await page.getByRole("button", { name: /Options/ }).click();
      await page.screenshot({ path: `evidence/build/${vp.name}-home-options.png` });
      await page.getByRole("button", { name: "Shorten", exact: true }).click();
      await expect(page.getByText("Your short link is ready")).toBeVisible();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(0);
      await page.screenshot({ path: `evidence/build/${vp.name}-home-result.png` });
    });

    test("dashboard fits", async ({ page, request }) => {
      await request.post("/api/auth/register", { data: { email: `vp-${vp.name}-${Date.now()}@example.com`, password: "viewport-pass" } });
      await page.context().addCookies(
        (await request.storageState()).cookies.map((c) => ({ ...c })),
      );
      await page.goto("/dashboard");
      await page.getByRole("button", { name: "New link" }).first().click();
      await page.getByLabel("Long URL").fill("example.com/dash");
      await page.getByRole("button", { name: "Shorten", exact: true }).click();
      await expect(page.getByTestId("dash-row")).toHaveCount(1);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(0);
      await page.screenshot({ path: `evidence/build/${vp.name}-dashboard.png`, fullPage: true });
    });
  });
}
