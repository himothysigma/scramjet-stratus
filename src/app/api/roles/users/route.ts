import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentUser, toSafeUser, canManageRoles } from "@/lib/auth"

// GET /api/roles/users — owner lists all users (for role management)
export async function GET() {
  const me = await getCurrentUser()
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!canManageRoles(me.role)) {
    return NextResponse.json({ error: "Only the owner can view user list" }, { status: 403 })
  }
  const users = await db.user.findMany({
    orderBy: [{ role: "desc" }, { createdAt: "asc" }],
    take: 200,
  })
  return NextResponse.json({ users: users.map(toSafeUser) })
}
