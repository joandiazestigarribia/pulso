import { prisma } from "@/lib/db"
import { isAnonymousSessionId } from "@/lib/identity"

export interface MergeResult {
  auditId: string
  merged: boolean
  movedBattles: number
  sourceAnonymousId: string | null
  targetUserId: string
  status: "MERGED" | "NOOP" | "INVALID_SOURCE"
}

type MergeAuditStatus = MergeResult["status"]

export async function ensureUserExists(userId: string): Promise<void> {
  await prisma.user.upsert({
    where: { id: userId },
    create: { id: userId },
    update: {},
  })
}

export async function mergeAnonymousBattlesToUser(params: {
  anonymousId: string | null
  targetUserId: string
}): Promise<MergeResult> {
  const { anonymousId, targetUserId } = params

  await ensureUserExists(targetUserId)

  if (!anonymousId || !isAnonymousSessionId(anonymousId) || anonymousId === targetUserId) {
    const audit = await prisma.mergeAudit.create({
      data: {
        sourceAnonymousId: anonymousId,
        targetUserId,
        movedBattles: 0,
        status: anonymousId ? "INVALID_SOURCE" : "NOOP",
      },
    })

    return {
      auditId: audit.id,
      merged: false,
      movedBattles: 0,
      sourceAnonymousId: anonymousId ?? null,
      targetUserId,
      status: anonymousId ? "INVALID_SOURCE" : "NOOP",
    }
  }

  const mergeOutcome = await prisma.$transaction(async (tx) => {
    const updated = await tx.battle.updateMany({
      where: { userId: anonymousId },
      data: { userId: targetUserId },
    })

    const remainingBattles = await tx.battle.count({
      where: { userId: anonymousId },
    })

    if (remainingBattles === 0) {
      await tx.user.deleteMany({
        where: { id: anonymousId },
      })
    }

    const status: MergeAuditStatus = updated.count > 0 ? "MERGED" : "NOOP"
    const audit = await tx.mergeAudit.create({
      data: {
        sourceAnonymousId: anonymousId,
        targetUserId,
        movedBattles: updated.count,
        status,
      },
    })

    return {
      movedBattles: updated.count,
      status,
      auditId: audit.id,
    }
  })

  return {
    auditId: mergeOutcome.auditId,
    merged: mergeOutcome.movedBattles > 0,
    movedBattles: mergeOutcome.movedBattles,
    sourceAnonymousId: anonymousId,
    targetUserId,
    status: mergeOutcome.status,
  }
}
