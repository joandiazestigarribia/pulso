const DEFAULT_LIMIT = 5
const DEFAULT_WINDOW_MS = 60_000

interface RateLimitEntry {
  count: number
  resetAt: number
}

interface RateLimitResult {
  allowed: boolean
  retryAfterSeconds: number
}

const entries = new Map<string, RateLimitEntry>()

function getClientIdentifier(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for")
  if (forwardedFor) {
    const firstIp = forwardedFor.split(",")[0]?.trim()
    if (firstIp) {
      return firstIp
    }
  }

  const realIp = request.headers.get("x-real-ip")
  if (realIp) {
    return realIp
  }

  return "unknown"
}

export function consumeRateLimit(request: Request, scope: string): RateLimitResult {
  const now = Date.now()
  const key = `${scope}:${getClientIdentifier(request)}`
  const current = entries.get(key)

  if (!current || current.resetAt <= now) {
    entries.set(key, {
      count: 1,
      resetAt: now + DEFAULT_WINDOW_MS,
    })

    return { allowed: true, retryAfterSeconds: 0 }
  }

  if (current.count >= DEFAULT_LIMIT) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((current.resetAt - now) / 1000),
    }
  }

  current.count += 1
  entries.set(key, current)

  return { allowed: true, retryAfterSeconds: 0 }
}
