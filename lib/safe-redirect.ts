export function getSafeNextPath(rawPath: string | null | undefined, fallback = "/battle"): string {
  if (!rawPath) {
    return fallback
  }

  if (!rawPath.startsWith("/") || rawPath.startsWith("//")) {
    return fallback
  }

  if (rawPath.startsWith("/api/auth")) {
    return fallback
  }

  return rawPath
}

