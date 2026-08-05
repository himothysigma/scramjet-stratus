import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { verifyPassword, createSession, toSafeUser } from "@/lib/auth"

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
    // No auto-owner on login. Owner only via Settings verify.
    await createSession(user.id)
    return NextResponse.json({ user: toSafeUser(user) })
  } catch (e) {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
