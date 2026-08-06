import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

// POST /api/games/favorite — toggle favorite game
// body: { gameId }
export async function POST(req: NextRequest) {
  const me = await getCurrentUser()
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { gameId } = await req.json()
  if (typeof gameId !== "string") return NextResponse.json({ error: "gameId required" }, { status: 400 })

  const existing = await db.gameFavorite.findUnique({
    where: { userId_gameId: { userId: me.id, gameId } },
  })
  if (existing) {
    await db.gameFavorite.delete({ where: { id: existing.id } })
    return NextResponse.json({ ok: true, favorited: false })
  }
  await db.gameFavorite.create({ data: { userId: me.id, gameId } })
  return NextResponse.json({ ok: true, favorited: true })
}

// GET /api/games/favorite?gameId=... — check if a game is favorited
export async function GET(req: NextRequest) {
  const me = await getCurrentUser()
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const gameId = searchParams.get("gameId")
  if (!gameId) return NextResponse.json({ error: "gameId required" }, { status: 400 })
  const fav = await db.gameFavorite.findUnique({
    where: { userId_gameId: { userId: me.id, gameId } },
  })
  return NextResponse.json({ favorited: !!fav })
}
