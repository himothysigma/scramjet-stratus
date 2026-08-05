import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { OWNER_PASSWORD } from "@/lib/constants"

// POST /api/owner/verify — verifies owner password and grants owner role.
export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { password } = await req.json()
  if (typeof password !== "string") {
    return NextResponse.json({ error: "Password required" }, { status: 400 })
  }

  if (password !== OWNER_PASSWORD) {
    return NextResponse.json({ error: "Incorrect owner password" }, { status: 403 })
  }

  const updated = await db.user.update({
    where: { id: user.id },
    data: { isOwner: true },
  })

  return NextResponse.json({
    ok: true,
    user: {
      id: updated.id,
      username: updated.username,
      displayName: updated.displayName,
      bio: updated.bio,
      pfpUrl: updated.pfpUrl,
      bannerUrl: updated.bannerUrl,
      isOwner: updated.isOwner,
    },
  })
}
