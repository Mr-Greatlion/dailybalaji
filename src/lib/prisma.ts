import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/** Prefer a plain postgres:// URL. Prisma Postgres sets DATABASE_URL as prisma+postgres://, with POSTGRES_URL as the direct one. */
function connectionString() {
  const candidates = [process.env.DATABASE_URL, process.env.POSTGRES_URL, process.env.POSTGRES_PRISMA_URL, process.env.DATABASE_URL_UNPOOLED];
  return candidates.find((u) => u && /^postgres(ql)?:\/\//.test(u)) || process.env.DATABASE_URL;
}

function createClient() {
  const adapter = new PrismaPg({ connectionString: connectionString(), max: 5 });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
