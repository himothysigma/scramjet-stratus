"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  ArrowLeft, ArrowRight, RotateCw, Globe, ExternalLink, Lock, Home,
  Star, StarOff, Shield, ShieldOff, X, Clock, Search, Zap, ZapOff, Plus, Check,
} from "lucide-react"
import { QUICK_LINKS, SEARCH_ENGINES } from "@/lib/client-constants"
import { useBrowser, searchEngine } from "@/hooks/use-browser"
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

// Ultraviolet XOR URL encoder — mirrors uv.config.js codec
// Used ONLY for raccoon cloud games (per user request). Scramjet is the main/default proxy.
function uvEncode(url: string): string {
  const codec = (typeof window !== "undefined" && (window as any).__uv$config?.encodeUrl) || null
  if (codec) return codec(url)
  // Fallback: inline XOR codec (must match Ultraviolet.codec.xor)
  const key = "uv"
  let result = ""
  for (let i = 0; i < url.length; i++) {
    result += String.fromCharCode(url.charCodeAt(i) ^ key.charCodeAt(i % key.length))
  }
  return encodeURIComponent(result)
}

function isHttps(): boolean {
  return typeof window !== "undefined" && (window.location.protocol === "https:" || window.location.hostname === "localhost")
}

type Tab = { id: string; url: string | null; input: string; title: string }

const NEW_TAB_ID = "new-tab"

function newTab(): Tab {
  return { id: crypto.randomUUID(), url: null, input: "", title: "New Tab" }
}

function normalizeUrl(raw: string, engineId: string): string {
  const v = raw.trim()
  if (!v) return ""
  if (/^https?:\/\//i.test(v)) return v
  if (/^[\w-]+(\.[\w-]+)+/.test(v)) return "https://" + v
  return searchEngine(engineId).url + encodeURIComponent(v)
}

export function BrowserPanel() {
  const {
    searchEngineId, setSearchEngine, homepage, setHomepage,
    useProxy, setUseProxy, useUltraviolet, setUseUltraviolet,
    bookmarks, addBookmark, removeBookmark,
    isBookmarked, recordVisit, history, clearHistory, removeHistory,
  } = useBrowser()

  const [tabs, setTabs] = useState<Tab[]>([newTab()])
  const [activeId, setActiveId] = useState(tabs[0].id)
  const [loading, setLoading] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [uvReady, setUvReady] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // Register Ultraviolet service worker — ONLY on HTTPS (SWs require secure context).
  // Loads uv.bundle.js + uv.config.js, then registers uv.sw.js.
  useEffect(() => {
    if (!isHttps()) return // SW won't register on HTTP (sandbox gateway). Works on Replit (HTTPS).
    let cancelled = false
    const loadScripts = async () => {
      // Load the UV bundle + config scripts
      await new Promise<void>((resolve, reject) => {
        const s = document.createElement("script")
        s.src = "/uv/uv.bundle.js"
        s.onload = () => resolve()
        s.onerror = () => reject(new Error("bundle load failed"))
        document.head.appendChild(s)
      })
      await new Promise<void>((resolve, reject) => {
        const s = document.createElement("script")
        s.src = "/uv/uv.config.js"
        s.onload = () => resolve()
        s.onerror = () => reject(new Error("config load failed"))
        document.head.appendChild(s)
      })
      // Register the service worker (must be at /service/ for scope /service/)
      if (cancelled) return
      try {
        await navigator.serviceWorker.register("/service/uv.sw.js", { scope: "/service/" })
        await navigator.serviceWorker.ready
        if (!cancelled) setUvReady(true)
      } catch (e) {
        console.error("[uv] SW registration failed:", e)
      }
    }
    loadScripts()
    return () => { cancelled = true }
  }, [])

  const active = tabs.find((t) => t.id === activeId) || tabs[0]

  const updateTab = (id: string, patch: Partial<Tab>) =>
    setTabs((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)))

  const navigate = (rawUrl: string) => {
    const url = normalizeUrl(rawUrl, searchEngineId)
    if (!url) return
    let displayUrl = url
    let loadSrc = url
    if (useUltraviolet) {
      // Ultraviolet mode (SW intercept — for raccoon games). Requires HTTPS.
      // The SW intercepts all fetch/XHR/WebSocket under /service/
      displayUrl = `/service/${uvEncode(url)}`
      loadSrc = displayUrl
    } else if (useProxy) {
      displayUrl = `/api/proxy?url=${encodeURIComponent(url)}`
      loadSrc = displayUrl
    }
    updateTab(active.id, { url: loadSrc, input: url, title: url })
    setLoading(true)
    recordVisit(url, url)
  }

  const back = () => { if (iframeRef.current?.contentWindow) history.back() }
  const forward = () => { if (iframeRef.current?.contentWindow) history.forward() }
  const reload = () => {
    if (active.url && iframeRef.current) {
      setLoading(true)
      const src = iframeRef.current.src
      iframeRef.current.src = "about:blank"
      setTimeout(() => { if (iframeRef.current) iframeRef.current.src = src }, 30)
    }
  }
  const goHome = () => {
    if (homepage) navigate(homepage)
    else updateTab(active.id, { url: null, input: "", title: "New Tab" })
  }

  const openNewTab = () => {
    const t = newTab()
    setTabs((prev) => [...prev, t])
    setActiveId(t.id)
  }
  const closeTab = (id: string) => {
    setTabs((prev) => {
      const idx = prev.findIndex((t) => t.id === id)
      const next = prev.filter((t) => t.id !== id)
      if (next.length === 0) {
        const fresh = newTab()
        setActiveId(fresh.id)
        return [fresh]
      }
      if (id === activeId) {
        const newActive = next[Math.max(0, idx - 1)]
        setActiveId(newActive.id)
      }
      return next
    })
  }

  // Listen for navigation messages from proxied pages
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.data?.type === "stratus-navigate" && typeof e.data.url === "string") {
        updateTab(active.id, { input: e.data.url })
        recordVisit(e.data.url, e.data.url)
      }
    }
    window.addEventListener("message", onMsg)
    return () => window.removeEventListener("message", onMsg)
  }, [active.id])

  const bookmarked = active.input ? isBookmarked(active.input) : false

  return (
    <div className="h-[calc(100vh-3.5rem-2rem)] flex flex-col synnical-bg">
      {/* Tab strip */}
      <div className="h-9 shrink-0 flex items-center gap-1 px-2 border-b border-[#2a2a2a] bg-[#0d0d0d] overflow-x-auto">
        {tabs.map((t) => (
          <div
            key={t.id}
            onClick={() => setActiveId(t.id)}
            className={cn(
              "group flex items-center gap-1.5 h-7 px-2.5 rounded-md text-xs cursor-pointer max-w-[180px] transition-colors",
              t.id === activeId ? "bg-[#1a1a1a] border border-[#ec4899]/40" : "hover:bg-[#1a1a1a]/60"
            )}
          >
            <Globe className="h-3 w-3 text-muted-foreground shrink-0" />
            <span className="truncate flex-1">{t.input || "New Tab"}</span>
            <button
              onClick={(e) => { e.stopPropagation(); closeTab(t.id) }}
              className="opacity-0 group-hover:opacity-100 hover:bg-muted rounded p-0.5"
              aria-label="Close tab"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={openNewTab} aria-label="New tab">
          <Plus className="h-4 w-4" />
        </Button>
        <div className="flex-1" />
        {/* Search engine picker */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs">
              <Search className="h-3.5 w-3.5" />
              {searchEngine(searchEngineId).name}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-48 p-1">
            {SEARCH_ENGINES.map((s) => {
              const SIcon = s.icon
              return (
                <button
                  key={s.id}
                  onClick={() => setSearchEngine(s.id)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-accent"
                >
                  <SIcon className="h-3.5 w-3.5" /><span className="flex-1 text-left">{s.name}</span>
                {searchEngineId === s.id && <Check className="h-3.5 w-3.5 synnical-accent" />}
                </button>
              )
            })}
          </PopoverContent>
        </Popover>
        {/* Proxy toggle (Scramjet — main/default) */}
        <Button
          variant="ghost" size="sm"
          className="h-7 gap-1.5 text-xs"
          onClick={() => { setUseProxy(!useProxy); if (useUltraviolet) setUseUltraviolet(false) }}
          title={useProxy ? "Scramjet proxy ON — bypasses anti-iframe blocks" : "Scramjet proxy OFF — direct iframe"}
        >
          {useProxy ? <Shield className="h-3.5 w-3.5 synnical-accent" /> : <ShieldOff className="h-3.5 w-3.5 text-muted-foreground" />}
          {useProxy ? "Scramjet" : "Direct"}
        </Button>

        {/* Ultraviolet toggle — ONLY for raccoon cloud games. Requires HTTPS. */}
        <Button
          variant="ghost" size="sm"
          className="h-7 gap-1.5 text-xs"
          onClick={() => {
            if (!isHttps()) { alert("Ultraviolet requires HTTPS. It works on Replit (https) but not in the HTTP sandbox preview. Deploy to Replit to use it for raccoon games."); return }
            if (!uvReady) { alert("Ultraviolet service worker is still loading. Wait a moment and try again."); return }
            setUseUltraviolet(!useUltraviolet); if (useProxy) setUseProxy(false)
          }}
          title={useUltraviolet ? "Ultraviolet ON — SW intercepts fetch/XHR/WebSocket (for raccoon games)" : "Ultraviolet OFF — enable for raccoon cloud games"}
        >
          {useUltraviolet ? <Zap className="h-3.5 w-3.5 synnical-accent" /> : <ZapOff className="h-3.5 w-3.5 text-muted-foreground" />}
          UV
        </Button>
      </div>

      {/* Toolbar */}
      <div className="h-11 shrink-0 px-2 flex items-center gap-1 border-b border-[#2a2a2a] bg-[#0d0d0d]">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={back} aria-label="Back">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={forward} aria-label="Forward">
          <ArrowRight className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={reload} disabled={!active.url} aria-label="Reload">
          <RotateCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goHome} aria-label="Home">
          <Home className="h-4 w-4" />
        </Button>
        <form
          className="flex-1 flex items-center"
          onSubmit={(e) => { e.preventDefault(); navigate(active.input) }}
        >
          <div className="relative w-full">
            {useProxy ? (
              <Shield className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 synnical-accent" />
            ) : (
              <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 synnical-accent" />
            )}
            <Input
              value={active.input}
              onChange={(e) => updateTab(active.id, { input: e.target.value })}
              placeholder={`Search ${searchEngine(searchEngineId).name} or enter address`}
              className="h-8 pl-8 pr-20 text-sm synnical-input"
              autoFocus
            />
            <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
              {active.input && (
                <button
                  type="button"
                  onClick={() => bookmarked ? removeBookmark(bookmarks.find((b) => b.url === active.input)!.id) : addBookmark({ title: active.input, url: active.input })}
                  className="p-1 rounded hover:bg-accent text-muted-foreground"
                  aria-label={bookmarked ? "Remove bookmark" : "Add bookmark"}
                >
                  {bookmarked ? <Star className="h-3.5 w-3.5 synnical-accent" /> : <StarOff className="h-3.5 w-3.5 text-muted-foreground" />}
                </button>
              )}
              {active.input && (
                <a
                  href={active.input} target="_blank" rel="noreferrer"
                  className="p-1 rounded hover:bg-accent text-muted-foreground"
                  aria-label="Open in new tab"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          </div>
        </form>
        <Popover open={showHistory} onOpenChange={setShowHistory}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="History">
              <Clock className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0">
            <div className="flex items-center justify-between px-3 py-2 border-b border-border">
              <span className="text-xs font-semibold uppercase text-muted-foreground">History</span>
              <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={clearHistory}>Clear</Button>
            </div>
            <div className="max-h-72 overflow-y-auto">
              {history.length === 0 ? (
                <p className="p-3 text-xs text-muted-foreground text-center">No history yet</p>
              ) : history.map((h) => (
                <div key={h.id} className="group flex items-center gap-2 px-3 py-1.5 hover:bg-accent">
                  <button className="flex-1 min-w-0 text-left" onClick={() => { navigate(h.url); setShowHistory(false) }}>
                    <p className="text-xs truncate">{h.title}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{h.url}</p>
                  </button>
                  <button onClick={() => removeHistory(h.id)} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-muted rounded">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Viewport */}
      <div className="flex-1 bg-white relative min-h-0">
        {!active.url ? (
          <NewTabPage
            onNavigate={navigate}
            bookmarks={bookmarks}
            homepage={homepage}
            setHomepage={setHomepage}
          />
        ) : (
          <>
            <iframe
              key={active.id}
              ref={iframeRef}
              src={active.url}
              title={active.title}
              className="w-full h-full border-none bg-white"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation allow-modals"
              referrerPolicy="no-referrer"
              onLoad={() => setLoading(false)}
            />
            {loading && (
              <div className="absolute top-2 left-1/2 -translate-x-1/2 text-xs bg-background/90 backdrop-blur px-3 py-1 rounded-full border border-border text-muted-foreground shadow">
                Loading{useProxy ? " via proxy" : ""}…
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function NewTabPage({
  onNavigate, bookmarks, homepage, setHomepage,
}: {
  onNavigate: (url: string) => void
  bookmarks: { id: string; title: string; url: string }[]
  homepage: string
  setHomepage: (u: string) => void
}) {
  const [query, setQuery] = useState("")
  return (
    <div className="h-full overflow-y-auto synnical-bg">
      <div className="max-w-2xl mx-auto px-4 py-10 sm:py-16 flex flex-col items-center">
        <div className="h-16 w-16 rounded-2xl bg-[#ec4899]/10 border border-[#ec4899]/30 flex items-center justify-center mb-4">
          <Globe className="h-8 w-8 synnical-accent" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">Synnical</h1>
        <p className="text-sm text-gray-400 mt-1 mb-6">
          Search the web or enter an address. Proxy mode bypasses anti-iframe blocks on many sites.
        </p>
        <form
          className="w-full"
          onSubmit={(e) => { e.preventDefault(); onNavigate(query) }}
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search or enter address"
              className="h-11 pl-10 text-sm"
              autoFocus
            />
          </div>
        </form>

        <div className="w-full mt-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Quick links</p>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {QUICK_LINKS.map((q) => {
              const QIcon = q.icon
              return (
                <button
                  key={q.url}
                  onClick={() => onNavigate(q.url)}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-lg border border-[#2a2a2a] hover:border-[#ec4899]/40 hover:bg-[#1a1a1a] transition-colors"
                >
                  <QIcon className="h-5 w-5 synnical-accent" />
                  <span className="text-xs">{q.name}</span>
                </button>
              )
            })}
          </div>
        </div>

        {bookmarks.length > 0 && (
          <div className="w-full mt-8">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Bookmarks</p>
            <div className="space-y-1">
              {bookmarks.map((b) => (
                <button
                  key={b.id}
                  onClick={() => onNavigate(b.url)}
                  className="w-full flex items-center gap-2 p-2 rounded-md hover:bg-accent text-left"
                >
                  <Star className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                  <span className="text-sm truncate flex-1">{b.title}</span>
                  <span className="text-[10px] text-muted-foreground truncate">{b.url}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="w-full mt-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Homepage</p>
          <div className="flex gap-2">
            <Input
              value={homepage}
              onChange={(e) => setHomepage(e.target.value)}
              placeholder="e.g. https://duckduckgo.com (leave empty for New Tab)"
              className="h-8 text-sm"
            />
            {homepage && <Button size="sm" variant="outline" onClick={() => onNavigate(homepage)}>Go</Button>}
          </div>
        </div>
      </div>
    </div>
  )
}
