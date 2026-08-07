import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentUser, toSafeUser } from "@/lib/auth"

// PATCH /api/profile/status — set custom status text
export async function PATCH(req: NextRequest) {
  const me = await getCurrentUser()
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { status } = await req.json()
  if (typeof status !== "string" || status.length > 100) {
    return NextResponse.json({ error: "Status too long (100 max)" }, { status: 400 })
  }
  const updated = await db.user.update({ where: { id: me.id }, data: { status } })
  return NextResponse.json({ user: toSafeUser(updated) })
}
