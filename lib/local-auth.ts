import { randomUUID } from "node:crypto"
import type { User, UserRole } from "@prisma/client"
import { prisma } from "@/lib/db"
import { loginSchema, registerSchema } from "@/lib/auth-validation"
import { hashPassword, verifyPassword } from "@/lib/password"
import { z } from "zod"

export class AuthError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string
  ) {
    super(message)
  }
}

export interface AuthenticatedUser {
  id: string
  email: string
  role: UserRole
  profileCompleted: boolean
}

function toAuthenticatedUser(user: User): AuthenticatedUser {
  if (!user.email) {
    throw new AuthError(500, "AUTH_DATA_ERROR", "El correo del usuario no está configurado.")
  }

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    profileCompleted: user.profileCompleted,
  }
}

export async function registerLocalUser(input: z.infer<typeof registerSchema>): Promise<AuthenticatedUser> {
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
  })

  if (existing) {
    throw new AuthError(409, "EMAIL_ALREADY_EXISTS", "El correo ya está registrado.")
  }

  const passwordHash = await hashPassword(input.password)

  const user = await prisma.user.create({
    data: {
      id: randomUUID(),
      email: input.email,
      passwordHash,
      role: "USER",
      profileCompleted: false,
    },
  })

  return toAuthenticatedUser(user)
}

export async function loginLocalUser(input: z.infer<typeof loginSchema>): Promise<AuthenticatedUser> {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  })

  if (!user?.passwordHash) {
    throw new AuthError(401, "INVALID_CREDENTIALS", "Correo o clave inválidos.")
  }

  const isValidPassword = await verifyPassword(input.password, user.passwordHash)

  if (!isValidPassword) {
    throw new AuthError(401, "INVALID_CREDENTIALS", "Correo o clave inválidos.")
  }

  return toAuthenticatedUser(user)
}

export async function getLocalUserById(userId: string): Promise<AuthenticatedUser | null> {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user || !user.email) {
    return null
  }

  return toAuthenticatedUser(user)
}
