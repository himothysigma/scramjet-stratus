import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentUser, canModerate } from "@/lib/auth"

// DELETE /api/infractions/delete — delete an infraction record (admin+ only)
export async function DELETE(req: NextRequest) {
  const me = await getCurrentUser()
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (me.role !== "OWNER" && me.role !== "ADMIN") {
    return NextResponse.json({ error: "Only admins can delete infractions" }, { status: 403 })
  }
  const { id } = await req.json()
  if (typeof id !== "string") {
    return NextResponse.json({ error: "id required" }, { status: 400 })
  }
  await db.infraction.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
