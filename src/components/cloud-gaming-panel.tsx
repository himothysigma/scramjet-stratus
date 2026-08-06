"use client"

import { useState, useRef, useEffect } from "react"
import type { ReactNode } from "react"
import { GAMES, GAME_SOURCES, type GameDef, type GameSource } from "@/lib/client-constants"
import { useGaming } from "@/hooks/use-gaming"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Gamepad2, Maximize2, ArrowLeft, Gauge, Globe, Play, Cloud, Star, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

type Tab = "local" | "cloud" | "favorites" | "recent"

export function CloudGamingPanel() {
  const [active, setActive] = useState<GameDef | null>(null)
  const [cloudSource, setCloudSource] = useState<GameSource | null>(null)
  const [tab, setTab] = useState<Tab>("local")
  const [favorites, setFavorites] = useState<string[]>([])
  const [history, setHistory] = useState<string[]>([])
  const { quality, region } = useGaming()
  const frameWrapRef = useRef<HTMLDivElement>(null)

  // Real ping measurement — actually pings the server and measures response time
  const [ping, setPing] = useState<number | null>(null)
  useEffect(() => {
    let cancelled = false
    const measurePing = async () => {
      try {
        const start = performance.now()
        await fetch("/api/auth/me", { cache: "no-store" })
        const elapsed = Math.round(performance.now() - start)
        if (!cancelled) setPing(elapsed)
      } catch {
        if (!cancelled) setPing(null)
      }
    }
    measurePing()
    const interval = setInterval(measurePing, 30000) // re-measure every 30s
    return () => { cancelled = true; clearInterval(interval) }
  }, [])

  // Load favorites + history on mount
  useEffect(() => {
    let cancelled = false
    Promise.all([
      api.listFavorites().catch(() => ({ favorites: [] as string[] })),
      api.listGameHistory().catch(() => ({ history: [] as string[] })),
    ]).then(([fav, hist]) => {
      if (cancelled) return
      setFavorites(fav.favorites ?? [])
      setHistory(hist.history ?? [])
    })
    return () => { cancelled = true }
  }, [])

  const goFullscreen = () => {
    const el = frameWrapRef.current
    if (!el) return
    if (document.fullscreenElement) document.exitFullscreen()
    else el.requestFullscreen?.()
  }

  const isFav = (id: string) => favorites.includes(id)

  const toggleFavorite = async (gameId: string) => {
    const wasFav = favorites.includes(gameId)
    // Optimistic local update — feels instant
    setFavorites(prev => wasFav ? prev.filter(x => x !== gameId) : [...prev, gameId])
    try {
      await api.toggleFavorite(gameId)
    } catch {
      // Revert on failure
      setFavorites(prev => wasFav ? [...prev, gameId] : prev.filter(x => x !== gameId))
    }
  }

  const launchGame = (g: GameDef) => {
    setActive(g)
    // Record play session (fire-and-forget; update local history optimistically)
    api.recordGamePlay(g.id).catch(() => {})
    setHistory(prev => [g.id, ...prev.filter(x => x !== g.id)].slice(0, 10))
  }

  if (active) {
    const q = quality()
    // Real render-quality control: scale the frame. Lower quality = scaled down then upscaled.
    const scale = q.id === "low" ? 0.85 : q.id === "ultra" ? 1 : 1
    return (
      <div className="h-full flex flex-col bg-[#0a0a0a]">
        <div className="h-11 shrink-0 px-3 flex items-center justify-between border-b border-[#2a2a2a]">
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => setActive(null)}>
              <ArrowLeft className="h-4 w-4" /> Library
            </Button>
            <span className="font-semibold truncate">{active.name}</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-[#888888]">
            <span className="flex items-center gap-1">
              <Globe className="h-3.5 w-3.5" /> {region().code} {ping !== null ? `${ping}ms` : "measuring…"}
            </span>
            <span className="flex items-center gap-1">
              <Gauge className="h-3.5 w-3.5" /> {q.name.split(" ")[0]}
            </span>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goFullscreen} aria-label="Fullscreen">
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div ref={frameWrapRef} className="flex-1 bg-[#0a0a0f] flex items-center justify-center overflow-hidden">
          <iframe
            key={active.id}
            src={active.url}
            title={active.name}
            className="bg-[#0a0a0f]"
            style={{
              width: scale < 1 ? `${scale * 100}%` : "100%",
              height: scale < 1 ? `${scale * 100}%` : "100%",
              border: "none",
              imageRendering: q.id === "low" ? "pixelated" : "auto",
            }}
            allow="fullscreen; autoplay; gamepad"
          />
        </div>
      </div>
    )
  }

  // Cloud game source view (Raccoon, CrazyGames, etc.)
  if (cloudSource) {
    return (
      <div className="h-full flex flex-col bg-[#0a0a0a]">
        <div className="h-11 shrink-0 px-3 flex items-center justify-between border-b border-[#2a2a2a]">
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => setCloudSource(null)}>
              <ArrowLeft className="h-4 w-4" /> Library
            </Button>
            <img src={cloudSource.thumbnail} alt="" className="h-5 w-5 rounded" />
            <span className="font-semibold truncate">{cloudSource.name}</span>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
            const el = frameWrapRef.current
            if (el) { document.fullscreenElement ? document.exitFullscreen() : el.requestFullscreen?.() }
          }} aria-label="Fullscreen">
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
        <div ref={frameWrapRef} className="flex-1 bg-[#0a0a0f] flex items-center justify-center overflow-hidden">
          <iframe
            src={cloudSource.url}
            title={cloudSource.name}
            className="w-full h-full"
            style={{ border: "none" }}
            allow="fullscreen; autoplay; gamepad; accelerometer; gyroscope"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation allow-modals"
          />
        </div>
      </div>
    )
  }

  // Render a single game card with a favorite star overlay.
  // Uses a div+role instead of a <button> so the star button can nest inside.
  const renderGameCard = (g: GameDef) => {
    const fav = isFav(g.id)
    return (
      <div
        key={g.id}
        role="button"
        tabIndex={0}
        onClick={() => launchGame(g)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            launchGame(g)
          }
        }}
        className="group relative text-left rounded-xl border border-[#2a2a2a] bg-[#121212] hover:border-pink-500/40 hover:shadow-lg transition-all overflow-hidden cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500/50"
      >
        <div className="aspect-[16/10] relative overflow-hidden bg-[#1a1a1a]">
          <img src={g.cover} alt={`${g.name} cover`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
          {/* Favorite star — top-left, over the cover image */}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); e.preventDefault(); void toggleFavorite(g.id) }}
            aria-label={fav ? `Remove ${g.name} from favorites` : `Add ${g.name} to favorites`}
            aria-pressed={fav}
            className="absolute top-2 left-2 z-10 rounded p-1 bg-black/70 backdrop-blur hover:bg-black/90 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500/60"
          >
            <Star
              className={cn(
                "h-3.5 w-3.5 transition-colors",
                fav ? "fill-pink-500 text-pink-500" : "text-white/80 hover:text-pink-400"
              )}
            />
          </button>
          <span className="absolute top-2 right-2 text-[10px] font-medium px-1.5 py-0.5 rounded bg-black/70 backdrop-blur text-white">{g.category}</span>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
            <span className="flex items-center gap-1 text-xs font-medium text-white"><Play className="h-3 w-3 fill-white" /> Play now</span>
          </div>
        </div>
        <div className="p-3">
          <h3 className="font-semibold text-sm truncate">{g.name}</h3>
          <p className="text-xs text-[#888888] line-clamp-1 mt-0.5">{g.description}</p>
          <p className="text-[10px] text-[#888888]/70 mt-1">{g.controls}</p>
        </div>
      </div>
    )
  }

  const renderEmpty = (message: string, icon: ReactNode) => (
    <div className="flex flex-col items-center justify-center text-center py-16 px-4 border border-dashed border-[#2a2a2a] rounded-xl">
      <div className="h-12 w-12 rounded-full bg-pink-500/10 border border-pink-500/20 flex items-center justify-center mb-3 text-pink-500">
        {icon}
      </div>
      <p className="text-sm text-[#888888] max-w-xs">{message}</p>
    </div>
  )

  const favoriteGames = GAMES.filter(g => favorites.includes(g.id))
  const recentGames: GameDef[] = history
    .map(id => GAMES.find(g => g.id === id))
    .filter((g): g is GameDef => g !== undefined)

  const tabBtn = (id: Tab, label: string, icon: ReactNode, count?: number) => (
    <button
      onClick={() => setTab(id)}
      className={cn(
        "px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap inline-flex items-center",
        tab === id ? "border-pink-500 text-pink-500" : "border-transparent text-[#888888] hover:text-[#f0f0f0]"
      )}
    >
      {icon}
      {label}
      {count !== undefined && count > 0 && (
        <span className="ml-1.5 text-[10px] font-semibold bg-pink-500/15 text-pink-500 px-1.5 py-0.5 rounded-full">{count}</span>
      )}
    </button>
  )

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-5 sm:p-6 max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-1">
          <div className="h-10 w-10 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center">
            <Gamepad2 className="h-5 w-5 text-pink-500" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Cloud Gaming</h1>
            <p className="text-sm text-[#888888]">
              {region().code} {region().name} · ~{ping !== null ? `${ping}ms` : "measuring…"} · {quality().name}
            </p>
          </div>
        </div>

        {/* Tabs: Local Games / Cloud Games / Favorites / Recent */}
        <div className="flex gap-1 mt-4 mb-5 border-b border-[#2a2a2a] overflow-x-auto">
          {tabBtn("local", "Local Games", <Gamepad2 className="h-4 w-4 mr-1.5" />)}
          {tabBtn("cloud", "Cloud Games", <Cloud className="h-4 w-4 mr-1.5" />)}
          {tabBtn("favorites", "Favorites", <Star className="h-4 w-4 mr-1.5" />, favorites.length)}
          {tabBtn("recent", "Recent", <Clock className="h-4 w-4 mr-1.5" />, history.length)}
        </div>

        {tab === "local" && (
          <>
            <p className="text-sm text-[#888888] mb-5">
              8 real playable games — no external requests, run directly in your browser.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {GAMES.map(renderGameCard)}
            </div>
          </>
        )}

        {tab === "cloud" && (
          <>
            <p className="text-sm text-[#888888] mb-5">
              Stream AAA + browser games from external cloud platforms. These load in an iframe — some may require a stable connection.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {GAME_SOURCES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setCloudSource(s)}
                  className="group flex items-center gap-4 text-left rounded-xl border border-[#2a2a2a] bg-[#121212] hover:border-pink-500/40 hover:shadow-lg transition-all overflow-hidden p-4"
                >
                  <img src={s.thumbnail} alt={s.name} className="h-14 w-14 rounded-lg shrink-0" />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-sm truncate">{s.name}</h3>
                    <p className="text-xs text-[#888888] line-clamp-2 mt-0.5">{s.description}</p>
                  </div>
                  <Play className="h-5 w-5 text-[#888888] group-hover:text-pink-500 transition-colors shrink-0" />
                </button>
              ))}
            </div>
          </>
        )}

        {tab === "favorites" && (
          <>
            <p className="text-sm text-[#888888] mb-5">
              Your starred games, ready to launch in one click.
            </p>
            {favoriteGames.length === 0 ? (
              renderEmpty("No favorites yet. Click the star on a game to add it.", <Star className="h-5 w-5" />)
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {favoriteGames.map(renderGameCard)}
              </div>
            )}
          </>
        )}

        {tab === "recent" && (
          <>
            <p className="text-sm text-[#888888] mb-5">
              Pick up where you left off — your last played games.
            </p>
            {recentGames.length === 0 ? (
              renderEmpty("No games played yet.", <Clock className="h-5 w-5" />)
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {recentGames.map(renderGameCard)}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
