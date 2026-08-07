import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

// GET /api/games/favorites — list my favorite games
export async function GET() {
  const me = await getCurrentUser()
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const favorites = await db.gameFavorite.findMany({
    where: { userId: me.id },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json({ favorites: favorites.map((f) => f.gameId) })
}
