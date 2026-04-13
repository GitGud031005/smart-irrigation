import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// ─── Global singleton ────────────────────────────────────────────────────────
// Without this, Next.js HMR would create a new PrismaClient (and a new pg
// Pool) on every file save, exhausting the database's connection limit.

const globalForPrisma = global as unknown as {
  prisma: PrismaClient;
};

// ─── Connection pool ─────────────────────────────────────────────────────────
// Passing a PoolConfig object instead of a Pool instance avoids the @types/pg
// version mismatch between `pg` and the copy bundled inside @prisma/adapter-pg.
// PrismaPg creates its own Pool internally from this config.
//
// max: 2 – keep low; Vercel can run many concurrent function instances.
// idleTimeoutMillis: 10 s – release idle sockets quickly (serverless).
// connectionTimeoutMillis: 5 s – fail fast rather than queue indefinitely.
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  max: 2,
  idleTimeoutMillis: 10_000,
  connectionTimeoutMillis: 5_000,
});

const prisma: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
