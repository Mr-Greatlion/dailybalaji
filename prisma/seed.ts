import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { runBootstrap } from "../src/lib/bootstrap";

const url = [process.env.DATABASE_URL, process.env.POSTGRES_URL].find((u) => u && /^postgres(ql)?:\/\//.test(u)) || process.env.DATABASE_URL;
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });

runBootstrap(prisma, { email: process.env.ADMIN_EMAIL || "admin@dailybalaji.com", password: process.env.ADMIN_PASSWORD || "ChangeMe@123" })
  .then((log) => { log.forEach((l) => console.log(l)); return prisma.$disconnect(); })
  .catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1); });
