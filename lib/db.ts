import { PrismaClient } from "@prisma/client"

declare global {
  var prisma: PrismaClient | undefined
}

const DEV_DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/pulso?schema=public"
const resolvedDatabaseUrl =
  process.env.DATABASE_URL ?? (process.env.NODE_ENV !== "production" ? DEV_DATABASE_URL : undefined)

export class MissingDatabaseUrlError extends Error {
  constructor() {
    super("DATABASE_URL is not configured")
    this.name = "MissingDatabaseUrlError"
  }
}

export function assertDatabaseConfigured(): void {
  if (!resolvedDatabaseUrl) {
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
