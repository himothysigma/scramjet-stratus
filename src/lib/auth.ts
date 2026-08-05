import { cookies } from "next/headers"
import { randomBytes, scryptSync, timingSafeEqual } from "crypto"
import { db } from "@/lib/db"
import { SESSION_COOKIE, SESSION_MAX_AGE_MS } from "@/lib/constants"

// ---------- password hashing (built-in crypto, no extra deps) ----------
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex")
  const hash = scryptSync(password, salt, 64).toString("hex")
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":")
  if (!salt || !hash) return false
  const hashBuf = Buffer.from(hash, "hex")
  const testBuf = scryptSync(password, salt, 64)
  if (hashBuf.length !== testBuf.length) return false
  return timingSafeEqual(hashBuf, testBuf)
}

// ---------- random token ----------
export function newToken(): string {
  return randomBytes(32).toString("hex")
}

// ---------- session creation (sets cookie) ----------
export async function createSession(userId: string): Promise<string> {
  const token = newToken()
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_MS)
  await db.session.create({ data: { token, userId, expiresAt } })
  const store = await cookies()
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  })
  return token
}

export async function destroySession(): Promise<void> {
  const store = await cookies()
  const token = store.get(SESSION_COOKIE)?.value
  if (token) {
    await db.session.deleteMany({ where: { token } }).catch(() => {})
  }
  store.delete(SESSION_COOKIE)
}

// ---------- get current user from cookie ----------
export async function getCurrentUser() {
  const store = await cookies()
  const token = store.get(SESSION_COOKIE)?.value
  if (!token) return null

  const session = await db.session.findUnique({
    where: { token },
    include: { user: true },
  })
  if (!session) return null
  if (session.expiresAt.getTime() < Date.now()) {
    await db.session.delete({ where: { id: session.id } }).catch(() => {})
    return null
  }
  return session.user
}

export type SafeUser = {
  id: string
  username: string
  displayName: string
  bio: string
  pfpUrl: string | null
  bannerUrl: string | null
  isOwner: boolean
}

export function toSafeUser(u: {
  id: string
  username: string
  displayName: string
  bio: string
  pfpUrl: string | null
  bannerUrl: string | null
  isOwner: boolean
}): SafeUser {
  return {
    id: u.id,
    username: u.username,
    displayName: u.displayName,
    bio: u.bio,
    pfpUrl: u.pfpUrl,
    bannerUrl: u.bannerUrl,
    isOwner: u.isOwner,
  }
}
