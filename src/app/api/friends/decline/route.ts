import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

// POST /api/friends/decline — body: { requesterId }
export async function POST(req: NextRequest) {
  const me = await getCurrentUser()
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { requesterId } = await req.json()
  if (typeof requesterId !== "string") {
    return NextResponse.json({ error: "requesterId required" }, { status: 400 })
  }
  await db.friendship.deleteMany({
    where: { requesterId, receiverId: me.id, status: "PENDING" },
  })
  return NextResponse.json({ ok: true })
}
