"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { io, type Socket } from "socket.io-client"
import { api, type SafeUser, type DM, type ChatMessage, type Role } from "@/lib/api"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Users, UserPlus, Send, Check, X, MessageSquare, ArrowLeft, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { DisplayName, RoleBadge, AvatarWithDeco } from "@/components/role-ui"

export function FriendsPanel() {
  const { user, setUser } = useAuth()
  const [tab, setTab] = useState<"friends" | "requests" | "add">("friends")
  const [friends, setFriends] = useState<SafeUser[]>([])
  const [incoming, setIncoming] = useState<SafeUser[]>([])
  const [outgoing, setOutgoing] = useState<SafeUser[]>([])
  const [dms, setDms] = useState<DM[]>([])
  const [addUsername, setAddUsername] = useState("")
  const [loading, setLoading] = useState(true)

  const loadAll = useCallback(async () => {
    try {
      const [f, d] = await Promise.all([api.listFriends(), api.listDMs()])
      setFriends(f.friends); setIncoming(f.incoming); setOutgoing(f.outgoing)
      setDms(d.dms)
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  const sendRequest = async () => {
    const u = addUsername.trim()
    if (!u) return
    try {
      await api.sendFriendRequest(u)
      toast.success(`Friend request sent to @${u}`)
      setAddUsername("")
      loadAll()
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed") }
  }

  const acceptReq = async (id: string) => {
    try { await api.acceptFriendRequest(id); toast.success("Friend added"); loadAll() }
    catch (e) { toast.error(e instanceof Error ? e.message : "Failed") }
  }
  const declineReq = async (id: string) => {
    try { await api.declineFriendRequest(id); loadAll() }
    catch (e) { toast.error(e instanceof Error ? e.message : "Failed") }
  }
  const removeFriend = async (id: string) => {
    try { await api.removeFriend(id); toast.success("Friend removed"); loadAll() }
    catch (e) { toast.error(e instanceof Error ? e.message : "Failed") }
  }

  const openDM = async (u: SafeUser) => {
    try {
      const { id } = await api.createDM(u.id)
      setDmChannelId(id)
      setDmOther(u)
      setTab("friends")
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed") }
  }

  const [dmChannelId, setDmChannelId] = useState<string | null>(null)
  const [dmOther, setDmOther] = useState<SafeUser | null>(null)

  if (!user) return null

  if (dmChannelId && dmOther) {
    return <DMConversation channelId={dmChannelId} other={dmOther} onBack={() => { setDmChannelId(null); setDmOther(null); loadAll() }} />
  }

  return (
    <div className="h-full flex flex-col">
      <div className="h-11 shrink-0 px-4 flex items-center gap-2 border-b border-border">
        <Users className="h-4 w-4 text-pink-500" />
        <span className="font-semibold">Friends</span>
        <div className="flex-1" />
        <div className="flex gap-1">
          <Button variant={tab === "friends" ? "secondary" : "ghost"} size="sm" className="h-7 text-xs" onClick={() => setTab("friends")}>Friends</Button>
          <Button variant={tab === "requests" ? "secondary" : "ghost"} size="sm" className="h-7 text-xs relative" onClick={() => setTab("requests")}>
            Requests {incoming.length > 0 && <span className="ml-1 bg-pink-500 text-white text-[9px] px-1.5 rounded-full">{incoming.length}</span>}
          </Button>
          <Button variant={tab === "add" ? "secondary" : "ghost"} size="sm" className="h-7 text-xs" onClick={() => setTab("add")}><UserPlus className="h-3.5 w-3.5" /></Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scroll">
        {loading ? <div className="p-4 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div> :
          tab === "add" ? (
            <div className="p-4 max-w-md">
              <h3 className="text-sm font-semibold mb-2">Add a friend</h3>
              <p className="text-xs text-muted-foreground mb-3">Enter their username to send a friend request.</p>
              <div className="flex gap-2">
                <Input value={addUsername} onChange={(e) => setAddUsername(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendRequest()} placeholder="username" autoFocus />
                <Button onClick={sendRequest} disabled={!addUsername.trim()} className="bg-pink-500 hover:bg-pink-600 text-white">Send</Button>
              </div>
              {outgoing.length > 0 && (
                <div className="mt-6">
                  <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">Pending requests sent</p>
                  {outgoing.map((u) => (
                    <div key={u.id} className="flex items-center gap-2 py-2">
                      <AvatarWithDeco src={u.pfpUrl} name={u.displayName} role={u.role} avatarDeco={u.avatarDeco} size="sm" />
                      <div className="flex-1 min-w-0"><DisplayName name={u.displayName} role={u.role} className="text-sm" /><p className="text-xs text-muted-foreground">@{u.username}</p></div>
                      <span className="text-xs text-muted-foreground">Pending</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : tab === "requests" ? (
            <div className="p-4">
              {incoming.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">No incoming requests</p> :
                incoming.map((u) => (
                  <div key={u.id} className="flex items-center gap-2 py-2 border-b border-border last:border-0">
                    <AvatarWithDeco src={u.pfpUrl} name={u.displayName} role={u.role} avatarDeco={u.avatarDeco} size="sm" />
                    <div className="flex-1 min-w-0"><DisplayName name={u.displayName} role={u.role} className="text-sm" /><p className="text-xs text-muted-foreground">@{u.username}</p></div>
                    <Button size="sm" className="h-7 bg-pink-500 hover:bg-pink-600 text-white" onClick={() => acceptReq(u.id)}><Check className="h-3.5 w-3.5" /></Button>
                    <Button size="sm" variant="ghost" className="h-7" onClick={() => declineReq(u.id)}><X className="h-3.5 w-3.5" /></Button>
                  </div>
                ))
              }
            </div>
          ) : (
            <div className="p-2">
              {friends.length === 0 && dms.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-10 w-10 mx-auto mb-2 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">No friends yet. Click + to add one.</p>
                </div>
              ) : (
                <>
                  {dms.length > 0 && (
                    <div className="mb-2">
                      <p className="text-xs font-semibold uppercase text-muted-foreground px-2 py-1">Direct Messages</p>
                      {dms.map((dm) => (
                        <button key={dm.id} onClick={() => { setDmChannelId(dm.id); setDmOther(dm.other) }} className="w-full flex items-center gap-2 px-2 py-2 rounded-md hover:bg-accent text-left">
                          <div className="relative"><AvatarWithDeco src={dm.other.pfpUrl} name={dm.other.displayName} role={dm.other.role} avatarDeco={dm.other.avatarDeco} size="sm" /></div>
                          <div className="flex-1 min-w-0"><DisplayName name={dm.other.displayName} role={dm.other.role} className="text-sm" />{dm.lastMessage && <p className="text-xs text-muted-foreground truncate">{dm.lastMessage.content}</p>}</div>
                        </button>
                      ))}
                    </div>
                  )}
                  <p className="text-xs font-semibold uppercase text-muted-foreground px-2 py-1">All Friends — {friends.length}</p>
                  {friends.map((u) => (
                    <div key={u.id} className="group flex items-center gap-2 px-2 py-2 rounded-md hover:bg-accent">
                      <AvatarWithDeco src={u.pfpUrl} name={u.displayName} role={u.role} avatarDeco={u.avatarDeco} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5"><DisplayName name={u.displayName} role={u.role} className="text-sm" /><RoleBadge role={u.role} /></div>
                        <p className="text-xs text-muted-foreground truncate">{u.status || "@" + u.username}</p>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openDM(u)} aria-label="Message"><MessageSquare className="h-3.5 w-3.5" /></Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={() => removeFriend(u.id)} aria-label="Remove friend"><X className="h-3.5 w-3.5" /></Button>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )
        }
      </div>
    </div>
  )
}

function DMConversation({ channelId, other, onBack }: { channelId: string; other: SafeUser; onBack: () => void }) {
  const { user } = useAuth()
  const socketRef = useRef<Socket | null>(null)
  const [connected, setConnected] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [draft, setDraft] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || ""
    const s = socketUrl
      ? io(socketUrl, { transports: ["websocket", "polling"], reconnection: true, reconnectionAttempts: Infinity, reconnectionDelay: 1000 })
      : io("/?XTransformPort=3001", { transports: ["websocket", "polling"], reconnection: true, reconnectionAttempts: Infinity, reconnectionDelay: 1000 })
    socketRef.current = s
    s.on("connect", () => setConnected(true))
    s.on("disconnect", () => setConnected(false))
    s.on("mute-error", (d: { message: string }) => toast.error(d.message))
    return () => { s.disconnect() }
  }, [])

  useEffect(() => {
    const socket = socketRef.current
    if (!socket || !connected) return
    socket.emit("join-channel", { channelId })
    socket.on("message-history", (data: { channelId: string; messages: ChatMessage[] }) => {
      if (data.channelId === channelId) setMessages(data.messages)
    })
    socket.on("message", (msg: ChatMessage) => {
      if (msg.channelId === channelId) setMessages((prev) => prev.some((m) => m.id === msg.id) ? prev : [...prev, msg])
    })
    socket.on("message-deleted", (data: { id: string }) => {
      setMessages((prev) => prev.map((m) => m.id === data.id ? { ...m, deleted: true, content: "" } : m))
    })
    return () => {
      socket.emit("leave-channel", { channelId })
      socket.off("message-history"); socket.off("message"); socket.off("message-deleted")
    }
  }, [connected, channelId])

  useEffect(() => { const el = scrollRef.current; if (el) el.scrollTop = el.scrollHeight }, [messages])

  const send = () => {
    const text = draft.trim()
    const socket = socketRef.current
    if (!text || !socket || !connected) return
    socket.emit("send-message", { channelId, content: text })
    setDraft("")
  }

  if (!user) return null

  return (
    <div className="h-full flex flex-col">
      <div className="h-11 shrink-0 px-3 flex items-center gap-2 border-b border-border">
        <Button variant="ghost" size="sm" className="gap-1.5" onClick={onBack}><ArrowLeft className="h-4 w-4" />Back</Button>
        <AvatarWithDeco src={other.pfpUrl} name={other.displayName} role={other.role} avatarDeco={other.avatarDeco} size="xs" />
        <DisplayName name={other.displayName} role={other.role} className="font-semibold" />
        <RoleBadge role={other.role} />
        <span className={cn("ml-2 h-2 w-2 rounded-full", connected ? "bg-pink-500" : "bg-red-500")} />
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scroll px-4 py-4 space-y-3">
        {messages.length === 0 && <div className="h-full flex flex-col items-center justify-center text-muted-foreground"><MessageSquare className="h-8 w-8 mb-2 opacity-40" /><p className="text-sm">Start of your DM with {other.displayName}</p></div>}
        {messages.map((m) => {
          const own = m.userId === user.id
          const role = (m.role || "MEMBER") as Role
          return (
            <div key={m.id} className={cn("flex gap-2.5", own && "flex-row-reverse")}>
              <AvatarWithDeco src={m.pfpUrl} name={m.displayName || m.username} role={own ? user.role : role} size="sm" className="mt-0.5" />
              <div className={cn("max-w-[70%]", own && "text-right")}>
                <p className="text-[10px] text-muted-foreground mb-0.5">{new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                {m.deleted ? <p className="text-xs italic text-muted-foreground">Message deleted</p> : (
                  <p className={cn("text-sm rounded-lg px-3 py-1.5 inline-block", own ? "bg-pink-500 text-white" : "bg-muted text-foreground")}>{m.content}</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
      <div className="shrink-0 p-3 border-t border-border">
        <div className="flex gap-2">
          <Input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send() } }} placeholder={`Message ${other.displayName}`} disabled={!connected} className="flex-1" />
          <Button onClick={send} disabled={!connected || !draft.trim()} className="bg-pink-500 hover:bg-pink-600 text-white" size="icon" aria-label="Send"><Send className="h-4 w-4" /></Button>
        </div>
      </div>
    </div>
  )
}
