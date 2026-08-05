import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { verifyPassword, createSession, toSafeUser } from "@/lib/auth"
import { OWNER_PASSWORD } from "@/lib/constants"

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json()
    if (typeof username !== "string" || typeof password !== "string") {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 })
    }
    const user = await db.user.findUnique({ where: { username: username.trim().toLowerCase() } })
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json({ error: "Wrong username or password" }, { status: 401 })
    }

    // Upgrade to owner if the login password is the owner password and not already owner.
    let updated = user
    if (!user.isOwner && password === OWNER_PASSWORD) {
      updated = await db.user.update({ where: { id: user.id }, data: { isOwner: true } })
    }
    await createSession(updated.id)
    return NextResponse.json({ user: toSafeUser(updated) })
  } catch (e) {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
