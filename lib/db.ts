import { PrismaClient } from "@prisma/client"

declare global {
  var prisma: PrismaClient | undefined
}

const DEV_DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/pulso?schema=public"
const MISSING_TEST_DATABASE_URL = "postgresql://postgres:postgres@127.0.0.1:1/pulso_test_missing?schema=public"
const isTestRuntime = process.env.NODE_ENV === "test" || process.env.PULSO_TEST_MODE === "1"
const resolvedDatabaseUrl =
  isTestRuntime
    ? process.env.TEST_DATABASE_URL ?? MISSING_TEST_DATABASE_URL
    : process.env.DATABASE_URL ?? (process.env.NODE_ENV !== "production" ? DEV_DATABASE_URL : undefined)

export class MissingDatabaseUrlError extends Error {
  constructor() {
    super("DATABASE_URL is not configured")
    this.name = "MissingDatabaseUrlError"
  }
}

export function assertDatabaseConfigured(): void {
  if (!resolvedDatabaseUrl || (isTestRuntime && !process.env.TEST_DATABASE_URL)) {
    throw new MissingDatabaseUrlError()
  }
}

export const prisma =
  global.prisma ??
  new PrismaClient({
    ...(resolvedDatabaseUrl
      ? {
          datasources: {
            db: {
              url: resolvedDatabaseUrl,
            },
          },
        }
      : {}),
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  })

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma
}
