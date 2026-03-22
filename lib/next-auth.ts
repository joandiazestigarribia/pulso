import type { NextAuthOptions } from "next-auth"

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  providers: [],
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
}
