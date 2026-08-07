import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

// POST /api/quotes/save — save a message as a quote card
// body: { authorName, authorPfp?, content }
export async function POST(req: NextRequest) {
  const me = await getCurrentUser()
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { authorName, authorPfp, content } = await req.json()
  if (typeof authorName !== "string" || typeof content !== "string") {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 })
  }
  if (content.length === 0 || content.length > 2000) {
    return NextResponse.json({ error: "Invalid content length" }, { status: 400 })
  }
  const quote = await db.quote.create({
    data: { saverId: me.id, authorName, authorPfp: authorPfp || null, content },
  })
  return NextResponse.json({ ok: true, quote })
}
