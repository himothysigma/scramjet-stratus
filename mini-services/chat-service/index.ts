// Scramjet Stratus — real-time chat service (socket.io)
// Runs on port 3001. Uses bun:sqlite to read/write the same DB as the Next.js app.
// Messages are persisted AND broadcast to every connected client across all devices.

import { createServer } from "http"
import { Server } from "socket.io"
import { Database } from "bun:sqlite"

const PORT = 3001
const DB_PATH = process.env.DATABASE_URL?.replace("file:", "") || "/home/z/my-project/db/custom.db"

const sqlite = new Database(DB_PATH)
sqlite.exec("PRAGMA journal_mode = WAL;")
sqlite.exec("PRAGMA foreign_keys = ON;")

// Prepared statements
const getSession = sqlite.prepare(`
  SELECT s.token, s.expiresAt, u.id as userId, u.username, u.displayName, u.pfpUrl, u.isOwner
  FROM Session s JOIN User u ON u.id = s.userId
  WHERE s.token = ?
`)
const insertMessage = sqlite.prepare(`
  INSERT INTO Message (id, channelId, userId, username, content, createdAt)
  VALUES (?, ?, ?, ?, ?, ?)
`)
const getChannelMessages = sqlite.prepare(`
  SELECT id, channelId, userId, username, content, createdAt
  FROM Message WHERE channelId = ? ORDER BY createdAt DESC LIMIT ?
`)

interface SessionRow {
  token: string
  expiresAt: string
  userId: string
  username: string
  displayName: string
  pfpUrl: string | null
  isOwner: number
}

interface ClientUser {
  userId: string
  username: string
  displayName: string
  pfpUrl: string | null
  isOwner: boolean
}

function genId(): string {
  return crypto.randomUUID()
}

function safeUser(row: SessionRow): ClientUser {
  return {
    userId: row.userId,
    username: row.username,
    displayName: row.displayName,
    pfpUrl: row.pfpUrl,
    isOwner: row.isOwner === 1,
  }
}

// socket.io server. Path MUST be "/" so Caddy forwards correctly.
const httpServer = createServer()
const io = new Server(httpServer, {
  path: "/",
  cors: { origin: "*", methods: ["GET", "POST"] },
  pingTimeout: 60000,
  pingInterval: 25000,
})

// Online users keyed by socket.id
const online = new Map<string, ClientUser>()
// channel -> Set of socket ids
const channelRooms = new Map<string, Set<string>>()

function broadcastPresence(channelId: string) {
  const ids = channelRooms.get(channelId)
  if (!ids) return
  const users: ClientUser[] = []
  const seen = new Set<string>()
  for (const sid of ids) {
    const u = online.get(sid)
    if (u && !seen.has(u.userId)) {
      seen.add(u.userId)
      users.push(u)
    }
  }
  io.to(`channel:${channelId}`).emit("presence", { channelId, users })
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

io.use((socket, next) => {
  // Authenticate via the session cookie (sent automatically by the browser).
  // Falls back to an auth token if provided.
  const token =
    (typeof socket.handshake.auth?.token === "string" && socket.handshake.auth.token) ||
    readCookie(socket.handshake.headers.cookie)
  if (!token) {
    return next(new Error("No token"))
  }
  const row = getSession.get(token) as SessionRow | null
  if (!row) return next(new Error("Invalid session"))
  if (new Date(row.expiresAt).getTime() < Date.now()) {
    return next(new Error("Session expired"))
  }
  ;(socket as any).user = safeUser(row)
  next()
})

io.on("connection", (socket) => {
  const user = (socket as any).user as ClientUser
  online.set(socket.id, user)
  console.log(`[chat] connected: ${user.username} (${socket.id})`)

  // Join a channel room + send recent history + presence
  socket.on("join-channel", ({ channelId }: { channelId: string }) => {
    if (!channelId) return
    socket.join(`channel:${channelId}`)
    if (!channelRooms.has(channelId)) channelRooms.set(channelId, new Set())
    channelRooms.get(channelId)!.add(socket.id)

    // Send last 50 messages as history.
    const rows = getChannelMessages.all(channelId, 50) as any[]
    socket.emit("message-history", {
      channelId,
      messages: rows.reverse().map((r) => ({
        id: r.id,
        channelId: r.channelId,
        userId: r.userId,
        username: r.username,
        content: r.content,
        createdAt: r.createdAt,
      })),
    })
    broadcastPresence(channelId)
  })

  socket.on("leave-channel", ({ channelId }: { channelId: string }) => {
    socket.leave(`channel:${channelId}`)
    channelRooms.get(channelId)?.delete(socket.id)
    broadcastPresence(channelId)
  })

  // Send a message — persisted then broadcast to everyone in the channel.
  socket.on("send-message", ({ channelId, content }: { channelId: string; content: string }) => {
    if (!channelId) return
    const text = typeof content === "string" ? content.trim() : ""
    if (text.length === 0 || text.length > 2000) return

    const id = genId()
    const createdAt = new Date().toISOString()
    insertMessage.run(id, channelId, user.userId, user.username, text, createdAt)

    const msg = {
      id,
      channelId,
      userId: user.userId,
      username: user.username,
      displayName: user.displayName,
      pfpUrl: user.pfpUrl,
      content: text,
      createdAt,
    }
    // Broadcast to EVERYONE in the channel (including sender for confirmation).
    io.to(`channel:${channelId}`).emit("message", msg)
  })

  socket.on("disconnect", () => {
    online.delete(socket.id)
    for (const [channelId, ids] of channelRooms.entries()) {
      if (ids.delete(socket.id)) {
        broadcastPresence(channelId)
      }
    }
    console.log(`[chat] disconnected: ${user.username} (${socket.id})`)
  })
})

httpServer.listen(PORT, () => {
  console.log(`[chat] Stratus chat service running on port ${PORT}`)
})

process.on("SIGTERM", () => httpServer.close(() => process.exit(0)))
process.on("SIGINT", () => httpServer.close(() => process.exit(0)))
