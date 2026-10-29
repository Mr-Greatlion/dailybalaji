// Runs `prisma db push` using whichever Postgres URL the host provides.
// Vercel integrations name it differently (Neon: DATABASE_URL / POSTGRES_URL;
// Prisma Postgres: DATABASE_URL (prisma+postgres://) + POSTGRES_URL).
import { spawnSync } from "node:child_process";

const names = ["DATABASE_URL", "POSTGRES_URL", "POSTGRES_PRISMA_URL", "DATABASE_URL_UNPOOLED", "POSTGRES_URL_NON_POOLING"];
const found = names.find((n) => process.env[n] && /^postgres(ql)?:\/\//.test(process.env[n]));

if (!found) {
  console.warn("[db-push] No postgres:// URL found in env (" + names.join(", ") + "). Skipping table creation.");
  console.warn("[db-push] Connect a Postgres database to this Vercel project (Storage tab) and redeploy.");
  process.exit(0);
}

console.log(`[db-push] Using ${found}`);
const r = spawnSync("npx", ["prisma", "db", "push", "--skip-generate", "--accept-data-loss"], {
  stdio: "inherit",
  shell: true,
  env: { ...process.env, DATABASE_URL: process.env[found] },
});
process.exit(r.status ?? 1);
