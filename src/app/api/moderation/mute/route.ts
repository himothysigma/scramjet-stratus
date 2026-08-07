import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentUser, canModerate, isOwner } from "@/lib/auth"

// POST /api/moderation/mute — owner/admin/mod mutes a user
// body: { userId, durationMin? } (undefined = indefinite)
export async function POST(req: NextRequest) {
  const me = await getCurrentUser()
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!canModerate(me.role)) {
    return NextResponse.json({ error: "You can't mute users" }, { status: 403 })
  }

  const { userId, durationMin } = await req.json()
  if (typeof userId !== "string") {
    return NextResponse.json({ error: "userId required" }, { status: 400 })
  }
  const target = await db.user.findUnique({ where: { id: userId } })
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 })

  // Can't mute someone of equal or higher role
  const rank = (r: string) => r === "OWNER" ? 4 : r === "ADMIN" ? 3 : r === "MOD" ? 2 : 1
  if (rank(target.role) >= rank(me.role)) {
    return NextResponse.json({ error: "Can't mute a user of equal or higher role" }, { status: 403 })
  }

  const mutedUntil =
    typeof durationMin === "number" && durationMin > 0
      ? new Date(Date.now() + durationMin * 60 * 1000)
      : null

  await db.user.update({
    where: { id: userId },
    data: { muted: true, mutedUntil },
  })
  return NextResponse.json({ ok: true, muted: true, mutedUntil })
}
