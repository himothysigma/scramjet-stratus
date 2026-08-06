// Frontend API helpers for Stratus

export type Role = "OWNER" | "ADMIN" | "MOD" | "MEMBER"

export type SafeUser = {
  id: string
  username: string
  displayName: string
  bio: string
  status: string
  pfpUrl: string | null
  bannerUrl: string | null
  pfpIsGif: boolean
  bannerIsGif: boolean
  avatarDeco: string | null
  profileEffect: string | null
  role: Role
  muted: boolean
  mutedUntil: string | null
}

export type Channel = {
  id: string
  name: string
  isDM?: boolean
  _count?: { messages: number }
}

export type ChatMessage = {
  id: string
  channelId: string
  userId?: string | null
  username: string
  displayName?: string | null
  pfpUrl?: string | null
  role?: Role
  content: string
  deleted?: boolean
  createdAt: string
}

export type DM = {
  id: string
  other: SafeUser
  lastMessage: ChatMessage | null
}

async function jsonFetch<T>(url: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(opts?.headers || {}) },
    ...opts,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error((data as any).error || "Request failed")
  return data as T
}

export const api = {
  me: () => jsonFetch<{ user: SafeUser | null }>("/api/auth/me"),
  register: (username: string, password: string) =>
    jsonFetch<{ user: SafeUser }>("/api/auth/register", { method: "POST", body: JSON.stringify({ username, password }) }),
  login: (username: string, password: string) =>
    jsonFetch<{ user: SafeUser }>("/api/auth/login", { method: "POST", body: JSON.stringify({ username, password }) }),
  logout: () => jsonFetch<{ ok: true }>("/api/auth/logout", { method: "POST" }),

  listChannels: () => jsonFetch<{ channels: Channel[] }>("/api/chat/channels"),
  createChannel: (name: string) =>
    jsonFetch<{ channel: Channel }>("/api/chat/channels", { method: "POST", body: JSON.stringify({ name }) }),
  getMessages: (channelId: string) =>
    jsonFetch<{ messages: ChatMessage[] }>(`/api/chat/messages?channelId=${channelId}`),

  updateProfile: (body: { displayName?: string; bio?: string; username?: string }) =>
    jsonFetch<{ user: SafeUser }>("/api/profile/update", { method: "PATCH", body: JSON.stringify(body) }),
  setStatus: (status: string) =>
    jsonFetch<{ user: SafeUser }>("/api/profile/status", { method: "PATCH", body: JSON.stringify({ status }) }),
  setDeco: (avatarDeco?: string, profileEffect?: string) =>
    jsonFetch<{ user: SafeUser }>("/api/profile/deco", { method: "PATCH", body: JSON.stringify({ avatarDeco, profileEffect }) }),
  uploadImage: (type: "pfp" | "banner", file: Blob) => {
    const form = new FormData()
    form.append("type", type)
    form.append("file", file)
    return fetch("/api/profile/upload", { method: "POST", body: form, credentials: "include" }).then(async (r) => {
      const data = await r.json()
      if (!r.ok) throw new Error(data.error || "Upload failed")
      return data as { url: string; user: SafeUser }
    })
  },

  verifyOwner: (password: string) =>
    jsonFetch<{ ok: true; user: SafeUser }>("/api/owner/verify", { method: "POST", body: JSON.stringify({ password }) }),

  // roles + moderation
  listUsers: () => jsonFetch<{ users: SafeUser[] }>("/api/roles/users"),
  assignRole: (userId: string, role: Role) =>
    jsonFetch<{ user: SafeUser }>("/api/roles/assign", { method: "POST", body: JSON.stringify({ userId, role }) }),
  muteUser: (userId: string, durationMin?: number) =>
    jsonFetch<{ ok: true }>("/api/moderation/mute", { method: "POST", body: JSON.stringify({ userId, durationMin }) }),
  unmuteUser: (userId: string) =>
    jsonFetch<{ ok: true }>("/api/moderation/unmute", { method: "POST", body: JSON.stringify({ userId }) }),
  deleteMessage: (id: string) =>
    jsonFetch<{ ok: true; id: string; channelId: string }>(`/api/messages/${id}`, { method: "DELETE" }),
  editMessage: (id: string, content: string) =>
    jsonFetch<{ ok: true }>(`/api/messages/edit`, { method: "PATCH", body: JSON.stringify({ id, content }) }),

  // friends + DMs
  listFriends: () => jsonFetch<{ friends: SafeUser[]; incoming: SafeUser[]; outgoing: SafeUser[] }>("/api/friends/list"),
  sendFriendRequest: (username: string) =>
    jsonFetch<{ ok: true }>("/api/friends/request", { method: "POST", body: JSON.stringify({ username }) }),
  acceptFriendRequest: (requesterId: string) =>
    jsonFetch<{ ok: true }>("/api/friends/accept", { method: "POST", body: JSON.stringify({ requesterId }) }),
  declineFriendRequest: (requesterId: string) =>
    jsonFetch<{ ok: true }>("/api/friends/decline", { method: "POST", body: JSON.stringify({ requesterId }) }),
  removeFriend: (userId: string) =>
    jsonFetch<{ ok: true }>("/api/friends/remove", { method: "POST", body: JSON.stringify({ userId }) }),
  listDMs: () => jsonFetch<{ dms: DM[] }>("/api/dms/list"),
  createDM: (userId: string) =>
    jsonFetch<{ id: string; other: SafeUser }>("/api/dms/list", { method: "POST", body: JSON.stringify({ userId }) }),
}
