import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentUser, toSafeUser } from "@/lib/auth"

// POST /api/channels/group — create a group chat
// body: { name, memberIds: string[] }
export async function POST(req: NextRequest) {
  const me = await getCurrentUser()
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { name, memberIds } = await req.json()
  if (typeof name !== "string" || name.trim().length < 1 || name.trim().length > 32) {
    return NextResponse.json({ error: "Invalid group name" }, { status: 400 })
  }
  if (!Array.isArray(memberIds) || memberIds.length < 1) {
    return NextResponse.json({ error: "Need at least 1 member" }, { status: 400 })
  }

  const clean = `group-${name.trim().toLowerCase().replace(/\s+/g, "-")}-${Date.now().toString(36)}`
  const channel = await db.channel.create({ data: { name: clean, isGroup: true } })

  // Add creator + all members
  const allIds = [me.id, ...memberIds.filter((id: string) => id !== me.id)]
  await db.membership.createMany({
    data: allIds.map((userId: string) => ({ userId, channelId: channel.id })),
  })

  // Return the channel + members
  const members = await db.user.findMany({
    where: { id: { in: allIds } },
  })

  return NextResponse.json({
    id: channel.id,
    name: name.trim(),
    members: members.map(toSafeUser),
  })
}
