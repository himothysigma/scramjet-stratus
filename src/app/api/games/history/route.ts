import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

// POST /api/games/history — record a game play session
// body: { gameId }
export async function POST(req: NextRequest) {
  const me = await getCurrentUser()
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { gameId } = await req.json()
  if (typeof gameId !== "string") return NextResponse.json({ error: "gameId required" }, { status: 400 })

  await db.gameHistory.create({ data: { userId: me.id, gameId } })

  // Also increment messageCount? No — that's for chat. Keep separate.

  // Keep only last 20 entries per user
  const all = await db.gameHistory.findMany({
    where: { userId: me.id },
    orderBy: { playedAt: "desc" },
  })
  if (all.length > 20) {
    const toDelete = all.slice(20)
    await db.gameHistory.deleteMany({ where: { id: { in: toDelete.map((h) => h.id) } } })
  }

  return NextResponse.json({ ok: true })
}

// GET /api/games/history — list my recently played games
export async function GET() {
  const me = await getCurrentUser()
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const history = await db.gameHistory.findMany({
    where: { userId: me.id },
    orderBy: { playedAt: "desc" },
    take: 10,
  })
  // Deduplicate by gameId (keep most recent)
  const seen = new Set<string>()
  const recent = history.filter((h) => {
    if (seen.has(h.gameId)) return false
    seen.add(h.gameId)
    return true
  })
  return NextResponse.json({ history: recent.map((h) => h.gameId) })
}
