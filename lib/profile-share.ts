import { assertDatabaseConfigured, prisma } from "@/lib/db"
import type { FullProfileData } from "@/lib/music-dna"
import {
  getDominantGenres,
  resolvePersonaDisplayName,
  resolvePersonaShareCopy,
  resolveSonicPersona,
} from "@/lib/music-dna"
import { getMusicProfileState } from "@/lib/music-profile"

const SHARER_NAME_MAX_LENGTH = 60

export interface PublicProfileShare {
  token: string
  userId: string
  sharerName: string | null
  personaName: string
  personaCodename: string
  personaAssetFile: string
  headline: string
  description: string
  completedBattlesCount: number
  generatedFromVotes: number
  dominantGenres: string[]
  createdAt: string
}

interface ProfileShareRecord {
  id: string
  userId: string
  sharerName: string | null
  personaName: string
  personaCodename: string
  personaAssetFile: string
  headline: string
  description: string
  completedBattlesCount: number
  generatedFromVotes: number
  dominantGenres: unknown
  createdAt: Date
}

function mapRecordToPublicShare(record: ProfileShareRecord): PublicProfileShare {
  return {
    token: record.id,
    userId: record.userId,
    sharerName: record.sharerName,
    personaName: record.personaName,
    personaCodename: record.personaCodename,
    personaAssetFile: record.personaAssetFile,
    headline: record.headline,
    description: record.description,
    completedBattlesCount: record.completedBattlesCount,
    generatedFromVotes: record.generatedFromVotes,
    dominantGenres: Array.isArray(record.dominantGenres) ? (record.dominantGenres as string[]) : [],
    createdAt: record.createdAt.toISOString(),
  }
}

function sanitizeSharerName(sharerName: string | null | undefined): string | null {
  const trimmed = sharerName?.trim()
  if (!trimmed) {
    return null
  }

  return trimmed.slice(0, SHARER_NAME_MAX_LENGTH)
}

/**
 * Snapshots the user's current persona/copy into a permanent row so the public
 * link keeps showing exactly what was true at share time, even if the account's
 * live profile later changes or resets below the unlock threshold.
 */
export async function createProfileShare(
  userId: string,
  sharerName?: string | null
): Promise<PublicProfileShare | null> {
  const profileState = (await getMusicProfileState(userId)) as FullProfileData
  if (!profileState.unlocked || !profileState.profile) {
    return null
  }

  const dominantGenres = getDominantGenres(profileState)
  const sonicPersona = resolveSonicPersona(profileState, dominantGenres)
  const personaName = resolvePersonaDisplayName(sonicPersona)
  const shareCopy = resolvePersonaShareCopy({
    persona: sonicPersona,
    profileState,
    dominantGenres,
    userId,
  })

  assertDatabaseConfigured()
  const created = await prisma.profileShare.create({
    data: {
      userId,
      sharerName: sanitizeSharerName(sharerName),
      personaName,
      personaCodename: sonicPersona.codename,
      personaAssetFile: sonicPersona.assetFile,
      headline: shareCopy.headline,
      description: shareCopy.description,
      completedBattlesCount: profileState.completedBattlesCount,
      generatedFromVotes: profileState.profile.generatedFromVotes,
      dominantGenres,
    },
  })

  return mapRecordToPublicShare(created)
}

export async function getPublicProfileShare(token: string): Promise<PublicProfileShare | null> {
  assertDatabaseConfigured()
  const record = await prisma.profileShare.findUnique({ where: { id: token } })
  if (!record) {
    return null
  }

  return mapRecordToPublicShare(record)
}

export function buildProfileShareUrl(origin: string, token: string): string {
  return new URL(`/profile/share/${token}`, origin).toString()
}

export function buildProfileShareImageUrl(origin: string, token: string): string {
  return new URL(`/api/profile/share/${token}/image`, origin).toString()
}
