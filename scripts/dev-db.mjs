/**
 * RecipeBox — local PostgreSQL for development.
 *
 * Starts a real PostgreSQL 17 server (via `embedded-postgres`) using a data
 * directory inside the project (`.pgdata`, git-ignored), so the app can be run
 * on machines without Docker or a system Postgres (e.g. WSL without the Docker
 * Desktop integration). Data persists across restarts.
 *
 * Usage:  npm run db:start        (foreground; Ctrl-C stops the server)
 *
 * Prefer a managed/real PostgreSQL in production: set DATABASE_URL accordingly
 * and run `npm run db:migrate`. See README.md.
 */
import EmbeddedPostgres from 'embedded-postgres'
import { existsSync, readdirSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(fileURLToPath(new URL('.', import.meta.url)), '..')
const DATA_DIR = path.join(root, '.pgdata')
const PORT = Number(process.env.PGPORT ?? 5432)
const USER = process.env.PGUSER ?? 'postgres'
const PASSWORD = process.env.PGPASSWORD ?? 'postgres'
const DATABASE = process.env.PGDATABASE ?? 'recipebox'

/**
 * npm (>=12) blocks dependency install scripts by default, which leaves the
 * `@embedded-postgres/*` platform package without the symlinked shared
 * libraries Postgres needs. Re-hydrate them here (idempotent) so starting the
 * server never depends on that postinstall having run.
 */
function ensureNativeSymlinks() {
  const scoped = path.join(root, 'node_modules', '@embedded-postgres')
  if (!existsSync(scoped)) return
  for (const entry of readdirSync(scoped)) {
    const pkgDir = path.join(scoped, entry)
    const script = path.join(pkgDir, 'scripts', 'hydrate-symlinks.js')
    if (existsSync(script)) {
      spawnSync(process.execPath, [script], { cwd: pkgDir, stdio: 'ignore' })
    }
  }
}

ensureNativeSymlinks()

const pg = new EmbeddedPostgres({
  databaseDir: DATA_DIR,
  port: PORT,
  user: USER,
  password: PASSWORD,
  authMethod: 'scram-sha-256',
  persistent: true,
})

const initialised = existsSync(path.join(DATA_DIR, 'PG_VERSION'))

if (!initialised) {
  console.log(`[recipebox] initialising Postgres data dir at ${DATA_DIR}`)
  await pg.initialise()
}

await pg.start()

try {
  await pg.createDatabase(DATABASE)
  console.log(`[recipebox] created database "${DATABASE}"`)
} catch {
  // Already exists — fine.
}

console.log(
  `[recipebox] PostgreSQL ready on postgresql://${USER}:***@localhost:${PORT}/${DATABASE}`,
)
console.log('[recipebox] press Ctrl-C to stop')

async function shutdown() {
  console.log('\n[recipebox] stopping PostgreSQL…')
  await pg.stop()
  process.exit(0)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
