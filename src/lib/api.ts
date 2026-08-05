// Frontend API helpers for Stratus

export type SafeUser = {
  id: string
  username: string
  displayName: string
  bio: string
  pfpUrl: string | null
  bannerUrl: string | null
  isOwner: boolean
}

export type Channel = {
  id: string
  name: string
  _count?: { messages: number }
}

export type ChatMessage = {
  id: string
  channelId: string
  userId?: string | null
  username: string
  displayName?: string | null
  pfpUrl?: string | null
  content: string
  createdAt: string
}

async function jsonFetch<T>(url: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(opts?.headers || {}) },
    ...opts,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error((data as any).error || "Request failed")
  }
  return data as T
}

export const api = {
  me: () => jsonFetch<{ user: SafeUser | null }>("/api/auth/me"),
  register: (username: string, password: string) =>
    jsonFetch<{ user: SafeUser }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),
  login: (username: string, password: string) =>
    jsonFetch<{ user: SafeUser }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),
  logout: () =>
    jsonFetch<{ ok: true }>("/api/auth/logout", { method: "POST" }),

  listChannels: () => jsonFetch<{ channels: Channel[] }>("/api/chat/channels"),
  createChannel: (name: string) =>
    jsonFetch<{ channel: Channel }>("/api/chat/channels", {
      method: "POST",
      body: JSON.stringify({ name }),
    }),
  getMessages: (channelId: string) =>
    jsonFetch<{ messages: ChatMessage[] }>(`/api/chat/messages?channelId=${channelId}`),

  updateProfile: (body: { displayName?: string; bio?: string }) =>
    jsonFetch<{ user: SafeUser }>("/api/profile/update", {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  uploadImage: (type: "pfp" | "banner", file: Blob) => {
    const form = new FormData()
    form.append("type", type)
    form.append("file", file)
    return fetch("/api/profile/upload", { method: "POST", body: form, credentials: "include" }).then(
      async (r) => {
        const data = await r.json()
        if (!r.ok) throw new Error(data.error || "Upload failed")
        return data as { url: string; user: SafeUser }
      }
    )
  },

  verifyOwner: (password: string) =>
    jsonFetch<{ ok: true; user: SafeUser }>("/api/owner/verify", {
      method: "POST",
      body: JSON.stringify({ password }),
    }),
}
