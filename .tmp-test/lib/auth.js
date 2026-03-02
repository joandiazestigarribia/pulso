"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureUserExists = ensureUserExists;
exports.mergeAnonymousBattlesToUser = mergeAnonymousBattlesToUser;
const db_1 = require("@/lib/db");
const identity_1 = require("@/lib/identity");
async function ensureUserExists(userId) {
    await db_1.prisma.user.upsert({
        where: { id: userId },
        create: { id: userId },
        update: {},
    });
}
async function mergeAnonymousBattlesToUser(params) {
    const { anonymousId, targetUserId } = params;
    await ensureUserExists(targetUserId);
    if (!anonymousId || !(0, identity_1.isAnonymousSessionId)(anonymousId) || anonymousId === targetUserId) {
        const audit = await db_1.prisma.mergeAudit.create({
            data: {
                sourceAnonymousId: anonymousId,
                targetUserId,
                movedBattles: 0,
                status: anonymousId ? "INVALID_SOURCE" : "NOOP",
            },
        });
        return {
            auditId: audit.id,
            merged: false,
            movedBattles: 0,
            sourceAnonymousId: anonymousId ?? null,
            targetUserId,
            status: anonymousId ? "INVALID_SOURCE" : "NOOP",
        };
    }
    const mergeOutcome = await db_1.prisma.$transaction(async (tx) => {
        const updated = await tx.battle.updateMany({
            where: { userId: anonymousId },
            data: { userId: targetUserId },
        });
        const remainingBattles = await tx.battle.count({
            where: { userId: anonymousId },
        });
        if (remainingBattles === 0) {
            await tx.user.deleteMany({
                where: { id: anonymousId },
            });
        }
        const status = updated.count > 0 ? "MERGED" : "NOOP";
        const audit = await tx.mergeAudit.create({
            data: {
                sourceAnonymousId: anonymousId,
                targetUserId,
                movedBattles: updated.count,
                status,
            },
        });
        return {
            movedBattles: updated.count,
            status,
            auditId: audit.id,
        };
    });
    return {
        auditId: mergeOutcome.auditId,
        merged: mergeOutcome.movedBattles > 0,
        movedBattles: mergeOutcome.movedBattles,
        sourceAnonymousId: anonymousId,
        targetUserId,
        status: mergeOutcome.status,
    };
}
