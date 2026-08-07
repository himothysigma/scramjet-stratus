import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentUser, canDeleteAnyMessage } from "@/lib/auth"

// DELETE /api/messages/[id] — owner soft-deletes any message
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const me = await getCurrentUser()
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!canDeleteAnyMessage(me.role)) {
    return NextResponse.json({ error: "Only the owner can delete others' messages" }, { status: 403 })
  }

  const { id } = await params
  const msg = await db.message.findUnique({ where: { id } })
  if (!msg) return NextResponse.json({ error: "Not found" }, { status: 404 })

  await db.message.update({ where: { id }, data: { deleted: true, content: "" } })
  return NextResponse.json({ ok: true, id, channelId: msg.channelId })
}
