"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { io, type Socket } from "socket.io-client"
import { api, type Channel, type ChatMessage, type SafeUser } from "@/lib/api"
import { useAuth } from "@/hooks/use-auth"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Crown, Hash, Plus, Send, Loader2, Users } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

type PresenceUser = {
  userId: string
  username: string
  displayName: string
  pfpUrl: string | null
  isOwner: boolean
}

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
  const scrollRef = useRef<HTMLDivElement>(null)

  // Load channels
  const loadChannels = useCallback(async () => {
    try {
      const { channels } = await api.listChannels()
      setChannels(channels)
      if (channels.length > 0 && !activeChannel) {
        setActiveChannel(channels[0].id)
      }
    } catch (e) {
      toast.error("Failed to load channels")
    } finally {
      setLoadingChannels(false)
    }
  }, [activeChannel])

  useEffect(() => {
    loadChannels()
  }, [loadChannels])

  // Connect socket once.
  // - Sandbox (Caddy gateway): uses "/?XTransformPort=3001" via the gateway.
  // - Replit / standard host: set NEXT_PUBLIC_SOCKET_URL (e.g. "/socket.io")
  //   so the custom server (server.ts) serves socket.io on the same origin.
  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || ""
    const s = socketUrl
      ? io(socketUrl, {
          transports: ["websocket", "polling"],
          reconnection: true,
          reconnectionAttempts: Infinity,
          reconnectionDelay: 1000,
        })
      : io("/?XTransformPort=3001", {
          transports: ["websocket", "polling"],
          reconnection: true,
          reconnectionAttempts: Infinity,
          reconnectionDelay: 1000,
        })
    setSocket(s)

    s.on("connect", () => setConnected(true))
    s.on("disconnect", () => setConnected(false))
    s.on("connect_error", (err) => {
      console.error("[chat] connect error", err.message)
      setConnected(false)
    })

    return () => {
      s.disconnect()
    }
  }, [])

  // When channel changes, join it
  useEffect(() => {
    if (!socket || !activeChannel || !connected) return
    setMessages([])
    setPresence([])
    socket.emit("join-channel", { channelId: activeChannel })

    socket.on("message-history", (data: { channelId: string; messages: ChatMessage[] }) => {
      if (data.channelId === activeChannel) {
        setMessages(data.messages)
      }
    })
    socket.on("message", (msg: ChatMessage) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev
        return [...prev, msg]
      })
    })
    socket.on("presence", (data: { channelId: string; users: PresenceUser[] }) => {
      if (data.channelId === activeChannel) setPresence(data.users)
    })

    return () => {
      socket.emit("leave-channel", { channelId: activeChannel })
      socket.off("message-history")
      socket.off("message")
      socket.off("presence")
    }
  }, [socket, activeChannel, connected])

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages])

  const send = () => {
    const text = draft.trim()
    if (!text || !socket || !connected || !activeChannel) return
    socket.emit("send-message", { channelId: activeChannel, content: text })
    setDraft("")
  }

  const createChannel = async () => {
    const name = newChannel.trim()
    if (!name) return
    try {
      const { channel } = await api.createChannel(name)
      setChannels((prev) => [...prev, channel])
      setActiveChannel(channel.id)
      setNewChannel("")
      setShowNewChannel(false)
      toast.success(`Channel #${channel.name} created`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed")
    }
  }

  if (!user) return null

  const activeName = channels.find((c) => c.id === activeChannel)?.name || "general"

  return (
    <div className="h-[calc(100vh-3.5rem-2rem)] flex">
      {/* Channel list */}
      <aside className="w-52 shrink-0 border-r border-border bg-background flex flex-col">
        <div className="h-11 px-3 flex items-center justify-between border-b border-border">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Channels</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setShowNewChannel((v) => !v)}
            aria-label="New channel"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
        {showNewChannel && (
          <div className="p-2 border-b border-border flex gap-1.5">
            <Input
              value={newChannel}
              onChange={(e) => setNewChannel(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createChannel()}
              placeholder="new-channel"
              className="h-8 text-sm"
              autoFocus
            />
            <Button size="sm" className="h-8 px-2 bg-emerald-500 hover:bg-emerald-600 text-white" onClick={createChannel}>
              Add
            </Button>
          </div>
        )}
        <ScrollArea className="flex-1">
          <div className="p-1.5 space-y-0.5">
            {loadingChannels ? (
              <div className="p-2 flex justify-center">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : (
              channels.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveChannel(c.id)}
                  className={cn(
                    "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors",
                    activeChannel === c.id ? "bg-emerald-500/10 text-emerald-600" : "hover:bg-accent text-muted-foreground"
                  )}
                >
                  <Hash className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{c.name}</span>
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </aside>

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Channel header */}
        <div className="h-11 shrink-0 px-4 flex items-center justify-between border-b border-border">
          <div className="flex items-center gap-2 min-w-0">
            <Hash className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="font-semibold truncate">{activeName}</span>
            <span className={cn("ml-2 h-2 w-2 rounded-full", connected ? "bg-emerald-500" : "bg-red-500")} />
            <span className="text-xs text-muted-foreground">{connected ? "connected" : "reconnecting…"}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            <span>{presence.length}</span>
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scroll-smooth">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground">
              <Hash className="h-8 w-8 mb-2 opacity-40" />
              <p className="text-sm">No messages yet in #{activeName}</p>
              <p className="text-xs mt-1">Be the first to say something.</p>
            </div>
          )}
          {messages.map((m) => (
            <MessageRow key={m.id} m={m} currentUser={user} />
          ))}
        </div>

        {/* Composer */}
        <div className="shrink-0 p-3 border-t border-border">
          <div className="flex gap-2">
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  send()
                }
              }}
              placeholder={`Message #${activeName}`}
              disabled={!connected}
              className="flex-1"
            />
            <Button
              onClick={send}
              disabled={!connected || !draft.trim()}
              className="bg-emerald-500 hover:bg-emerald-600 text-white"
              size="icon"
              aria-label="Send"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Online users (real presence only) */}
      <aside className="w-48 shrink-0 border-l border-border bg-background hidden lg:flex flex-col">
        <div className="h-11 px-3 flex items-center border-b border-border">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Online — {presence.length}</span>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-1.5 space-y-0.5">
            {presence.map((u) => (
              <div key={u.userId} className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent">
                <div className="relative">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={u.pfpUrl || undefined} alt={u.displayName} />
                    <AvatarFallback className="text-[10px] bg-emerald-500/15 text-emerald-600">
                      {u.displayName.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-background" />
                </div>
                <span className="text-sm truncate flex-1">{u.displayName}</span>
                {u.isOwner && <Crown className="h-3 w-3 text-amber-500 shrink-0" />}
              </div>
            ))}
            {presence.length === 0 && (
              <p className="text-xs text-muted-foreground px-2 py-4 text-center">No one online</p>
            )}
          </div>
        </ScrollArea>
      </aside>
    </div>
  )
}

function MessageRow({ m, currentUser }: { m: ChatMessage; currentUser: SafeUser }) {
  const own = m.userId === currentUser.id
  const name = m.displayName || m.username
  return (
    <div className="flex gap-2.5 group">
      <Avatar className="h-8 w-8 shrink-0 mt-0.5">
        <AvatarImage src={m.pfpUrl || undefined} alt={name} />
        <AvatarFallback className="text-xs bg-muted">
          {name.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className={cn("text-sm font-semibold", own ? "text-emerald-600" : "text-foreground")}>{name}</span>
          <span className="text-[10px] text-muted-foreground">
            {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
        <p className="text-sm text-foreground/90 break-words whitespace-pre-wrap">{m.content}</p>
      </div>
    </div>
  )
}
