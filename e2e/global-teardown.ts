import { execSync } from "node:child_process";

export default async function globalTeardown() {
  if (process.env.KEEP_TEST_DB) return;
  execSync("docker compose stop test-db", { stdio: "inherit" });
}
