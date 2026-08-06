import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

// PATCH /api/messages/edit — edit your own message
// body: { id, content }
export async function PATCH(req: NextRequest) {
  const me = await getCurrentUser()
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id, content } = await req.json()
  if (typeof id !== "string" || typeof content !== "string") {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 })
  }
  const text = content.trim()
  if (text.length === 0 || text.length > 2000) {
    return NextResponse.json({ error: "Invalid content" }, { status: 400 })
  }

  const msg = await db.message.findUnique({ where: { id } })
  if (!msg) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (msg.userId !== me.id) {
    return NextResponse.json({ error: "Can only edit your own messages" }, { status: 403 })
  }

  const updated = await db.message.update({
    where: { id },
    data: { content: text, edited: true, editedAt: new Date() },
  })
  return NextResponse.json({ ok: true, message: updated })
}
