// Scramjet Stratus — real-time chat service (socket.io)
// Roles, DMs, mute enforcement, message deletion broadcast.

import { createServer } from "http"
import { Server } from "socket.io"
import { Database } from "bun:sqlite"

const PORT = 3001
const DB_PATH = process.env.DATABASE_URL?.replace("file:", "") || "/home/z/my-project/db/custom.db"

const sqlite = new Database(DB_PATH)
sqlite.exec("PRAGMA journal_mode = WAL;")
sqlite.exec("PRAGMA foreign_keys = ON;")

const SESSION_COOKIE = "stratus_session"
function readCookie(cookieHeader: string | undefined): string | null {
  if (!cookieHeader) return null
  for (const part of cookieHeader.split(";")) {
    const [k, ...rest] = part.trim().split("=")
    if (k === SESSION_COOKIE) return decodeURIComponent(rest.join("="))
  }
  return null
}

const getSession = sqlite.prepare(`
  SELECT s.token, s.expiresAt, u.id as userId, u.username, u.displayName, u.pfpUrl, u.pfpIsGif,
         u.bio, u.status, u.avatarDeco, u.profileEffect, u.role, u.muted, u.mutedUntil
  FROM Session s JOIN User u ON u.id = s.userId
  WHERE s.token = ?
`)
const insertMessage = sqlite.prepare(`
  INSERT INTO Message (id, channelId, userId, username, content, createdAt)
  VALUES (?, ?, ?, ?, ?, ?)
`)
const getChannelMessages = sqlite.prepare(`
  SELECT m.id, m.channelId, m.userId, m.username, m.content, m.deleted, m.createdAt,
         u.displayName, u.pfpUrl, u.pfpIsGif, u.role
  FROM Message m LEFT JOIN User u ON u.id = m.userId
  WHERE m.channelId = ? ORDER BY m.createdAt DESC LIMIT ?
`)
const getChannel = sqlite.prepare(`SELECT id, name, isDM FROM Channel WHERE id = ?`)
const getDMMembers = sqlite.prepare(`SELECT userId FROM Membership WHERE channelId = ?`)
const getUserMute = sqlite.prepare(`SELECT muted, mutedUntil FROM User WHERE id = ?`)
const markMessageDeleted = sqlite.prepare(`UPDATE Message SET deleted = 1, content = '' WHERE id = ?`)
const getMessageById = sqlite.prepare(`SELECT id, userId FROM Message WHERE id = ?`)
const editMessage = sqlite.prepare(`UPDATE Message SET content = ?, edited = 1, editedAt = ? WHERE id = ?`)

interface SessionRow {
  token: string
  expiresAt: string
  userId: string
  username: string
  displayName: string
  pfpUrl: string | null
  pfpIsGif: number
  bio: string
  status: string
  avatarDeco: string | null
  profileEffect: string | null
  role: string
  muted: number
  mutedUntil: string | null
}

interface ClientUser {
  userId: string
  username: string
  displayName: string
  pfpUrl: string | null
  pfpIsGif: boolean
  bio: string
  status: string
  avatarDeco: string | null
  profileEffect: string | null
  role: string
  muted: boolean
  mutedUntil: string | null
  activity?: string
}

function safeUser(r: SessionRow): ClientUser {
  return {
    userId: r.userId, username: r.username, displayName: r.displayName,
    pfpUrl: r.pfpUrl, pfpIsGif: r.pfpIsGif === 1, bio: r.bio, status: r.status,
    avatarDeco: r.avatarDeco, profileEffect: r.profileEffect, role: r.role,
    muted: r.muted === 1, mutedUntil: r.mutedUntil,
  }
}

function isMutedNow(u: ClientUser): boolean {
  if (!u.muted) return false
  if (!u.mutedUntil) return true
  return new Date(u.mutedUntil).getTime() > Date.now()
}

function genId() { return crypto.randomUUID() }

const httpServer = createServer()
const io = new Server(httpServer, {
  path: "/",
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

io.use((socket, next) => {
  const token =
    (typeof socket.handshake.auth?.token === "string" && socket.handshake.auth.token) ||
    readCookie(socket.handshake.headers.cookie)
  if (!token) return next(new Error("No token"))
  const row = getSession.get(token) as SessionRow | null
  if (!row) return next(new Error("Invalid session"))
  if (new Date(row.expiresAt).getTime() < Date.now()) return next(new Error("Session expired"))
  ;(socket as any).user = safeUser(row)
  next()
})

io.on("connection", (socket) => {
  const user = (socket as any).user as ClientUser
  online.set(socket.id, user)

  socket.on("join-channel", ({ channelId }: { channelId: string }) => {
    if (!channelId) return
    // For DM channels, verify membership
    const ch = getChannel.get(channelId) as { id: string; name: string; isDM: number } | null
    if (ch && ch.isDM === 1) {
      const members = getDMMembers.all(channelId) as { userId: string }[]
      if (!members.some((m) => m.userId === user.userId)) return
    }
    socket.join(`channel:${channelId}`)
    if (!channelRooms.has(channelId)) channelRooms.set(channelId, new Set())
    channelRooms.get(channelId)!.add(socket.id)

    const rows = getChannelMessages.all(channelId, 50) as any[]
    socket.emit("message-history", {
      channelId,
      messages: rows.reverse().map((r) => ({
        id: r.id, channelId: r.channelId, userId: r.userId, username: r.username,
        content: r.content, deleted: r.deleted === 1, createdAt: r.createdAt,
        displayName: r.displayName, pfpUrl: r.pfpUrl, pfpIsGif: r.pfpIsGif === 1, role: r.role,
      })),
    })
    broadcastPresence(channelId)
  })

  socket.on("leave-channel", ({ channelId }: { channelId: string }) => {
    socket.leave(`channel:${channelId}`)
    channelRooms.get(channelId)?.delete(socket.id)
    broadcastPresence(channelId)
  })

  socket.on("send-message", ({ channelId, content }: { channelId: string; content: string }) => {
    if (!channelId) return
    // Re-check mute from DB (in case it changed since connect)
    const fresh = getUserMute.get(user.userId) as { muted: number; mutedUntil: string | null } | null
    if (fresh) {
      user.muted = fresh.muted === 1
      user.mutedUntil = fresh.mutedUntil
    }
    if (isMutedNow(user)) {
      socket.emit("mute-error", { message: "You are muted and can't send messages." })
      return
    }
    const text = typeof content === "string" ? content.trim() : ""
    if (text.length === 0 || text.length > 2000) return

    const id = genId()
    const createdAt = new Date().toISOString()
    insertMessage.run(id, channelId, user.userId, user.username, text, createdAt)

    io.to(`channel:${channelId}`).emit("message", {
      id, channelId, userId: user.userId, username: user.username,
      displayName: user.displayName, pfpUrl: user.pfpUrl, pfpIsGif: user.pfpIsGif,
      role: user.role, content: text, deleted: false, createdAt,
    })
  })

  // Owner deletes a message — broadcast to the channel
  socket.on("delete-message", ({ messageId, channelId }: { messageId: string; channelId: string }) => {
    if (user.role !== "OWNER") return
    markMessageDeleted.run(messageId)
    io.to(`channel:${channelId}`).emit("message-deleted", { id: messageId, channelId })
  })

  // Edit your own message
  socket.on("edit-message", ({ messageId, channelId, content }: { messageId: string; channelId: string; content: string }) => {
    const text = typeof content === "string" ? content.trim() : ""
    if (text.length === 0 || text.length > 2000) return
    // Verify ownership
    const msg = getMessageById.get(messageId) as { userId: string } | null
    if (!msg || msg.userId !== user.userId) return
    editMessage.run(text, new Date().toISOString(), messageId)
    io.to(`channel:${channelId}`).emit("message-edited", { id: messageId, channelId, content: text, editedAt: new Date().toISOString() })
  })

  // Typing indicator
  socket.on("typing", ({ channelId, isTyping }: { channelId: string; isTyping: boolean }) => {
    socket.to(`channel:${channelId}`).emit("typing", { channelId, userId: user.userId, username: user.displayName, isTyping })
  })

  // Rich presence — set what you're doing (e.g. "Playing Neon Snake")
  socket.on("set-presence", ({ activity }: { activity: string }) => {
    user.activity = typeof activity === "string" ? activity.slice(0, 100) : ""
    online.set(socket.id, user)
    // Broadcast to all channels the user is in
    for (const [channelId, ids] of channelRooms.entries()) {
      if (ids.has(socket.id)) broadcastPresence(channelId)
    }
  })

  socket.on("disconnect", () => {
    online.delete(socket.id)
    for (const [channelId, ids] of channelRooms.entries()) {
      if (ids.delete(socket.id)) broadcastPresence(channelId)
    }
  })
})

httpServer.listen(PORT, () => {
  console.log(`[chat] Stratus chat service running on port ${PORT}`)
})

process.on("SIGTERM", () => httpServer.close(() => process.exit(0)))
process.on("SIGINT", () => httpServer.close(() => process.exit(0)))
