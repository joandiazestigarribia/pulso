import { existsSync, mkdirSync, copyFileSync } from "node:fs"
import { spawnSync } from "node:child_process"

const testDatabaseUrl = process.env.TEST_DATABASE_URL?.trim()

if (!testDatabaseUrl) {
  console.error("TEST_DATABASE_URL is required. Tests delete data and must run against an isolated test database.")
  process.exit(1)
}

const testEnv = {
  ...process.env,
  NODE_ENV: "test",
  PULSO_TEST_MODE: "1",
}

function run(command, args) {
  const result = spawnSync(command, args, {
    env: testEnv,
    stdio: "inherit",
    shell: process.platform === "win32",
  })

  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

run("npx", ["tsc", "-p", "tsconfig.test-build.json"])

const files = [
  "constants",
  "elo",
  "mock-data",
  "catalog-providers",
  "battle-store",
  "db",
  "identity",
  "request-identity",
  "jwt-auth",
  "auth",
  "admin-auth",
  "auth-rate-limit",
  "catalog-curation",
  "catalog-policy",
  "conversion-events",
  "deezer-playlists",
  "genre-normalization",
  "music-profile",
  "music-dna-config",
]

mkdirSync(".tmp-test/node_modules/@/lib", { recursive: true })

for (const file of files) {
  const fromLib = `.tmp-test/lib/${file}.js`
  const fromRoot = `.tmp-test/${file}.js`
  const from = existsSync(fromLib) ? fromLib : fromRoot
  copyFileSync(from, `.tmp-test/node_modules/@/lib/${file}.js`)
}

run("node", ["--test", "--test-concurrency=1", "tests/**/*.test.js"])
