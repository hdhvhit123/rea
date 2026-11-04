import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.E2E_PORT || 3200);
const BASE = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 45_000,
  fullyParallel: false,
  workers: 1,
  reporter: [["list"], ["json", { outputFile: "evidence/test-results/e2e.json" }]],
  use: { baseURL: BASE, trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } }],
  webServer: {
    command: `node -e "require('fs').rmSync('data/e2e',{recursive:true,force:true})" && npx next start -p ${PORT}`,
    url: BASE,
    reuseExistingServer: false,
    timeout: 60_000,
    env: { HDH_BASE_URL: BASE, HDH_DATABASE_PATH: "data/e2e/e2e.db", HDH_MAIL_OUTBOX: "data/e2e/outbox", HDH_RATE_BURST: "1000", HDH_RATE_DAILY: "1000" },
  },
});
