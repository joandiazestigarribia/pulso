import { getAuthTokenFromRequest, verifyAuthToken } from "@/lib/jwt-auth"
import { ANON_SESSION_COOKIE, getCookieFromRequest } from "@/lib/identity"

type RequestLike = Request | { headers: Headers }

export function resolveRequestIdentity(request: RequestLike): {
  userId: string | null
  anonymousId: string | null
} {
  if (request instanceof Request) {
    const token = getAuthTokenFromRequest(request)
    if (token) {
      try {
        const payload = verifyAuthToken(token)
        return { userId: payload.sub, anonymousId: null }
      } catch {
        return { userId: null, anonymousId: null }
      }
    }
  }

  const anonymousId = getCookieFromRequest(request, ANON_SESSION_COOKIE)
  if (anonymousId) {
    return { userId: null, anonymousId }
  }

  return { userId: null, anonymousId: null }
}
