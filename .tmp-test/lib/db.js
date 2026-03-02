"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = exports.MissingDatabaseUrlError = void 0;
exports.assertDatabaseConfigured = assertDatabaseConfigured;
const client_1 = require("@prisma/client");
const DEV_DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/pulso?schema=public";
const resolvedDatabaseUrl = process.env.DATABASE_URL ?? (process.env.NODE_ENV !== "production" ? DEV_DATABASE_URL : undefined);
class MissingDatabaseUrlError extends Error {
    constructor() {
        super("DATABASE_URL is not configured");
        this.name = "MissingDatabaseUrlError";
    }
}
exports.MissingDatabaseUrlError = MissingDatabaseUrlError;
function assertDatabaseConfigured() {
    if (!resolvedDatabaseUrl) {
        throw new MissingDatabaseUrlError();
    }
}
exports.prisma = global.prisma ??
    new client_1.PrismaClient({
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
    });
if (process.env.NODE_ENV !== "production") {
    global.prisma = exports.prisma;
}
