import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

// POST /api/channels/announcement — owner/admin creates an announcement channel
// body: { name }
export async function POST(req: NextRequest) {
  const me = await getCurrentUser()
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (me.role !== "OWNER" && me.role !== "ADMIN") {
    return NextResponse.json({ error: "Only admins can create announcement channels" }, { status: 403 })
  }
  const { name } = await req.json()
  if (typeof name !== "string" || name.trim().length < 1 || name.trim().length > 32) {
    return NextResponse.json({ error: "Invalid channel name" }, { status: 400 })
  }
  const clean = name.trim().toLowerCase().replace(/\s+/g, "-")
  const existing = await db.channel.findUnique({ where: { name: clean } })
  if (existing) return NextResponse.json({ error: "Channel exists" }, { status: 409 })
  const channel = await db.channel.create({ data: { name: clean, isAnnouncement: true } })
  return NextResponse.json({ channel })
}
