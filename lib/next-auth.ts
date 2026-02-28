import type { NextAuthOptions } from "next-auth"
import SpotifyProvider from "next-auth/providers/spotify"

type RefreshResult = {
  accessToken: string
  expiresAt: number
  refreshToken?: string
}

function buildPulsoUserId(providerAccountId: string): string {
  const safeId = providerAccountId.replace(/[^a-zA-Z0-9_-]/g, "_")
  return `spotify_${safeId}`
}

async function refreshSpotifyAccessToken(token: Record<string, unknown>): Promise<RefreshResult | null> {
  const refreshToken = typeof token.spotifyRefreshToken === "string" ? token.spotifyRefreshToken : null
  const clientId = process.env.SPOTIFY_CLIENT_ID
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET

  if (!refreshToken || !clientId || !clientSecret) {
    return null
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64")

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  })

  if (!response.ok) {
    return null
  }

  const payload = (await response.json()) as {
    access_token: string
    expires_in: number
    refresh_token?: string
  }

  return {
    accessToken: payload.access_token,
    expiresAt: Date.now() + payload.expires_in * 1000,
    refreshToken: payload.refresh_token,
  }
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  providers: [
    SpotifyProvider({
      clientId: process.env.SPOTIFY_CLIENT_ID ?? "",
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET ?? "",
      authorization: {
        params: {
          scope: "user-read-email user-read-private",
        },
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  logger: {
    error(code, ...message) {
      console.error("[next-auth][error]", code, ...message)
    },
    warn(code, ...message) {
      console.warn("[next-auth][warn]", code, ...message)
    },
    debug(code, ...message) {
      if (process.env.NODE_ENV !== "production") {
        console.debug("[next-auth][debug]", code, ...message)
      }
    },
  },
  callbacks: {
    async jwt({ token, account }) {
      if (account?.provider === "spotify") {
        token.spotifyAccessToken = account.access_token
        token.spotifyRefreshToken = account.refresh_token
        token.spotifyAccessTokenExpiresAt = account.expires_at
          ? account.expires_at * 1000
          : Date.now() + 3600 * 1000
        token.spotifyTokenError = null
        token.appUserId = buildPulsoUserId(account.providerAccountId)
      }

      const expiresAt =
        typeof token.spotifyAccessTokenExpiresAt === "number" ? token.spotifyAccessTokenExpiresAt : 0

      if (Date.now() < expiresAt - 60_000) {
        return token
      }

      const refreshed = await refreshSpotifyAccessToken(token)
      if (!refreshed) {
        token.spotifyTokenError = "refresh_failed"
        return token
      }

      token.spotifyAccessToken = refreshed.accessToken
      token.spotifyAccessTokenExpiresAt = refreshed.expiresAt
      if (refreshed.refreshToken) {
        token.spotifyRefreshToken = refreshed.refreshToken
      }
      token.spotifyTokenError = null

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = typeof token.appUserId === "string" ? token.appUserId : null
      }

      session.spotifyAccessToken =
        typeof token.spotifyAccessToken === "string" ? token.spotifyAccessToken : null
      session.spotifyTokenError =
        typeof token.spotifyTokenError === "string" ? token.spotifyTokenError : null

      return session
    },
  },
}
