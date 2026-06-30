const DEFAULT_LIMIT = 5
const DEFAULT_WINDOW_MS = 60_000
const MAX_ENTRIES = 10_000

interface RateLimitEntry {
  count: number
  resetAt: number
}

interface RateLimitOptions {
  limit?: number
  windowMs?: number
}

export interface RateLimitResult {
  allowed: boolean
  retryAfterSeconds: number
  limit: number
  remaining: number
  resetAt: number
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

function pruneExpiredEntries(now: number): void {
  if (entries.size < MAX_ENTRIES) {
    return
  }

  for (const [key, entry] of entries.entries()) {
    if (entry.resetAt <= now) {
      entries.delete(key)
    }
  }
}

export function applyRateLimitHeaders(response: Response, rateLimit: RateLimitResult): Response {
  response.headers.set("X-RateLimit-Limit", String(rateLimit.limit))
  response.headers.set("X-RateLimit-Remaining", String(rateLimit.remaining))
  response.headers.set("X-RateLimit-Reset", String(Math.ceil(rateLimit.resetAt / 1000)))

  if (!rateLimit.allowed) {
    response.headers.set("Retry-After", String(rateLimit.retryAfterSeconds))
  }

  return response
}

export function consumeRateLimit(
  request: Request,
  scope: string,
  options: RateLimitOptions = {}
): RateLimitResult {
  const now = Date.now()
  pruneExpiredEntries(now)

  const limit = options.limit ?? DEFAULT_LIMIT
  const windowMs = options.windowMs ?? DEFAULT_WINDOW_MS
  const key = `${scope}:${getClientIdentifier(request)}`
  const current = entries.get(key)

  if (!current || current.resetAt <= now) {
    const resetAt = now + windowMs
    entries.set(key, {
      count: 1,
      resetAt,
    })

    return {
      allowed: true,
      retryAfterSeconds: 0,
      limit,
      remaining: Math.max(0, limit - 1),
      resetAt,
    }
  }

  if (current.count >= limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((current.resetAt - now) / 1000),
      limit,
      remaining: 0,
      resetAt: current.resetAt,
    }
  }

  current.count += 1
  entries.set(key, current)

  return {
    allowed: true,
    retryAfterSeconds: 0,
    limit,
    remaining: Math.max(0, limit - current.count),
    resetAt: current.resetAt,
  }
}
