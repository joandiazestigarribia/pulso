import "next-auth"
import "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id: string | null
      name?: string | null
      email?: string | null
      image?: string | null
    }
    spotifyAccessToken: string | null
    spotifyTokenError: string | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    appUserId?: string
    spotifyAccessToken?: string
    spotifyRefreshToken?: string
    spotifyAccessTokenExpiresAt?: number
    spotifyTokenError?: string | null
  }
}

