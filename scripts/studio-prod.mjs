import { existsSync, readFileSync } from "node:fs"
import { spawn } from "node:child_process"
import { join } from "node:path"

const envPath = join(process.cwd(), ".env.production.local")

if (!existsSync(envPath)) {
  console.error(`No se encontro ${envPath}. Crealo con la variable DATABASE_URL de produccion (Neon).`)
  process.exit(1)
}

const env = { ...process.env }

for (const line of readFileSync(envPath, "utf-8").split("\n")) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith("#")) continue

  const separatorIndex = trimmed.indexOf("=")
  if (separatorIndex === -1) continue

  const key = trimmed.slice(0, separatorIndex).trim()
  const value = trimmed
    .slice(separatorIndex + 1)
    .trim()
    .replace(/^["']|["']$/g, "")

  env[key] = value
}

if (!env.DATABASE_URL) {
  console.error("DATABASE_URL no esta definida en .env.production.local")
  process.exit(1)
}

console.log("Abriendo Prisma Studio contra la base de datos de PRODUCCION (Neon). Cuidado al editar/borrar filas.")

const child = spawn("npx", ["prisma", "studio"], {
  env,
  stdio: "inherit",
  shell: true,
})

child.on("exit", (code) => process.exit(code ?? 0))
