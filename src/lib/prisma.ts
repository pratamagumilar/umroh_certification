import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Slow query middleware (development only)
if (process.env.NODE_ENV === "development" && !globalForPrisma.prisma) {
  prisma.$use(async (params, next) => {
    const before = Date.now();
    const result = await next(params);
    const after = Date.now();
    const duration = after - before;

    if (duration > 500) {
      console.warn(
        `⚠️ SLOW QUERY [${duration}ms]: ${params.model}.${params.action}`,
      );
    }

    return result;
  });
}
