import type { Server as HTTPServer } from "http"
import { Server as IOServer } from "socket.io"
import { db } from "@/lib/db"

interface ClientUser {
  userId: string
  username: string
  displayName: string
  pfpUrl: string | null
  isOwner: boolean
}

function safeUser(u: {
  id: string
  username: string
  displayName: string
  pfpUrl: string | null
  isOwner: boolean
}): ClientUser {
  return { userId: u.id, username: u.username, displayName: u.displayName, pfpUrl: u.pfpUrl, isOwner: u.isOwner }
}

const SESSION_COOKIE = "stratus_session"
function readCookie(cookieHeader: string | undefined): string | null {
  if (!cookieHeader) return null
  for (const part of cookieHeader.split(";")) {
    const [k, ...rest] = part.trim().split("=")
    if (k === SESSION_COOKIE) return decodeURIComponent(rest.join("="))
  }
  return null
}

/**
 * Attach the Stratus real-time chat (socket.io) to an existing HTTP server.
 * Used by the custom server (server.js) so chat + Next.js share one port —
 * this is what makes the app work on Replit (single exposed port) and any
 * standard Node host. In the sandbox dev environment the separate
 * mini-services/chat-service is used instead (same logic, bun:sqlite).
 */
export function attachChat(httpServer: HTTPServer): IOServer {
  const io = new IOServer(httpServer, {
    path: "/socket.io",
    cors: { origin: "*", methods: ["GET", "POST"] },
    pingTimeout: 60000,
    pingInterval: 25000,
  })

  const online = new Map<string, ClientUser>()
  const channelRooms = new Map<string, Set<string>>()

  function broadcastPresence(channelId: string) {
    const ids = channelRooms.get(channelId)
    if (!ids) return
    const users: ClientUser[] = []
    const seen = new Set<string>()
    for (const sid of ids) {
      const u = online.get(sid)
      if (u && !seen.has(u.userId)) { seen.add(u.userId); users.push(u) }
    }
    io.to(`channel:${channelId}`).emit("presence", { channelId, users })
  }

  io.use(async (socket, next) => {
    const token =
      (typeof socket.handshake.auth?.token === "string" && socket.handshake.auth.token) ||
      readCookie(socket.handshake.headers.cookie)
    if (!token) return next(new Error("No token"))
    const session = await db.session.findUnique({
      where: { token },
      include: { user: true },
    })
    if (!session) return next(new Error("Invalid session"))
    if (session.expiresAt.getTime() < Date.now()) {
      await db.session.delete({ where: { id: session.id } }).catch(() => {})
      return next(new Error("Session expired"))
    }
    ;(socket as any).user = safeUser(session.user)
    next()
  })

  io.on("connection", (socket) => {
    const user = (socket as any).user as ClientUser
    online.set(socket.id, user)

    socket.on("join-channel", async ({ channelId }: { channelId: string }) => {
      if (!channelId) return
      socket.join(`channel:${channelId}`)
      if (!channelRooms.has(channelId)) channelRooms.set(channelId, new Set())
      channelRooms.get(channelId)!.add(socket.id)
      const rows = await db.message.findMany({
        where: { channelId },
        orderBy: { createdAt: "desc" },
        take: 50,
      })
      socket.emit("message-history", {
        channelId,
        messages: rows.reverse().map((r) => ({
          id: r.id, channelId: r.channelId, userId: r.userId,
          username: r.username, content: r.content, createdAt: r.createdAt,
        })),
      })
      broadcastPresence(channelId)
    })

    socket.on("leave-channel", ({ channelId }: { channelId: string }) => {
      socket.leave(`channel:${channelId}`)
      channelRooms.get(channelId)?.delete(socket.id)
      broadcastPresence(channelId)
    })

    socket.on("send-message", async ({ channelId, content }: { channelId: string; content: string }) => {
      if (!channelId) return
      const text = typeof content === "string" ? content.trim() : ""
      if (text.length === 0 || text.length > 2000) return
      const created = await db.message.create({
        data: { channelId, userId: user.userId, username: user.username, content: text },
      })
      io.to(`channel:${channelId}`).emit("message", {
        id: created.id,
        channelId: created.channelId,
        userId: user.userId,
        username: user.username,
        displayName: user.displayName,
        pfpUrl: user.pfpUrl,
        content: text,
        createdAt: created.createdAt,
      })
    })

    socket.on("disconnect", () => {
      online.delete(socket.id)
      for (const [channelId, ids] of channelRooms.entries()) {
        if (ids.delete(socket.id)) broadcastPresence(channelId)
      }
    })
  })

  return io
}
