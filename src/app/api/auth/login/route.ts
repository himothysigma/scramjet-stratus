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
    await createSession(user.id)
    return NextResponse.json({ user: toSafeUser(user) })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    const stack = e instanceof Error ? e.stack : ""
    console.error("[login] Error:", msg, stack)
    return NextResponse.json({ error: msg, stack: stack?.slice(0, 500) }, { status: 500 })
  }
}
