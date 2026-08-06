import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

// GET /api/chat/channels — list public channels (not DMs), announcements first
export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const channels = await db.channel.findMany({
    where: { isDM: false },
    orderBy: [{ isAnnouncement: "desc" }, { createdAt: "asc" }],
    include: { _count: { select: { messages: true } } },
  })

  if (channels.length === 0) {
    await db.channel.create({ data: { name: "general" } })
    await db.channel.create({ data: { name: "announcements", isAnnouncement: true } })
    const fresh = await db.channel.findMany({
      where: { isDM: false },
      orderBy: [{ isAnnouncement: "desc" }, { createdAt: "asc" }],
      include: { _count: { select: { messages: true } } },
    })
    return NextResponse.json({ channels: fresh })
  }
  // Ensure announcements channel exists
  if (!channels.some((c) => c.isAnnouncement)) {
    await db.channel.create({ data: { name: "announcements", isAnnouncement: true } })
    const fresh = await db.channel.findMany({
      where: { isDM: false },
      orderBy: [{ isAnnouncement: "desc" }, { createdAt: "asc" }],
      include: { _count: { select: { messages: true } } },
    })
    return NextResponse.json({ channels: fresh })
  }
  return NextResponse.json({ channels })
}

// POST /api/chat/channels — create a public channel
export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { name } = await req.json()
  if (typeof name !== "string" || name.trim().length < 1 || name.trim().length > 32) {
    return NextResponse.json({ error: "Invalid channel name" }, { status: 400 })
  }
  const clean = name.trim().toLowerCase().replace(/\s+/g, "-")
  const existing = await db.channel.findUnique({ where: { name: clean } })
  if (existing) return NextResponse.json({ error: "Channel exists" }, { status: 409 })
  const channel = await db.channel.create({ data: { name: clean } })
  return NextResponse.json({ channel })
}
