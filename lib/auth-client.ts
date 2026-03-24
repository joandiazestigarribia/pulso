"use client"

import { z } from "zod"

const AUTH_USER_STORAGE_KEY = "pulso_auth_user"
const SESSION_EXEMPT_PATHS = new Set([
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/me",
  "/api/auth/logout",
])

const authUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  role: z.enum(["USER", "ADMIN"]),
  profile_completed: z.boolean(),
})

const authResponseSchema = z.object({
  ok: z.boolean(),
  user: authUserSchema.optional(),
  code: z.string().optional(),
  message: z.string().optional(),
  errors: z.record(z.array(z.string())).optional(),
})

export type AuthUser = z.infer<typeof authUserSchema>

function getApiBaseUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL
  if (!baseUrl) {
    return ""
  }

  return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl
}

function buildUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path
  }

  return `${getApiBaseUrl()}${path}`
}

function getPathname(url: string): string {
  if (url.startsWith("/")) {
    return url
  }

  try {
    return new URL(url).pathname
  } catch {
    return url
  }
}

export function saveAuthUser(user: AuthUser): void {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(user))
  window.dispatchEvent(new CustomEvent("pulso:auth-user-updated"))
}

export function clearAuthUser(): void {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.removeItem(AUTH_USER_STORAGE_KEY)
  window.dispatchEvent(new CustomEvent("pulso:auth-user-updated"))
}

export function readAuthUserFromStorage(): AuthUser | null {
  if (typeof window === "undefined") {
    return null
  }

  const rawUser = window.localStorage.getItem(AUTH_USER_STORAGE_KEY)
  if (!rawUser) {
    return null
  }

  try {
    const parsed = authUserSchema.safeParse(JSON.parse(rawUser))
    if (!parsed.success) {
      clearAuthUser()
      return null
    }

    return parsed.data
  } catch {
    clearAuthUser()
    return null
  }
}

async function maybeHandleUnauthorized(pathname: string, status: number): Promise<void> {
  if (status !== 401 || SESSION_EXEMPT_PATHS.has(pathname)) {
    return
  }

  clearAuthUser()
  try {
    await fetch(buildUrl("/api/auth/logout"), {
      method: "POST",
      credentials: "include",
    })
  } catch {
    // Ignore logout network errors after session expiration.
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("pulso:session-expired"))
  }
}

async function requestAuth(path: string, init: RequestInit = {}): Promise<z.infer<typeof authResponseSchema>> {
  const response = await fetch(buildUrl(path), {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  })

  const pathname = getPathname(path)
  await maybeHandleUnauthorized(pathname, response.status)

  const rawPayload = (await response.json().catch(() => null)) as unknown
  const payload = authResponseSchema.safeParse(rawPayload)

  if (!payload.success) {
    return {
      ok: false,
      code: "INVALID_RESPONSE",
      message: "Respuesta invalida del servidor de autenticacion.",
    }
  }

  if (!response.ok) {
    return {
      ok: false,
      code: payload.data.code ?? "REQUEST_FAILED",
      message: payload.data.message ?? "La solicitud de autenticacion fallo.",
    }
  }

  return payload.data
}

export async function login(credentials: { email: string; password: string }) {
  const payload = await requestAuth("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  })

  if (payload.ok && payload.user) {
    saveAuthUser(payload.user)
  }

  return payload
}

export async function register(data: { email: string; password: string }) {
  const payload = await requestAuth("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  })

  if (payload.ok && payload.user) {
    saveAuthUser(payload.user)
  }

  return payload
}

export async function logout() {
  const payload = await requestAuth("/api/auth/logout", {
    method: "POST",
  })

  clearAuthUser()
  return payload
}

export async function getMe() {
  const payload = await requestAuth("/api/auth/me", {
    method: "GET",
  })

  if (payload.ok && payload.user) {
    saveAuthUser(payload.user)
  } else {
    clearAuthUser()
  }

  return payload
}

export function installAuthUnauthorizedInterceptor(): () => void {
  if (typeof window === "undefined") {
    return () => undefined
  }

  const originalFetch = window.fetch.bind(window)

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const response = await originalFetch(input, init)

    try {
      const requestUrl = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url
      const pathname = getPathname(requestUrl)
      await maybeHandleUnauthorized(pathname, response.status)
    } catch {
      // Ignore interceptor runtime errors to avoid blocking normal requests.
    }

    return response
  }

  return () => {
    window.fetch = originalFetch
  }
}
