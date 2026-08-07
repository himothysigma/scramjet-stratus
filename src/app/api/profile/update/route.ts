import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentUser, toSafeUser, isOwner } from "@/lib/auth"

// PATCH /api/profile/update — update display name + bio + username (owner: 1-char username)
export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { displayName, bio, username } = await req.json()

  const data: { displayName?: string; bio?: string; username?: string } = {}
  if (typeof displayName === "string") {
    const d = displayName.trim()
    if (d.length < 1 || d.length > 32) {
      return NextResponse.json({ error: "Display name must be 1-32 chars" }, { status: 400 })
    }
    data.displayName = d
  }
  if (typeof bio === "string") {
    if (bio.length > 200) {
      return NextResponse.json({ error: "Bio too long (200 max)" }, { status: 400 })
    }
    data.bio = bio
  }
  if (typeof username === "string") {
    const u = username.trim().toLowerCase()
    const minLen = isOwner(user.role) ? 1 : 2
    if (u.length < minLen || u.length > 24) {
      return NextResponse.json({ error: `Username must be ${minLen}-24 chars` }, { status: 400 })
    }
    // Check if taken by someone else
    const existing = await db.user.findUnique({ where: { username: u } })
    if (existing && existing.id !== user.id) {
      return NextResponse.json({ error: "Username already taken" }, { status: 409 })
    }
    data.username = u
  }

  const updated = await db.user.update({ where: { id: user.id }, data })
  return NextResponse.json({ user: toSafeUser(updated) })
}
