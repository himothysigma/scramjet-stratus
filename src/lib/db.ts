import { PrismaClient } from '@prisma/client'

const isDev = process.env.NODE_ENV !== 'production'
const dbUrl = process.env.DATABASE_URL || 'file:./db/custom.db'
const isTurso = dbUrl.startsWith('libsql://') || dbUrl.startsWith('https://')

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  if (isTurso) {
    // Turso — lazy load adapter so local SQLite never pulls in libsql
    // Using eval to bypass TypeScript ESM restrictions
    const adapterModule = eval('require')('@prisma/adapter-libsql')
    // @prisma/adapter-libsql v7 takes a libsql *Config* ({ url, authToken }),
    // NOT a pre-built libsql Client. Passing a Client leaves url undefined and
    // every query fails with "URL_INVALID: The URL 'undefined' is not in a valid format".
    const adapter = new adapterModule.PrismaLibSql({
      url: dbUrl,
      authToken: process.env.DATABASE_AUTH_TOKEN,
    })
    return new PrismaClient({ adapter, log: isDev ? ['warn', 'error'] : ['error'] })
  }
  // Local SQLite — no adapter needed, just standard Prisma
  return new PrismaClient({ log: isDev ? ['warn', 'error'] : ['error'] })
}

export const db =
  globalForPrisma.prisma ??
  createPrismaClient()

if (isDev) globalForPrisma.prisma = db
