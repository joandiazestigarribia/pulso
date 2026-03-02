import { prisma } from "@/lib/db"

const POLICY_CACHE_TTL_MS = 1000 * 60

let artistDenylistCache: { values: Set<string>; expiresAt: number } | null = null
let hasCatalogRuleTable: boolean | null = null

export function normalizePolicyValue(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function extractArtistTokens(artist: string): string[] {
  return artist
    .split(/[,&/]| feat\.?| ft\.?/gi)
    .map((token) => normalizePolicyValue(token))
    .filter((token) => token.length > 0)
}

export function isArtistBlocked(artist: string, denylist: Set<string>): boolean {
  if (denylist.size === 0) {
    return false
  }

  const normalizedArtist = normalizePolicyValue(artist)
  if (normalizedArtist.length > 0 && denylist.has(normalizedArtist)) {
    return true
  }

  const tokens = extractArtistTokens(artist)
  return tokens.some((token) => denylist.has(token))
}

export async function getActiveArtistDenylist(forceRefresh = false): Promise<Set<string>> {
  if (!forceRefresh && artistDenylistCache && artistDenylistCache.expiresAt > Date.now()) {
    return artistDenylistCache.values
  }

  if (hasCatalogRuleTable === false) {
    return new Set<string>()
  }

  type RuleRow = { pattern: string }
  let rules: RuleRow[] = []

  try {
    rules = await prisma.$queryRaw<RuleRow[]>`
      SELECT "pattern"
      FROM "CatalogCurationRule"
      WHERE "type" = 'ARTIST' AND "isActive" = true
    `
    hasCatalogRuleTable = true
  } catch {
    rules = []
    hasCatalogRuleTable = false
  }

  const values = new Set(rules.map((rule) => normalizePolicyValue(rule.pattern)).filter((value) => value.length > 0))
  artistDenylistCache = {
    values,
    expiresAt: Date.now() + POLICY_CACHE_TTL_MS,
  }

  return values
}
