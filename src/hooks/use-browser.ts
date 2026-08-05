"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import { SEARCH_ENGINES } from "@/lib/client-constants"

export type Bookmark = { id: string; title: string; url: string; createdAt: number }
export type HistoryEntry = { id: string; title: string; url: string; visitedAt: number }

type BrowserState = {
  searchEngineId: string
  homepage: string
  useProxy: boolean          // Scramjet (HTML rewrite) — main/default
  useUltraviolet: boolean    // UV (SW intercept) — ONLY for raccoon games
  bookmarks: Bookmark[]
  history: HistoryEntry[]
  setSearchEngine: (id: string) => void
  setHomepage: (url: string) => void
  setUseProxy: (v: boolean) => void
  setUseUltraviolet: (v: boolean) => void
  addBookmark: (b: Omit<Bookmark, "id" | "createdAt">) => void
  removeBookmark: (id: string) => void
  isBookmarked: (url: string) => boolean
  recordVisit: (url: string, title: string) => void
  clearHistory: () => void
  removeHistory: (id: string) => void
}

export const useBrowser = create<BrowserState>()(
  persist(
    (set, get) => ({
      searchEngineId: "duckduckgo",
      homepage: "",
      useProxy: true,
      useUltraviolet: false,
      bookmarks: [],
      history: [],
      setSearchEngine: (id) => set({ searchEngineId: id }),
      setHomepage: (url) => set({ homepage: url }),
      setUseProxy: (v) => set({ useProxy: v }),
      setUseUltraviolet: (v) => set({ useUltraviolet: v }),
      addBookmark: (b) =>
        set((s) => {
          if (s.bookmarks.some((x) => x.url === b.url)) return s
          return {
            bookmarks: [
              ...s.bookmarks,
              { ...b, id: crypto.randomUUID(), createdAt: Date.now() },
            ],
          }
        }),
      removeBookmark: (id) =>
        set((s) => ({ bookmarks: s.bookmarks.filter((x) => x.id !== id) })),
      isBookmarked: (url) => get().bookmarks.some((x) => x.url === url),
      recordVisit: (url, title) =>
        set((s) => ({
          history: [
            { id: crypto.randomUUID(), url, title, visitedAt: Date.now() },
            ...s.history.filter((h) => h.url !== url),
          ].slice(0, 200),
        })),
      clearHistory: () => set({ history: [] }),
      removeHistory: (id) =>
        set((s) => ({ history: s.history.filter((h) => h.id !== id) })),
    }),
    { name: "stratus-browser" }
  )
)

export function searchEngine(id: string) {
  return SEARCH_ENGINES.find((s) => s.id === id) || SEARCH_ENGINES[0]
}
