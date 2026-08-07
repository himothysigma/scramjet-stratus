import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

const isDev = process.env.NODE_ENV !== 'production'
const dbUrl = process.env.DATABASE_URL || 'file:./db/custom.db'
const isTurso = dbUrl.startsWith('libsql://') || dbUrl.startsWith('https://')

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  if (isTurso) {
    // Turso (libSQL) — cloud SQLite for production persistence
    const libsql = createClient({
      url: dbUrl,
      authToken: process.env.DATABASE_AUTH_TOKEN,
    })
    const adapter = new PrismaLibSQL(libsql)
    return new PrismaClient({ adapter, log: isDev ? ['warn', 'error'] : ['error'] })
  }
  // Local SQLite (sandbox/dev)
  return new PrismaClient({ log: isDev ? ['warn', 'error'] : ['error'] })
}

export const db =
  globalForPrisma.prisma ??
  createPrismaClient()

if (isDev) globalForPrisma.prisma = db
