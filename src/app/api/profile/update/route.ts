import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

// PATCH /api/profile/update — update display name + bio
export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { displayName, bio } = await req.json()

  const data: { displayName?: string; bio?: string } = {}
  if (typeof displayName === "string") {
    const d = displayName.trim()
    if (d.length < 1 || d.length > 32) {
      return NextResponse.json({ error: "Display name 1-32 chars" }, { status: 400 })
    }
    data.displayName = d
  }
  if (typeof bio === "string") {
    if (bio.length > 200) {
      return NextResponse.json({ error: "Bio too long (200 max)" }, { status: 400 })
    }
    data.bio = bio
  }

  const updated = await db.user.update({ where: { id: user.id }, data })
  return NextResponse.json({
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
