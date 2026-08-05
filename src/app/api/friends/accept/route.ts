import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

// POST /api/friends/accept — body: { requesterId }
export async function POST(req: NextRequest) {
  const me = await getCurrentUser()
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { requesterId } = await req.json()
  if (typeof requesterId !== "string") {
    return NextResponse.json({ error: "requesterId required" }, { status: 400 })
  }
  const fr = await db.friendship.findFirst({
    where: { requesterId, receiverId: me.id, status: "PENDING" },
  })
  if (!fr) return NextResponse.json({ error: "Request not found" }, { status: 404 })
  await db.friendship.update({ where: { id: fr.id }, data: { status: "ACCEPTED" } })
  return NextResponse.json({ ok: true })
}
