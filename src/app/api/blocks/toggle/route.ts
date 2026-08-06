import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

// POST /api/blocks/toggle — block or unblock a user
// body: { userId }
export async function POST(req: NextRequest) {
  const me = await getCurrentUser()
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { userId } = await req.json()
  if (typeof userId !== "string") return NextResponse.json({ error: "userId required" }, { status: 400 })
  if (userId === me.id) return NextResponse.json({ error: "Can't block yourself" }, { status: 400 })

  const existing = await db.block.findUnique({
    where: { blockerId_blockedId: { blockerId: me.id, blockedId: userId } },
  })

  if (existing) {
    await db.block.delete({ where: { id: existing.id } })
    return NextResponse.json({ ok: true, blocked: false })
  }

  await db.block.create({ data: { blockerId: me.id, blockedId: userId } })
  return NextResponse.json({ ok: true, blocked: true })
}
