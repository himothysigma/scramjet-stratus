import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentUser, toSafeUser, canUseGifAndDeco } from "@/lib/auth"
import { AVATAR_DECOS, PROFILE_EFFECTS } from "@/lib/constants"

const VALID_DECOS = AVATAR_DECOS.map((d) => d.id)
const VALID_EFFECTS = PROFILE_EFFECTS.map((e) => e.id)

// PATCH /api/profile/deco — set avatar decoration + profile effect (owner only)
export async function PATCH(req: NextRequest) {
  const me = await getCurrentUser()
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!canUseGifAndDeco(me.role)) {
    return NextResponse.json({ error: "Avatar decorations and profile effects are owner-only" }, { status: 403 })
  }
  const { avatarDeco, profileEffect } = await req.json()
  const data: { avatarDeco?: string | null; profileEffect?: string | null } = {}

  if (typeof avatarDeco === "string") {
    if (!VALID_DECOS.includes(avatarDeco)) {
      return NextResponse.json({ error: "Invalid decoration" }, { status: 400 })
    }
    data.avatarDeco = avatarDeco === "none" ? null : avatarDeco
  }
  if (typeof profileEffect === "string") {
    if (!VALID_EFFECTS.includes(profileEffect)) {
      return NextResponse.json({ error: "Invalid effect" }, { status: 400 })
    }
    data.profileEffect = profileEffect === "none" ? null : profileEffect
  }

  const updated = await db.user.update({ where: { id: me.id }, data })
  return NextResponse.json({ user: toSafeUser(updated) })
}
