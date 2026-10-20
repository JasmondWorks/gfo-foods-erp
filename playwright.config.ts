import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

dotenv.config({ path: ".env.test" });

const PORT = process.env.PORT ?? "3100";
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["html"], ["list"]] : "list",
  globalTeardown: "./e2e/global-teardown.ts",
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], storageState: "e2e/.auth/user.json" },
      dependencies: ["setup"],
    },
  ],
  webServer: {
    command: "npm run build && npm run start -- -p " + PORT,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 180_000,
    env: {
      DATABASE_URL: process.env.DATABASE_URL!,
      DIRECT_URL: process.env.DIRECT_URL!,
      AUTH_SECRET: process.env.AUTH_SECRET!,
      NEXTAUTH_URL: baseURL,
      PORT,
    },
  },
});
