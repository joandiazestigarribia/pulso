import { createHmac, timingSafeEqual } from "node:crypto"
import type { FullProfileData } from "@/lib/music-dna"
import {
  getDominantGenres,
  resolvePersonaDisplayName,
  resolvePersonaShareCopy,
  resolveSonicPersona,
} from "@/lib/music-dna"
import { getMusicProfileState } from "@/lib/music-profile"

const SHARE_TOKEN_VERSION = "v1"
const DEFAULT_SHARE_SECRET = "pulso-local-share-secret"

interface ShareTokenPayload {
  version: typeof SHARE_TOKEN_VERSION
  userId: string
  createdAt: string
}

export interface PublicProfileShare {
  token: string
  userId: string
  personaName: string
  personaAssetFile: string
  headline: string
  description: string
  completedBattlesCount: number
  generatedFromVotes: number
  dominantGenres: string[]
  updatedAt: string | null
}

function getShareSecret(): string {
  const secret = process.env.PROFILE_SHARE_SECRET ?? process.env.NEXTAUTH_SECRET
  if (secret) {
    return secret
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("PROFILE_SHARE_SECRET or NEXTAUTH_SECRET is required to sign profile share links.")
  }

  return DEFAULT_SHARE_SECRET
}

function base64UrlEncode(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url")
}

function base64UrlDecode(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8")
}

function signPayload(encodedPayload: string): string {
  return createHmac("sha256", getShareSecret()).update(`${SHARE_TOKEN_VERSION}.${encodedPayload}`).digest("base64url").slice(0, 32)
}

function signLegacyPayload(encodedPayload: string): string {
  return createHmac("sha256", getShareSecret()).update(encodedPayload).digest("base64url")
}

function isSafeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)

  if (leftBuffer.length !== rightBuffer.length) {
    return false
  }

  return timingSafeEqual(leftBuffer, rightBuffer)
}

function parseShareToken(token: string): ShareTokenPayload | null {
  const [version, encodedPayload, signature] = token.split(".")
  if (version !== SHARE_TOKEN_VERSION || !encodedPayload || !signature) {
    return null
  }

  const expectedSignature = signPayload(encodedPayload)
  const expectedLegacySignature = signLegacyPayload(encodedPayload)
  if (!isSafeEqual(signature, expectedSignature) && !isSafeEqual(signature, expectedLegacySignature)) {
    return null
  }

  try {
    const decodedPayload = base64UrlDecode(encodedPayload)
    if (!decodedPayload.startsWith("{")) {
      if (decodedPayload.length === 0) {
        return null
      }

      return {
        version: SHARE_TOKEN_VERSION,
        userId: decodedPayload,
        createdAt: new Date(0).toISOString(),
      }
    }

    const payload = JSON.parse(decodedPayload) as Partial<ShareTokenPayload>
    if (payload.version !== SHARE_TOKEN_VERSION || typeof payload.userId !== "string" || payload.userId.length === 0) {
      return null
    }

    return {
      version: SHARE_TOKEN_VERSION,
      userId: payload.userId,
      createdAt: typeof payload.createdAt === "string" ? payload.createdAt : new Date(0).toISOString(),
    }
  } catch {
    return null
  }
}

export function createProfileShareToken(userId: string): string {
  const encodedPayload = base64UrlEncode(userId)
  const signature = signPayload(encodedPayload)

  return `${SHARE_TOKEN_VERSION}.${encodedPayload}.${signature}`
}

export function resolveUserIdFromShareToken(token: string): string | null {
  return parseShareToken(token)?.userId ?? null
}

export async function getPublicProfileShare(token: string): Promise<PublicProfileShare | null> {
  const userId = resolveUserIdFromShareToken(token)
  if (!userId) {
    return null
  }

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

  return {
    token,
    userId,
    personaName,
    personaAssetFile: sonicPersona.assetFile,
    headline: shareCopy.headline,
    description: shareCopy.description,
    completedBattlesCount: profileState.completedBattlesCount,
    generatedFromVotes: profileState.profile.generatedFromVotes,
    dominantGenres,
    updatedAt: profileState.profile.updatedAt,
  }
}

export function buildProfileShareUrl(origin: string, token: string): string {
  return new URL(`/profile/share/${token}`, origin).toString()
}

export function buildProfileShareImageUrl(origin: string, token: string): string {
  return new URL(`/api/profile/share/${token}/image`, origin).toString()
}
