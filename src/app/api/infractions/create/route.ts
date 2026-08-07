import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentUser, toSafeUser, canModerate } from "@/lib/auth"
import { AUTO_PUNISHMENTS } from "@/lib/constants"

// POST /api/infractions/create — warn/mute/ban a user (mod+ only)
// body: { userId, type, reason, durationMin? }
// Auto-punishments: 3 warns → 1h mute, 5 warns → 24h mute, 7 warns → perm ban
export async function POST(req: NextRequest) {
  const me = await getCurrentUser()
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!canModerate(me.role)) {
    return NextResponse.json({ error: "Only moderators can issue infractions" }, { status: 403 })
  }

  const { userId, type, reason, durationMin } = await req.json()
  if (typeof userId !== "string" || typeof type !== "string" || typeof reason !== "string") {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 })
  }
  if (!["WARN", "MUTE", "BAN"].includes(type)) {
    return NextResponse.json({ error: "Invalid infraction type" }, { status: 400 })
  }

  const target = await db.user.findUnique({ where: { id: userId } })
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 })

  // Can't infract someone of equal or higher role
  const rank = (r: string) => r === "OWNER" ? 4 : r === "ADMIN" ? 3 : r === "MOD" ? 2 : 1
  if (rank(target.role) >= rank(me.role)) {
    return NextResponse.json({ error: "Can't infract a user of equal or higher role" }, { status: 403 })
  }

  // Create the infraction record
  const infraction = await db.infraction.create({
    data: { userId, issuerId: me.id, type, reason, duration: durationMin || null },
  })

  let autoPunishment = null

  // If it's a formal WARN, check auto-punishment thresholds
  if (type === "WARN") {
    const newWarnCount = target.warnCount + 1
    await db.user.update({ where: { id: userId }, data: { warnCount: newWarnCount } })

    if (newWarnCount >= AUTO_PUNISHMENTS.WARN_THRESHOLD_PERM_BAN) {
      // 7 warns → permanent ban
      await db.user.update({ where: { id: userId }, data: { muted: true, mutedUntil: null } })
      await db.infraction.create({
        data: { userId, issuerId: me.id, type: "AUTO_BAN", reason: `Automatic ban: ${newWarnCount} warnings reached`, duration: null },
      })
      autoPunishment = { type: "AUTO_BAN", message: `User auto-banned (${newWarnCount} warnings)` }
    } else if (newWarnCount >= AUTO_PUNISHMENTS.WARN_THRESHOLD_24H_MUTE) {
      // 5 warns → 24h mute
      const until = new Date(Date.now() + 24 * 60 * 60 * 1000)
      await db.user.update({ where: { id: userId }, data: { muted: true, mutedUntil: until } })
      await db.infraction.create({
        data: { userId, issuerId: me.id, type: "AUTO_MUTE", reason: `Automatic 24h mute: ${newWarnCount} warnings`, duration: 1440 },
      })
      autoPunishment = { type: "AUTO_MUTE", message: `User auto-muted for 24h (${newWarnCount} warnings)` }
    } else if (newWarnCount >= AUTO_PUNISHMENTS.WARN_THRESHOLD_1H_MUTE) {
      // 3 warns → 1h mute
      const until = new Date(Date.now() + 60 * 60 * 1000)
      await db.user.update({ where: { id: userId }, data: { muted: true, mutedUntil: until } })
      await db.infraction.create({
        data: { userId, issuerId: me.id, type: "AUTO_MUTE", reason: `Automatic 1h mute: ${newWarnCount} warnings`, duration: 60 },
      })
      autoPunishment = { type: "AUTO_MUTE", message: `User auto-muted for 1h (${newWarnCount} warnings)` }
    }
  }

  // If MUTE or BAN, apply it directly too
  if (type === "MUTE") {
    const until = durationMin ? new Date(Date.now() + durationMin * 60 * 1000) : null
    await db.user.update({ where: { id: userId }, data: { muted: true, mutedUntil: until } })
  }
  if (type === "BAN") {
    await db.user.update({ where: { id: userId }, data: { muted: true, mutedUntil: null } })
  }

  return NextResponse.json({ ok: true, infraction, autoPunishment })
}
