import { z } from "zod"

export const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/

export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email("El formato del correo no es valido."),
  password: z
    .string()
    .min(8, "La clave debe tener al menos 8 caracteres.")
    .max(100, "La clave debe tener como maximo 100 caracteres.")
    .regex(
      strongPasswordRegex,
      "La clave debe incluir mayuscula, minuscula, numero y caracter especial (@$!%*?&)."
    ),
})

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("El formato del correo no es valido."),
  password: z.string().min(1, "La clave es obligatoria."),
})

export function evaluatePasswordRules(password: string): {
  minLength: boolean
  maxLength: boolean
  uppercase: boolean
  lowercase: boolean
  number: boolean
  special: boolean
} {
  return {
    minLength: password.length >= 8,
    maxLength: password.length <= 100,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[@$!%*?&]/.test(password),
  }
}
