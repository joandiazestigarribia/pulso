import type { UserRole } from "@prisma/client"

export interface SanitizedAuthUser {
  id: string
  email: string
  role: UserRole
  profile_completed: boolean
}

export function sanitizeAuthUser(user: {
  id: string
  email: string
  role: UserRole
  profileCompleted: boolean
}): SanitizedAuthUser {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    profile_completed: user.profileCompleted,
  }
}
