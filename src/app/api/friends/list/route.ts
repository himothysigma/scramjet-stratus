import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentUser, toSafeUser } from "@/lib/auth"

// GET /api/friends/list — returns { friends, incoming, outgoing }
export async function GET() {
  const me = await getCurrentUser()
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const [accepted, pending] = await Promise.all([
    db.friendship.findMany({
      where: { status: "ACCEPTED", OR: [{ requesterId: me.id }, { receiverId: me.id }] },
      include: { requester: true, receiver: true },
    }),
    db.friendship.findMany({
      where: { status: "PENDING", OR: [{ requesterId: me.id }, { receiverId: me.id }] },
      include: { requester: true, receiver: true },
    }),
  ])

  const friends = accepted.map((f) => (f.requesterId === me.id ? f.receiver : f.requester)).map(toSafeUser)
  const incoming = pending.filter((f) => f.receiverId === me.id).map((f) => toSafeUser(f.requester))
  const outgoing = pending.filter((f) => f.requesterId === me.id).map((f) => toSafeUser(f.receiver))

  return NextResponse.json({ friends, incoming, outgoing })
}
