import { prisma } from "@/lib/db"
import { isAnonymousSessionId } from "@/lib/identity"

export interface MergeResult {
  auditId: string
  merged: boolean
  movedBattles: number
  movedPlaylists: number
  movedAttempts: number
  sourceAnonymousId: string | null
  targetUserId: string
  status: "MERGED" | "NOOP" | "INVALID_SOURCE"
}

type MergeAuditStatus = MergeResult["status"]

interface AttemptWithAnswerCount {
  id: string
  playlistId: string
  score: number
  completedAt: Date | null
  _count: { answers: number }
}

/** Picks which attempt survives a merge conflict: completed beats in-progress,
 * then higher score, then earlier completion, then more answers. Ties keep the
 * target user's attempt so the account row is not replaced needlessly. */
function pickPreferredAttempt(
  anonymousAttempt: AttemptWithAnswerCount,
  targetAttempt: AttemptWithAnswerCount
): AttemptWithAnswerCount {
  const anonymousCompleted = anonymousAttempt.completedAt !== null
  const targetCompleted = targetAttempt.completedAt !== null

  if (anonymousCompleted !== targetCompleted) {
    return anonymousCompleted ? anonymousAttempt : targetAttempt
  }

  if (anonymousCompleted && targetCompleted) {
    if (anonymousAttempt.score !== targetAttempt.score) {
      return anonymousAttempt.score > targetAttempt.score ? anonymousAttempt : targetAttempt
    }

    return (anonymousAttempt.completedAt as Date) <= (targetAttempt.completedAt as Date)
      ? anonymousAttempt
      : targetAttempt
  }

  if (anonymousAttempt._count.answers !== targetAttempt._count.answers) {
    return anonymousAttempt._count.answers > targetAttempt._count.answers ? anonymousAttempt : targetAttempt
  }

  return targetAttempt
}

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
        movedPlaylists: 0,
        movedAttempts: 0,
        status: anonymousId ? "INVALID_SOURCE" : "NOOP",
      },
    })

    return {
      auditId: audit.id,
      merged: false,
      movedBattles: 0,
      movedPlaylists: 0,
      movedAttempts: 0,
      sourceAnonymousId: anonymousId ?? null,
      targetUserId,
      status: anonymousId ? "INVALID_SOURCE" : "NOOP",
    }
  }

  const mergeOutcome = await prisma.$transaction(async (tx) => {
    const movedBattles = await tx.battle.updateMany({
      where: { userId: anonymousId },
      data: { userId: targetUserId },
    })

    const movedPlaylists = await tx.playlist.updateMany({
      where: { ownerUserId: anonymousId },
      data: { ownerUserId: targetUserId },
    })

    const anonymousAttempts = await tx.playlistAttempt.findMany({
      where: { playerUserId: anonymousId },
      include: { _count: { select: { answers: true } } },
    })

    let movedAttempts = 0

    if (anonymousAttempts.length > 0) {
      const targetAttempts = await tx.playlistAttempt.findMany({
        where: {
          playerUserId: targetUserId,
          playlistId: { in: anonymousAttempts.map((attempt) => attempt.playlistId) },
        },
        include: { _count: { select: { answers: true } } },
      })
      const targetAttemptByPlaylistId = new Map(
        targetAttempts.map((attempt) => [attempt.playlistId, attempt])
      )

      for (const anonymousAttempt of anonymousAttempts) {
        const conflictingAttempt = targetAttemptByPlaylistId.get(anonymousAttempt.playlistId)

        if (!conflictingAttempt) {
          await tx.playlistAttempt.update({
            where: { id: anonymousAttempt.id },
            data: { playerUserId: targetUserId },
          })
          movedAttempts += 1
          continue
        }

        // Two attempts exist for the same (playlist, player) pair. Keep the most
        // advanced one; the discarded attempt and its answers cascade away.
        const preferredAttempt = pickPreferredAttempt(anonymousAttempt, conflictingAttempt)

        if (preferredAttempt.id === anonymousAttempt.id) {
          await tx.playlistAttempt.delete({ where: { id: conflictingAttempt.id } })
          await tx.playlistAttempt.update({
            where: { id: anonymousAttempt.id },
            data: { playerUserId: targetUserId },
          })
          movedAttempts += 1
        } else {
          await tx.playlistAttempt.delete({ where: { id: anonymousAttempt.id } })
        }
      }
    }

    const [remainingBattles, remainingPlaylists, remainingAttempts] = await Promise.all([
      tx.battle.count({ where: { userId: anonymousId } }),
      tx.playlist.count({ where: { ownerUserId: anonymousId } }),
      tx.playlistAttempt.count({ where: { playerUserId: anonymousId } }),
    ])

    if (remainingBattles === 0 && remainingPlaylists === 0 && remainingAttempts === 0) {
      await tx.user.deleteMany({
        where: { id: anonymousId },
      })
    }

    const movedTotal = movedBattles.count + movedPlaylists.count + movedAttempts
    const status: MergeAuditStatus = movedTotal > 0 ? "MERGED" : "NOOP"
    const audit = await tx.mergeAudit.create({
      data: {
        sourceAnonymousId: anonymousId,
        targetUserId,
        movedBattles: movedBattles.count,
        movedPlaylists: movedPlaylists.count,
        movedAttempts,
        status,
      },
    })

    return {
      movedBattles: movedBattles.count,
      movedPlaylists: movedPlaylists.count,
      movedAttempts,
      status,
      auditId: audit.id,
    }
  })

  return {
    auditId: mergeOutcome.auditId,
    merged: mergeOutcome.status === "MERGED",
    movedBattles: mergeOutcome.movedBattles,
    movedPlaylists: mergeOutcome.movedPlaylists,
    movedAttempts: mergeOutcome.movedAttempts,
    sourceAnonymousId: anonymousId,
    targetUserId,
    status: mergeOutcome.status,
  }
}
