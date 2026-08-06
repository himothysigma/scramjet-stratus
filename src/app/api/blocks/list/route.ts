import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentUser, toSafeUser } from "@/lib/auth"

// GET /api/blocks/list — list users I've blocked
export async function GET() {
  const me = await getCurrentUser()
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const blocks = await db.block.findMany({
    where: { blockerId: me.id },
    include: { blocked: true },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json({ blocks: blocks.map((b) => toSafeUser(b.blocked)) })
}
