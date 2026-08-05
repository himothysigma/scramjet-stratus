import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { hashPassword, createSession, toSafeUser } from "@/lib/auth"
import { OWNER_PASSWORD } from "@/lib/constants"

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json()
    if (typeof username !== "string" || typeof password !== "string") {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 })
    }
    const u = username.trim()
    if (u.length < 2 || u.length > 24) {
      return NextResponse.json({ error: "Username must be 2-24 chars" }, { status: 400 })
    }
    if (password.length < 4) {
      return NextResponse.json({ error: "Password too short" }, { status: 400 })
    }
    const existing = await db.user.findUnique({ where: { username: u.toLowerCase() } })
    if (existing) {
      return NextResponse.json({ error: "Username already taken" }, { status: 409 })
    }

    // If the password equals the owner password, this account becomes the owner.
    const isOwner = password === OWNER_PASSWORD
    const user = await db.user.create({
      data: {
        username: u.toLowerCase(),
        displayName: u,
        passwordHash: hashPassword(password),
        isOwner,
      },
    })
    await createSession(user.id)
    return NextResponse.json({ user: toSafeUser(user) })
  } catch (e) {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
