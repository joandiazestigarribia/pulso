import { randomBytes, scrypt as nodeScrypt, timingSafeEqual } from "node:crypto"
import { promisify } from "node:util"

const scrypt = promisify(nodeScrypt)

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex")
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer
  return `${salt}:${derivedKey.toString("hex")}`
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [salt, hash] = storedHash.split(":")
  if (!salt || !hash) {
    return false
  }

  const derivedKey = (await scrypt(password, salt, 64)) as Buffer
  const storedHashBuffer = Buffer.from(hash, "hex")

  if (derivedKey.length !== storedHashBuffer.length) {
    return false
  }

  return timingSafeEqual(derivedKey, storedHashBuffer)
}
