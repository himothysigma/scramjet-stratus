import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentUser, canModerate } from "@/lib/auth"

// POST /api/moderation/unmute
export async function POST(req: NextRequest) {
  const me = await getCurrentUser()
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!canModerate(me.role)) {
    return NextResponse.json({ error: "You can't unmute users" }, { status: 403 })
  }
  const { userId } = await req.json()
  if (typeof userId !== "string") {
    return NextResponse.json({ error: "userId required" }, { status: 400 })
  }
  await db.user.update({
    where: { id: userId },
    data: { muted: false, mutedUntil: null },
  })
  return NextResponse.json({ ok: true })
}
