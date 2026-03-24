const SENSITIVE_KEYS = new Set([
  "password",
  "token",
  "access_token",
  "refresh_token",
  "authorization",
  "api_key",
])

function redactValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(redactValue)
  }

  if (!value || typeof value !== "object") {
    return value
  }

  const entries = Object.entries(value as Record<string, unknown>).map(([key, nestedValue]) => {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      return [key, "[REDACTED]"]
    }

    return [key, redactValue(nestedValue)]
  })

  return Object.fromEntries(entries)
}

export function sanitizeLogData<T>(data: T): T {
  return redactValue(data) as T
}
