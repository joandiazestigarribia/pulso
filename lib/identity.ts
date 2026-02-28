export const AUTH_USER_COOKIE = "pulso_user_id"
export const ANON_SESSION_COOKIE = "pulso_anon_id"
const ANON_PREFIX = "anon_"

type RequestLike = Request | { headers: Headers }
type CookieRequestLike = { headers: Headers; url?: string }

function parseCookies(rawCookieHeader: string | null): Map<string, string> {
  const cookieMap = new Map<string, string>()

  if (!rawCookieHeader) {
    return cookieMap
  }

  const pairs = rawCookieHeader.split(";")
  for (const pair of pairs) {
    const [rawKey, ...rawValueParts] = pair.trim().split("=")
    if (!rawKey) {
      continue
    }

    const rawValue = rawValueParts.join("=")
    cookieMap.set(rawKey, decodeURIComponent(rawValue))
  }

  return cookieMap
}

export function getCookieFromRequest(request: RequestLike, cookieName: string): string | null {
  const cookieHeader = request.headers.get("cookie")
  const cookieMap = parseCookies(cookieHeader)
  return cookieMap.get(cookieName) ?? null
}

export function buildAnonSessionId(): string {
  const uuid =
    typeof globalThis.crypto !== "undefined" && typeof globalThis.crypto.randomUUID === "function"
      ? globalThis.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`

  return `${ANON_PREFIX}${uuid}`
}

export function isAnonymousSessionId(value: string | null | undefined): value is string {
  return typeof value === "string" && value.startsWith(ANON_PREFIX)
}

export function resolveRequestIdentity(request: RequestLike): {
  userId: string | null
  anonymousId: string | null
} {
  const userId = getCookieFromRequest(request, AUTH_USER_COOKIE)
  if (userId) {
    return { userId, anonymousId: null }
  }

  const anonymousId = getCookieFromRequest(request, ANON_SESSION_COOKIE)
  if (anonymousId) {
    return { userId: null, anonymousId }
  }

  return { userId: null, anonymousId: null }
}

export function shouldUseSecureCookies(request: CookieRequestLike): boolean {
  if (process.env.NODE_ENV !== "production") {
    return false
  }

  const hostHeader = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? ""
  if (/^(localhost|127(?:\.\d{1,3}){3})(:\d+)?$/i.test(hostHeader)) {
    return false
  }

  const forwardedProto = request.headers.get("x-forwarded-proto")
  if (forwardedProto) {
    const firstProto = forwardedProto.split(",")[0]?.trim().toLowerCase()
    return firstProto === "https"
  }

  if (request.url) {
    if (/^https?:\/\/(localhost|127(?:\.\d{1,3}){3})(:\d+)?/i.test(request.url)) {
      return false
    }
    return request.url.startsWith("https://")
  }

  return true
}
