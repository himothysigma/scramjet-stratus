"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { io, type Socket } from "socket.io-client"
import { api, type Channel, type ChatMessage, type SafeUser, type Role } from "@/lib/api"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Hash, Plus, Send, Loader2, Users, MoreVertical, Trash2, VolumeX, Volume2, Pencil } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { RoleBadge, DisplayName, AvatarWithDeco } from "@/components/role-ui"

type PresenceUser = {
  userId: string
  username: string
  displayName: string
  pfpUrl: string | null
  pfpIsGif: boolean
  role: Role
  avatarDeco: string | null
  muted: boolean
  mutedUntil: string | null
}

function canModerate(role: Role) { return role === "OWNER" || role === "ADMIN" || role === "MOD" }
function canDelete(role: Role) { return role === "OWNER" }

export function ChatPanel() {
  const { user } = useAuth()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [connected, setConnected] = useState(false)
  const [channels, setChannels] = useState<Channel[]>([])
  const [activeChannel, setActiveChannel] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [presence, setPresence] = useState<PresenceUser[]>([])
  const [draft, setDraft] = useState("")
  const [newChannel, setNewChannel] = useState("")
  const [showNewChannel, setShowNewChannel] = useState(false)
  const [loadingChannels, setLoadingChannels] = useState(true)
  const [typingUsers, setTypingUsers] = useState<{ userId: string; username: string }[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)

  const loadChannels = useCallback(async () => {
    try {
      const { channels } = await api.listChannels()
      setChannels(channels)
      if (channels.length > 0 && !activeChannel) setActiveChannel(channels[0].id)
    } catch { toast.error("Failed to load channels") }
    finally { setLoadingChannels(false) }
  }, [activeChannel])

  useEffect(() => { loadChannels() }, [loadChannels])

  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || ""
    const s = socketUrl
      ? io(socketUrl, { transports: ["websocket", "polling"], reconnection: true, reconnectionAttempts: Infinity, reconnectionDelay: 1000 })
      : io("/?XTransformPort=3001", { transports: ["websocket", "polling"], reconnection: true, reconnectionAttempts: Infinity, reconnectionDelay: 1000 })
    setSocket(s)
    s.on("connect", () => setConnected(true))
    s.on("disconnect", () => setConnected(false))
    s.on("connect_error", () => setConnected(false))
    s.on("mute-error", (data: { message: string }) => toast.error(data.message))
    return () => { s.disconnect() }
  }, [])

  useEffect(() => {
    if (!socket || !activeChannel || !connected) return
    setMessages([])
    setPresence([])
    socket.emit("join-channel", { channelId: activeChannel })
    socket.on("message-history", (data: { channelId: string; messages: ChatMessage[] }) => {
      if (data.channelId === activeChannel) setMessages(data.messages)
    })
    socket.on("message", (msg: ChatMessage) => {
      setMessages((prev) => prev.some((m) => m.id === msg.id) ? prev : [...prev, msg])
    })
    socket.on("message-deleted", (data: { id: string; channelId: string }) => {
      setMessages((prev) => prev.map((m) => m.id === data.id ? { ...m, deleted: true, content: "" } : m))
    })
    socket.on("message-edited", (data: { id: string; channelId: string; content: string; editedAt: string }) => {
      setMessages((prev) => prev.map((m) => m.id === data.id ? { ...m, content: data.content, edited: true } : m))
    })
    socket.on("typing", (data: { channelId: string; userId: string; username: string; isTyping: boolean }) => {
      if (data.channelId === activeChannel) {
        setTypingUsers((prev) => {
          const next = isTyping ? [...prev.filter((u) => u.userId !== data.userId), { userId: data.userId, username: data.username }] : prev.filter((u) => u.userId !== data.userId)
          return next
        })
        // Auto-clear typing after 3s
        if (isTyping) {
          setTimeout(() => {
            setTypingUsers((prev) => prev.filter((u) => u.userId !== data.userId))
          }, 3000)
        }
      }
    })
    socket.on("presence", (data: { channelId: string; users: PresenceUser[] }) => {
      if (data.channelId === activeChannel) setPresence(data.users)
    })
    return () => {
      socket.emit("leave-channel", { channelId: activeChannel })
      socket.off("message-history"); socket.off("message"); socket.off("message-deleted"); socket.off("message-edited"); socket.off("typing"); socket.off("presence")
    }
  }, [socket, activeChannel, connected])

  useEffect(() => {
    const el = scrollRef.current; if (el) el.scrollTop = el.scrollHeight
  }, [messages])

  const send = () => {
    const text = draft.trim()
    if (!text || !socket || !connected || !activeChannel) return
    socket.emit("send-message", { channelId: activeChannel, content: text })
    socket.emit("typing", { channelId: activeChannel, isTyping: false })
    setDraft("")
  }

  const onDraftChange = (v: string) => {
    setDraft(v)
    if (socket && connected && activeChannel) {
      socket.emit("typing", { channelId: activeChannel, isTyping: v.length > 0 })
    }
  }

  const startEdit = (m: ChatMessage) => {
    setEditingId(m.id)
    setEditContent(m.content)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditContent("")
  }

  const saveEdit = (m: ChatMessage) => {
    if (!socket) return
    api.editMessage(m.id, editContent).then(() => {
      socket.emit("edit-message", { messageId: m.id, channelId: m.channelId, content: editContent })
      cancelEdit()
      toast.success("Message edited")
    }).catch((e) => toast.error(e instanceof Error ? e.message : "Failed"))
  }

  const createChannel = async () => {
    const name = newChannel.trim()
    if (!name) return
    try {
      const { channel } = await api.createChannel(name)
      setChannels((prev) => [...prev, channel]); setActiveChannel(channel.id)
      setNewChannel(""); setShowNewChannel(false)
      toast.success(`Channel #${channel.name} created`)
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed") }
  }

  const deleteMessage = (msg: ChatMessage) => {
    if (!socket || !canDelete(user!.role)) return
    api.deleteMessage(msg.id).then(() => {
      socket.emit("delete-message", { messageId: msg.id, channelId: msg.channelId })
      toast.success("Message deleted")
    }).catch((e) => toast.error(e instanceof Error ? e.message : "Failed"))
  }

  const muteUser = async (u: PresenceUser) => {
    try {
      await api.muteUser(u.userId)
      toast.success(`${u.displayName} muted`)
      // Update local presence so the button switches to Unmute immediately
      setPresence((prev) => prev.map((p) => p.userId === u.userId ? { ...p, muted: true } : p))
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed") }
  }

  const unmuteUser = async (u: PresenceUser) => {
    try {
      await api.unmuteUser(u.userId)
      toast.success(`${u.displayName} unmuted`)
      // Update local presence so the button switches to Mute immediately
      setPresence((prev) => prev.map((p) => p.userId === u.userId ? { ...p, muted: false } : p))
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed") }
  }

  if (!user) return null
  const activeName = channels.find((c) => c.id === activeChannel)?.name || "general"

  return (
    <div className="h-full flex">
      {/* Channel list */}
      <aside className="w-52 shrink-0 border-r border-border bg-background flex flex-col">
        <div className="h-11 px-3 flex items-center justify-between border-b border-border">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Channels</span>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowNewChannel((v) => !v)} aria-label="New channel">
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
        {showNewChannel && (
          <div className="p-2 border-b border-border flex gap-1.5">
            <Input value={newChannel} onChange={(e) => setNewChannel(e.target.value)} onKeyDown={(e) => e.key === "Enter" && createChannel()} placeholder="new-channel" className="h-8 text-sm" autoFocus />
            <Button size="sm" className="h-8 px-2 bg-pink-500 hover:bg-pink-600 text-white" onClick={createChannel}>Add</Button>
          </div>
        )}
        <ScrollArea className="flex-1">
          <div className="p-1.5 space-y-0.5">
            {loadingChannels ? <div className="p-2 flex justify-center"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div> :
              channels.map((c) => (
                <button key={c.id} onClick={() => setActiveChannel(c.id)} className={cn("w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors", activeChannel === c.id ? "bg-pink-500/10 text-pink-600" : "hover:bg-accent text-muted-foreground")}>
                  <Hash className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{c.name}</span>
                </button>
              ))
            }
          </div>
        </ScrollArea>
      </aside>

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="h-11 shrink-0 px-4 flex items-center justify-between border-b border-border">
          <div className="flex items-center gap-2 min-w-0">
            <Hash className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="font-semibold truncate">{activeName}</span>
            <span className={cn("ml-2 h-2 w-2 rounded-full", connected ? "bg-pink-500" : "bg-red-500")} />
            <span className="text-xs text-muted-foreground">{connected ? "connected" : "reconnecting…"}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Users className="h-3.5 w-3.5" /><span>{presence.length}</span></div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scroll px-4 py-4 space-y-3">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground">
              <Hash className="h-8 w-8 mb-2 opacity-40" />
              <p className="text-sm">No messages yet in #{activeName}</p>
            </div>
          )}
          {messages.map((m) => (
            <MessageRow key={m.id} m={m} currentUser={user} onDelete={deleteMessage} onEdit={saveEdit} />
          ))}
        </div>

        <div className="shrink-0 p-3 border-t border-border">
          {typingUsers.length > 0 && (
            <p className="text-xs text-muted-foreground mb-1.5 italic">
              {typingUsers.length === 1 ? `${typingUsers[0].username} is typing…` : `${typingUsers.length} users are typing…`}
            </p>
          )}
          <div className="flex gap-2">
            <Input value={draft} onChange={(e) => onDraftChange(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send() } }} placeholder={`Message #${activeName}`} disabled={!connected} className="flex-1" />
            <Button onClick={send} disabled={!connected || !draft.trim()} className="bg-pink-500 hover:bg-pink-600 text-white" size="icon" aria-label="Send"><Send className="h-4 w-4" /></Button>
          </div>
        </div>
      </div>

      {/* Online users */}
      <aside className="w-48 shrink-0 border-l border-border bg-background hidden lg:flex flex-col">
        <div className="h-11 px-3 flex items-center border-b border-border">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Online — {presence.length}</span>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-1.5 space-y-0.5">
            {presence.map((u) => (
              <div key={u.userId} className="group flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent">
                <div className="relative shrink-0">
                  <AvatarWithDeco src={u.pfpUrl} name={u.displayName} role={u.role} avatarDeco={u.avatarDeco} isGif={u.pfpIsGif} size="xs" />
                  <span className={cn("absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background", u.muted ? "bg-red-500" : "bg-pink-500")} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <DisplayName name={u.displayName} role={u.role} className="text-sm truncate" />
                  </div>
                  {u.role !== "MEMBER" && <RoleBadge role={u.role} className="mt-0.5" />}
                </div>
                {canModerate(user.role) && u.userId !== user.id && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-muted rounded" aria-label="User actions"><MoreVertical className="h-3 w-3" /></button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {u.muted ? (
                        <DropdownMenuItem onClick={() => unmuteUser(u)}><Volume2 className="h-3.5 w-3.5 mr-2" />Unmute</DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={() => muteUser(u)} className="text-destructive"><VolumeX className="h-3.5 w-3.5 mr-2" />Mute</DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            ))}
            {presence.length === 0 && <p className="text-xs text-muted-foreground px-2 py-4 text-center">No one online</p>}
          </div>
        </ScrollArea>
      </aside>
    </div>
  )
}

function MessageRow({ m, currentUser, onDelete, onEdit }: { m: ChatMessage; currentUser: SafeUser; onDelete: (m: ChatMessage) => void; onEdit: (m: ChatMessage) => void }) {
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(m.content)
  const own = m.userId === currentUser.id
  const role = (m.role || "MEMBER") as Role
  const name = m.displayName || m.username

  if (m.deleted) {
    return (
      <div className="flex gap-2.5 opacity-50">
        <div className="h-8 w-8 shrink-0" />
        <p className="text-xs italic text-muted-foreground pt-2">Message deleted by owner</p>
      </div>
    )
  }

  return (
    <div className="flex gap-2.5 group">
      <AvatarWithDeco src={m.pfpUrl} name={name} role={role} size="sm" className="mt-0.5" />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <DisplayName name={name} role={role} className="text-sm font-semibold" />
          <RoleBadge role={role} />
          <span className="text-[10px] text-muted-foreground">{new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
          {m.edited && <span className="text-[10px] text-muted-foreground italic">(edited)</span>}
          <div className="ml-auto flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {own && !editing && (
              <button onClick={() => { setEditing(true); setEditText(m.content) }} className="text-muted-foreground hover:text-pink-500" aria-label="Edit message">
                <Pencil className="h-3 w-3" />
              </button>
            )}
            {canDelete(currentUser.role) && !own && (
              <button onClick={() => onDelete(m)} className="text-muted-foreground hover:text-destructive" aria-label="Delete message">
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
        {editing ? (
          <div className="flex gap-1.5 mt-0.5">
            <Input value={editText} onChange={(e) => setEditText(e.target.value)} onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); onEdit({ ...m, content: editText }); setEditing(false) }
              if (e.key === "Escape") { setEditing(false); setEditText(m.content) }
            }} className="h-7 text-sm flex-1" autoFocus />
            <Button size="sm" className="h-7 px-2 bg-pink-500 hover:bg-pink-600 text-white" onClick={() => { onEdit({ ...m, content: editText }); setEditing(false) }}>Save</Button>
            <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => { setEditing(false); setEditText(m.content) }}>Cancel</Button>
          </div>
        ) : (
          <p className="text-sm text-foreground/90 break-words whitespace-pre-wrap">{m.content}</p>
        )}
      </div>
    </div>
  )
}
