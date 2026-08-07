import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentUser, toSafeUser, canManageRoles } from "@/lib/auth"
import { ROLES, type Role } from "@/lib/constants"

// POST /api/roles/assign — owner assigns a role to a user
// body: { userId, role }
export async function POST(req: NextRequest) {
  const me = await getCurrentUser()
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!canManageRoles(me.role)) {
    return NextResponse.json({ error: "Only the owner can assign roles" }, { status: 403 })
  }

  const { userId, role } = await req.json()
  if (typeof userId !== "string" || typeof role !== "string") {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 })
  }
  if (!ROLES.includes(role as Role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 })
  }

  // Owner can't demote themselves (prevent lockout)
  if (userId === me.id && role !== "OWNER") {
    return NextResponse.json({ error: "You can't remove your own owner role" }, { status: 400 })
  }
  // Can't set another user to OWNER (only the password-based verify grants owner)
  if (role === "OWNER" && userId !== me.id) {
    return NextResponse.json({ error: "Owner is granted only via password verification" }, { status: 403 })
  }

  const updated = await db.user.update({
    where: { id: userId },
    data: { role },
  })
  return NextResponse.json({ user: toSafeUser(updated) })
}
