"use client"

import * as React from "react"
import { Fragment, useCallback, useEffect, useRef, useState } from "react"
import { io, type Socket } from "socket.io-client"
import { api, type Channel, type ChatMessage, type SafeUser, type Role } from "@/lib/api"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Hash, Plus, Send, Loader2, Users, MoreVertical, Trash2, VolumeX, Volume2,
  Pencil, Image as ImageIcon, Quote,
} from "lucide-react"
import ReactMarkdown, { type Components } from "react-markdown"
import remarkGfm from "remark-gfm"
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

type DmInfo = { id: string; otherId: string; otherName: string }

type GifResult = { id: string; url: string; title: string }

function canModerate(role: Role) { return role === "OWNER" || role === "ADMIN" || role === "MOD" }
function canDelete(role: Role) { return role === "OWNER" }

/* ----------------------------- Sound (Web Audio) ---------------------------- */

const SOUND_KEY = "synnical-chat-sound"

let audioCtx: AudioContext | null = null
function getAudioCtx(): AudioContext | null {
  if (typeof window === "undefined") return null
  if (!audioCtx) {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (Ctor) audioCtx = new Ctor()
  }
  return audioCtx
}

function playMessageSound() {
  const ctx = getAudioCtx()
  if (!ctx) return
  if (ctx.state === "suspended") ctx.resume().catch(() => { /* ignore */ })
  const now = ctx.currentTime
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.type = "sine"
  osc.frequency.setValueAtTime(880, now)
  osc.frequency.exponentialRampToValueAtTime(660, now + 0.08)
  gain.gain.setValueAtTime(0.0001, now)
  gain.gain.exponentialRampToValueAtTime(0.12, now + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.11)
  osc.start(now)
  osc.stop(now + 0.12)
}

/* ------------------------------ Mention pills ------------------------------ */

function MentionPill({ name, onClick }: { name: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="bg-pink-500/20 text-pink-400 px-1 rounded hover:bg-pink-500/30 transition-colors inline"
    >
      @{name}
    </button>
  )
}

/** Recursively walk a ReactNode tree and replace `@username` strings with pills. */
function processMentions(node: React.ReactNode, onMention: (name: string) => void): React.ReactNode {
  const handle = (n: React.ReactNode, keyPrefix: string): React.ReactNode => {
    if (typeof n === "string") {
      const parts = n.split(/(@[a-zA-Z0-9_]+)/g)
      if (parts.length === 1) return n
      return parts.map((part, i) => {
        const k = `${keyPrefix}-${i}`
        if (part.startsWith("@") && part.length > 1) {
          return <MentionPill key={k} name={part.slice(1)} onClick={() => onMention(part.slice(1))} />
        }
        return <Fragment key={k}>{part || null}</Fragment>
      })
    }
    if (Array.isArray(n)) {
      return n.map((child, i) => (
        <Fragment key={`${keyPrefix}-a-${i}`}>{handle(child, `${keyPrefix}-a-${i}`)}</Fragment>
      ))
    }
    if (React.isValidElement(n)) {
      const tag = n.type
      // Don't recurse into links/code — preserve verbatim
      if (tag === "a" || tag === "code") return n
      const childProps = (n.props || {}) as { children?: React.ReactNode }
      const newChildren = handle(childProps.children, `${keyPrefix}-c`)
      return React.cloneElement(n, {}, newChildren)
    }
    return n
  }
  return handle(node, "root")
}

/* -------------------------------- Chat panel ------------------------------- */

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

  // New feature state
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [gifPickerOpen, setGifPickerOpen] = useState(false)
  const [gifQuery, setGifQuery] = useState("")
  const [gifResults, setGifResults] = useState<GifResult[]>([])
  const [gifLoading, setGifLoading] = useState(false)
  const [dmChannels, setDmChannels] = useState<DmInfo[]>([])

  const scrollRef = useRef<HTMLDivElement>(null)
  // Refs that hold the latest values, so socket listeners (registered once per
  // active-channel change) always see fresh data without re-subscribing.
  const soundRef = useRef(soundEnabled)
  useEffect(() => { soundRef.current = soundEnabled }, [soundEnabled])
  const dmRef = useRef(dmChannels)
  useEffect(() => { dmRef.current = dmChannels }, [dmChannels])
  const activeChannelRef = useRef(activeChannel)
  useEffect(() => { activeChannelRef.current = activeChannel }, [activeChannel])
  const userIdRef = useRef<string | null>(user?.id ?? null)
  useEffect(() => { userIdRef.current = user?.id ?? null }, [user])

  // Load sound preference from localStorage (client-only)
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(SOUND_KEY)
      if (stored !== null) setSoundEnabled(stored === "1")
    } catch { /* ignore */ }
  }, [])

  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const next = !prev
      try { window.localStorage.setItem(SOUND_KEY, next ? "1" : "0") } catch { /* ignore */ }
      if (next) playMessageSound()
      return next
    })
  }, [])

  const loadChannels = useCallback(async () => {
    try {
      const { channels } = await api.listChannels()
      setChannels(channels)
      if (channels.length > 0 && !activeChannel) setActiveChannel(channels[0].id)
    } catch { toast.error("Failed to load channels") }
    finally { setLoadingChannels(false) }
  }, [activeChannel])

  useEffect(() => { loadChannels() }, [loadChannels])

  // Establish socket connection
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

  // After connecting, fetch the user's DM channels and silently join each so
  // we receive "message" events for them (used for DM notifications + sound).
  useEffect(() => {
    if (!socket || !connected || !user) return
    let cancelled = false
    api.listDMs().then(({ dms }) => {
      if (cancelled) return
      const mapped: DmInfo[] = dms.map((d) => ({
        id: d.id,
        otherId: d.other.id,
        otherName: d.other.displayName || d.other.username,
      }))
      setDmChannels(mapped)
      dmRef.current = mapped
      // Silently join each DM channel so we receive its messages
      for (const d of mapped) socket.emit("join-channel", { channelId: d.id })
    }).catch(() => { /* ignore — non-critical */ })
    return () => { cancelled = true }
  }, [socket, connected, user])

  // Join the active channel and bind its event handlers
  useEffect(() => {
    if (!socket || !activeChannel || !connected) return
    setMessages([])
    setPresence([])
    socket.emit("join-channel", { channelId: activeChannel })

    socket.on("message-history", (data: { channelId: string; messages: ChatMessage[] }) => {
      if (data.channelId === activeChannel) setMessages(data.messages)
    })

    socket.on("message", (msg: ChatMessage) => {
      const myId = userIdRef.current
      const fromSelf = !!myId && msg.userId === myId
      const active = activeChannelRef.current
      // Append to active channel view only if it belongs to the active channel
      if (msg.channelId === active) {
        setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]))
      }
      // DM notification: message arrived in a DM channel we're not currently viewing
      if (msg.channelId !== active && !fromSelf) {
        const dm = dmRef.current.find((d) => d.id === msg.channelId)
        if (dm) {
          const senderName = msg.displayName || msg.username
          const preview = msg.content
            ? msg.content.length > 80 ? msg.content.slice(0, 80) + "…" : msg.content
            : msg.gifUrl ? "[GIF]" : ""
          toast(`${senderName} → ${dm.otherName}: ${preview}`, {
            description: "Direct message",
          })
        }
      }
      // Sound for any non-self message
      if (!fromSelf && soundRef.current) {
        playMessageSound()
      }
    })

    socket.on("message-deleted", (data: { id: string; channelId: string }) => {
      if (data.channelId !== active) return
      setMessages((prev) => prev.map((m) => (m.id === data.id ? { ...m, deleted: true, content: "" } : m)))
    })

    socket.on("message-edited", (data: { id: string; channelId: string; content: string; editedAt: string }) => {
      if (data.channelId !== active) return
      setMessages((prev) => prev.map((m) => (m.id === data.id ? { ...m, content: data.content, edited: true } : m)))
    })

    socket.on("typing", (data: { channelId: string; userId: string; username: string; isTyping: boolean }) => {
      if (data.channelId !== active) return
      setTypingUsers((prev) => {
        const next = isTyping
          ? [...prev.filter((u) => u.userId !== data.userId), { userId: data.userId, username: data.username }]
          : prev.filter((u) => u.userId !== data.userId)
        return next
      })
      if (isTyping) {
        setTimeout(() => {
          setTypingUsers((prev) => prev.filter((u) => u.userId !== data.userId))
        }, 3000)
      }
    })

    socket.on("presence", (data: { channelId: string; users: PresenceUser[] }) => {
      if (data.channelId === active) setPresence(data.users)
    })

    return () => {
      socket.emit("leave-channel", { channelId: activeChannel })
      socket.off("message-history")
      socket.off("message")
      socket.off("message-deleted")
      socket.off("message-edited")
      socket.off("typing")
      socket.off("presence")
    }
  }, [socket, activeChannel, connected])

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages])

  // Debounced GIF search against Giphy public beta key
  useEffect(() => {
    const q = gifQuery.trim()
    if (!q) { setGifResults([]); setGifLoading(false); return }
    setGifLoading(true)
    const t = setTimeout(() => {
      fetch(`https://api.giphy.com/v1/gifs/search?api_key=dc6zaTOxFJmzC&q=${encodeURIComponent(q)}&limit=20`)
        .then((r) => r.json())
        .then((json: { data?: Array<{ id: string; title?: string; images?: { fixed_height_small?: { url: string } } }> }) => {
          const results: GifResult[] = (json.data || [])
            .filter((g) => g.images?.fixed_height_small?.url)
            .map((g) => ({ id: g.id, url: g.images!.fixed_height_small!.url, title: g.title || "gif" }))
          setGifResults(results)
        })
        .catch(() => { setGifResults([]) })
        .finally(() => setGifLoading(false))
    }, 400)
    return () => clearTimeout(t)
  }, [gifQuery])

  /* ----------------------------- Send / edit / etc ----------------------------- */

  const send = useCallback((gifUrl?: string) => {
    const text = draft.trim()
    if (!text && !gifUrl) return
    if (!socket || !connected || !activeChannel) return
    const payload: { channelId: string; content: string; gifUrl?: string } = {
      channelId: activeChannel,
      content: text,
    }
    if (gifUrl) payload.gifUrl = gifUrl
    socket.emit("send-message", payload)
    socket.emit("typing", { channelId: activeChannel, isTyping: false })
    setDraft("")
  }, [draft, socket, connected, activeChannel])

  const onDraftChange = useCallback((v: string) => {
    setDraft(v)
    if (socket && connected && activeChannel) {
      socket.emit("typing", { channelId: activeChannel, isTyping: v.length > 0 })
    }
  }, [socket, connected, activeChannel])

  // @mention autocomplete — show when draft ends with `@<partial>`
  const mentionCandidates = React.useMemo<PresenceUser[]>(() => {
    const match = draft.match(/@([a-zA-Z0-9_]*)$/)
    if (!match) return []
    const q = match[1].toLowerCase()
    const seen = new Set<string>()
    const out: PresenceUser[] = []
    for (const u of presence) {
      if (u.userId === user?.id) continue
      if (q === "" || u.username.toLowerCase().includes(q) || u.displayName.toLowerCase().includes(q)) {
        if (seen.has(u.userId)) continue
        seen.add(u.userId)
        out.push(u)
        if (out.length >= 6) break
      }
    }
    return out
  }, [draft, presence, user?.id])

  const showMentionDropdown = mentionCandidates.length > 0

  const insertMention = useCallback((username: string) => {
    setDraft((prev) => prev.replace(/@([a-zA-Z0-9_]*)$/, `@${username} `))
  }, [])

  const startEdit = (m: ChatMessage) => { setEditingId(m.id); setEditContent(m.content) }
  const cancelEdit = () => { setEditingId(null); setEditContent("") }

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
      setPresence((prev) => prev.map((p) => (p.userId === u.userId ? { ...p, muted: true } : p)))
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed") }
  }

  const unmuteUser = async (u: PresenceUser) => {
    try {
      await api.unmuteUser(u.userId)
      toast.success(`${u.displayName} unmuted`)
      setPresence((prev) => prev.map((p) => (p.userId === u.userId ? { ...p, muted: false } : p)))
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed") }
  }

  // Click-to-DM: open a DM channel with the given user
  const openDM = useCallback(async (userId: string, name: string) => {
    if (!user || userId === user.id) return
    try {
      await api.createDM(userId)
      toast.success(`DM opened with ${name}`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to open DM")
    }
  }, [user])

  // @mention pill click → resolve username → openDM
  const handleMentionClick = useCallback((name: string) => {
    const match = presence.find((p) => p.username.toLowerCase() === name.toLowerCase())
    if (match) {
      void openDM(match.userId, match.displayName || match.username)
    } else {
      toast(`@${name} is not in this channel`)
    }
  }, [presence, openDM])

  const saveQuote = useCallback(async (m: ChatMessage) => {
    const authorName = m.displayName || m.username
    try {
      await api.saveQuote(authorName, m.content, m.pfpUrl ?? undefined)
      toast.success("Quote saved")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save quote")
    }
  }, [])

  if (!user) return null
  const activeName = channels.find((c) => c.id === activeChannel)?.name || "general"

  return (
    <div className="h-full flex">
      {/* Channel list */}
      <aside className="w-52 shrink-0 border-r border-[#2a2a2a] bg-[#0a0a0a] flex flex-col">
        <div className="h-11 px-3 flex items-center justify-between border-b border-[#2a2a2a]">
          <span className="text-xs font-semibold uppercase tracking-wide text-[#888888]">Channels</span>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowNewChannel((v) => !v)} aria-label="New channel">
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
        {showNewChannel && (
          <div className="p-2 border-b border-[#2a2a2a] flex gap-1.5">
            <Input value={newChannel} onChange={(e) => setNewChannel(e.target.value)} onKeyDown={(e) => e.key === "Enter" && createChannel()} placeholder="new-channel" className="h-8 text-sm" autoFocus />
            <Button size="sm" className="h-8 px-2 bg-pink-500 hover:bg-pink-600 text-white" onClick={createChannel}>Add</Button>
          </div>
        )}
        <ScrollArea className="flex-1">
          <div className="p-1.5 space-y-0.5">
            {loadingChannels ? <div className="p-2 flex justify-center"><Loader2 className="h-4 w-4 animate-spin text-[#888888]" /></div> :
              channels.map((c) => (
                <button key={c.id} onClick={() => setActiveChannel(c.id)} className={cn("w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors", activeChannel === c.id ? "bg-pink-500/10 text-pink-600" : "hover:bg-[#1a1a1a] text-[#888888]")}>
                  <Hash className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{c.name}</span>
                </button>
              ))
            }
          </div>
        </ScrollArea>
      </aside>

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="h-11 shrink-0 px-4 flex items-center justify-between border-b border-[#2a2a2a]">
          <div className="flex items-center gap-2 min-w-0">
            <Hash className="h-4 w-4 text-[#888888] shrink-0" />
            <span className="font-semibold truncate">{activeName}</span>
            <span className={cn("ml-2 h-2 w-2 rounded-full", connected ? "bg-pink-500" : "bg-red-500")} />
            <span className="text-xs text-[#888888]">{connected ? "connected" : "reconnecting…"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={toggleSound}
              aria-label={soundEnabled ? "Mute notification sound" : "Unmute notification sound"}
              title={soundEnabled ? "Sound on" : "Sound off"}
            >
              {soundEnabled ? <Volume2 className="h-4 w-4 text-pink-500" /> : <VolumeX className="h-4 w-4 text-[#888888]" />}
            </Button>
            <div className="flex items-center gap-1.5 text-xs text-[#888888]">
              <Users className="h-3.5 w-3.5" /><span>{presence.length}</span>
            </div>
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scroll px-4 py-4 space-y-3">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center text-[#888888]">
              <Hash className="h-8 w-8 mb-2 opacity-40" />
              <p className="text-sm">No messages yet in #{activeName}</p>
            </div>
          )}
          {messages.map((m) => (
            <MessageRow
              key={m.id}
              m={m}
              currentUser={user}
              editing={editingId === m.id}
              editContent={editContent}
              onEditContentChange={setEditContent}
              onStartEdit={startEdit}
              onCancelEdit={cancelEdit}
              onSaveEdit={saveEdit}
              onDelete={deleteMessage}
              onQuote={saveQuote}
              onOpenDM={openDM}
              onMention={handleMentionClick}
            />
          ))}
        </div>

        <div className="shrink-0 p-3 border-t border-[#2a2a2a] relative">
          {typingUsers.length > 0 && (
            <p className="text-xs text-[#888888] mb-1.5 italic">
              {typingUsers.length === 1 ? `${typingUsers[0].username} is typing…` : `${typingUsers.length} users are typing…`}
            </p>
          )}

          {/* @mention autocomplete dropdown */}
          {showMentionDropdown && (
            <div className="absolute bottom-full left-3 mb-1 z-20 w-64 rounded-md border border-[#2a2a2a] bg-[#1a1a1a] shadow-md overflow-hidden">
              <p className="px-2 py-1.5 text-[10px] uppercase tracking-wide text-[#888888] border-b border-[#2a2a2a]">
                Mention — online in #{activeName}
              </p>
              <div className="max-h-56 overflow-y-auto custom-scroll">
                {mentionCandidates.map((u) => (
                  <button
                    key={u.userId}
                    type="button"
                    onClick={() => insertMention(u.username)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 hover:bg-pink-500/10 text-left"
                  >
                    <AvatarWithDeco src={u.pfpUrl} name={u.displayName} role={u.role} avatarDeco={u.avatarDeco} isGif={u.pfpIsGif} size="xs" />
                    <div className="min-w-0">
                      <DisplayName name={u.displayName} role={u.role} className="text-sm truncate block" />
                      <span className="text-[10px] text-[#888888]">@{u.username}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 items-center">
            <Input
              value={draft}
              onChange={(e) => onDraftChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  if (!showMentionDropdown) send()
                }
              }}
              placeholder={`Message #${activeName}`}
              disabled={!connected}
              className="flex-1"
            />

            {/* GIF picker */}
            <Popover open={gifPickerOpen} onOpenChange={(o) => { setGifPickerOpen(o); if (!o) { setGifQuery(""); setGifResults([]) } }}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  disabled={!connected}
                  aria-label="Pick a GIF"
                  title="Pick a GIF"
                  className="border-[#2a2a2a]"
                >
                  <ImageIcon className="h-4 w-4 text-pink-500" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 p-2 bg-[#1a1a1a] border-[#2a2a2a]">
                <Input
                  placeholder="Search GIFs on Giphy…"
                  value={gifQuery}
                  onChange={(e) => setGifQuery(e.target.value)}
                  className="h-8 mb-2"
                  autoFocus
                />
                <div className="max-h-80 overflow-y-auto custom-scroll">
                  {gifLoading && (
                    <div className="flex justify-center p-4"><Loader2 className="h-4 w-4 animate-spin text-pink-500" /></div>
                  )}
                  {!gifLoading && gifResults.length === 0 && (
                    <p className="text-xs text-[#888888] text-center p-6">
                      {gifQuery.trim() ? "No GIFs found" : "Type to search Giphy"}
                    </p>
                  )}
                  <div className="grid grid-cols-2 gap-1.5">
                    {gifResults.map((g) => (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => { void send(g.url); setGifPickerOpen(false); setGifQuery(""); setGifResults([]) }}
                        className="relative rounded-md overflow-hidden hover:ring-2 hover:ring-pink-500 transition-shadow"
                        title={g.title}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={g.url} alt={g.title} className="w-full h-24 object-cover" loading="lazy" />
                      </button>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <Button
              onClick={() => send()}
              disabled={!connected || (!draft.trim())}
              className="bg-pink-500 hover:bg-pink-600 text-white"
              size="icon"
              aria-label="Send"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Online users */}
      <aside className="w-48 shrink-0 border-l border-[#2a2a2a] bg-[#0a0a0a] hidden lg:flex flex-col">
        <div className="h-11 px-3 flex items-center border-b border-[#2a2a2a]">
          <span className="text-xs font-semibold uppercase tracking-wide text-[#888888]">Online — {presence.length}</span>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-1.5 space-y-0.5">
            {presence.map((u) => (
              <div key={u.userId} className="group flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-[#1a1a1a]">
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
                      <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[#1a1a1a] rounded" aria-label="User actions"><MoreVertical className="h-3 w-3" /></button>
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
            {presence.length === 0 && <p className="text-xs text-[#888888] px-2 py-4 text-center">No one online</p>}
          </div>
        </ScrollArea>
      </aside>
    </div>
  )
}

/* ------------------------------- MessageRow ------------------------------- */

type MessageRowProps = {
  m: ChatMessage
  currentUser: SafeUser
  editing: boolean
  editContent: string
  onEditContentChange: (v: string) => void
  onStartEdit: (m: ChatMessage) => void
  onCancelEdit: () => void
  onSaveEdit: (m: ChatMessage) => void
  onDelete: (m: ChatMessage) => void
  onQuote: (m: ChatMessage) => void
  onOpenDM: (userId: string, name: string) => void
  onMention: (name: string) => void
}

function MessageRow({
  m, currentUser, editing, editContent, onEditContentChange,
  onStartEdit, onCancelEdit, onSaveEdit, onDelete, onQuote, onOpenDM, onMention,
}: MessageRowProps) {
  const own = m.userId === currentUser.id
  const role = (m.role || "MEMBER") as Role
  const name = m.displayName || m.username

  const markdownComponents: Components = {
    a: ({ node: _node, ...props }) => (
      <a {...props} target="_blank" rel="noreferrer" className="text-pink-400 underline hover:text-pink-300" />
    ),
    p: ({ node: _node, children }) => (
      <p className="text-sm text-[#f0f0f0]/90 break-words whitespace-pre-wrap leading-relaxed">
        {processMentions(children, onMention)}
      </p>
    ),
    strong: ({ node: _node, children }) => (
      <strong className="font-semibold text-[#f0f0f0]">{processMentions(children, onMention)}</strong>
    ),
    em: ({ node: _node, children }) => (
      <em className="italic">{processMentions(children, onMention)}</em>
    ),
    del: ({ node: _node, children }) => (
      <del className="line-through opacity-70">{processMentions(children, onMention)}</del>
    ),
    code: ({ node: _node, ...props }) => (
      <code {...props} className="bg-[#1a1a1a] px-1 py-0.5 rounded text-xs font-mono text-pink-300" />
    ),
    pre: ({ node: _node, ...props }) => (
      <pre {...props} className="bg-[#1a1a1a] p-2 rounded text-xs font-mono overflow-x-auto my-1" />
    ),
    ul: ({ node: _node, ...props }) => <ul {...props} className="list-disc pl-4 text-sm" />,
    ol: ({ node: _node, ...props }) => <ol {...props} className="list-decimal pl-4 text-sm" />,
  }

  if (m.deleted) {
    return (
      <div className="flex gap-2.5 opacity-50">
        <div className="h-8 w-8 shrink-0" />
        <p className="text-xs italic text-[#888888] pt-2">Message deleted by owner</p>
      </div>
    )
  }

  const handleAvatarClick = () => {
    if (own || !m.userId) return
    onOpenDM(m.userId, name)
  }

  return (
    <div className="flex gap-2.5 group">
      <button
        type="button"
        onClick={handleAvatarClick}
        disabled={own || !m.userId}
        className={cn("mt-0.5 shrink-0 rounded-full", !own && m.userId ? "cursor-pointer hover:ring-2 hover:ring-pink-500/40 transition" : "cursor-default")}
        title={own ? "You" : m.userId ? `Open DM with ${name}` : undefined}
        aria-label={own ? "Your avatar" : m.userId ? `Open DM with ${name}` : "Avatar"}
      >
        <AvatarWithDeco src={m.pfpUrl} name={name} role={role} size="sm" />
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <button
            type="button"
            onClick={handleAvatarClick}
            disabled={own || !m.userId}
            className={cn(!own && m.userId ? "cursor-pointer hover:underline" : "cursor-default")}
            title={own ? undefined : m.userId ? `Open DM with ${name}` : undefined}
          >
            <DisplayName name={name} role={role} className="text-sm font-semibold" />
          </button>
          <RoleBadge role={role} />
          <span className="text-[10px] text-[#888888]">
            {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
          {m.edited && <span className="text-[10px] text-[#888888] italic">(edited)</span>}
          <div className="ml-auto flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={() => onQuote(m)}
              className="text-[#888888] hover:text-pink-500 p-1"
              aria-label="Save as quote"
              title="Save as quote"
            >
              <Quote className="h-3 w-3" />
            </button>
            {own && !editing && (
              <button
                type="button"
                onClick={() => onStartEdit(m)}
                className="text-[#888888] hover:text-pink-500 p-1"
                aria-label="Edit message"
                title="Edit"
              >
                <Pencil className="h-3 w-3" />
              </button>
            )}
            {canDelete(currentUser.role) && !own && (
              <button
                type="button"
                onClick={() => onDelete(m)}
                className="text-[#888888] hover:text-destructive p-1"
                aria-label="Delete message"
                title="Delete"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
        {editing ? (
          <div className="flex gap-1.5 mt-0.5">
            <Input
              value={editContent}
              onChange={(e) => onEditContentChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") { e.preventDefault(); onSaveEdit({ ...m, content: editContent }) }
                if (e.key === "Escape") { onCancelEdit() }
              }}
              className="h-7 text-sm flex-1"
              autoFocus
            />
            <Button size="sm" className="h-7 px-2 bg-pink-500 hover:bg-pink-600 text-white" onClick={() => onSaveEdit({ ...m, content: editContent })}>Save</Button>
            <Button size="sm" variant="ghost" className="h-7 px-2" onClick={onCancelEdit}>Cancel</Button>
          </div>
        ) : (
          <div className="space-y-1">
            {m.content && (
              <div className="prose-sm max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                  {m.content}
                </ReactMarkdown>
              </div>
            )}
            {m.gifUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={m.gifUrl}
                alt="GIF message"
                className="mt-1 rounded-md max-h-48 max-w-full border border-[#2a2a2a] object-contain"
                loading="lazy"
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
