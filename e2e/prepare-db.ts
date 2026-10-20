import { execSync } from "node:child_process";
import dotenv from "dotenv";

dotenv.config({ path: ".env.test" });

const env = { ...process.env };

execSync("docker compose up -d test-db", { stdio: "inherit" });

execSync(
  `docker exec gfo-foods-test-db sh -c 'until pg_isready -U gfo -d gfo_foods_test; do sleep 0.5; done'`,
  { stdio: "inherit" },
);

execSync("npx prisma migrate deploy", { stdio: "inherit", env });
execSync("npx prisma db seed", { stdio: "inherit", env });
