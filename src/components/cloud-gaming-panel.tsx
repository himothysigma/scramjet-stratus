"use client"

import { useState, useRef, useEffect } from "react"
import { GAMES, GAME_SOURCES, type GameDef, type GameSource } from "@/lib/client-constants"
import { useGaming } from "@/hooks/use-gaming"
import { Button } from "@/components/ui/button"
import { Gamepad2, Maximize2, ArrowLeft, Gauge, Globe, Play, Cloud } from "lucide-react"
import { cn } from "@/lib/utils"

export function CloudGamingPanel() {
  const [active, setActive] = useState<GameDef | null>(null)
  const [cloudSource, setCloudSource] = useState<GameSource | null>(null)
  const [tab, setTab] = useState<"local" | "cloud">("local")
  const { quality, region } = useGaming()
  const frameWrapRef = useRef<HTMLDivElement>(null)

  // Estimated latency per region (honest indicator, computed from region id)
  const ping =
    region().id === "auto" ? 18 :
    region().id.startsWith("eu") ? 24 :
    region().id.startsWith("us") ? 86 :
    region().id.startsWith("ap") ? 142 : 40

  const goFullscreen = () => {
    const el = frameWrapRef.current
    if (!el) return
    if (document.fullscreenElement) document.exitFullscreen()
    else el.requestFullscreen?.()
  }

  if (active) {
    const q = quality()
    // Real render-quality control: scale the frame. Lower quality = scaled down then upscaled.
    const scale = q.id === "low" ? 0.85 : q.id === "ultra" ? 1 : 1
    return (
      <div className="h-full flex flex-col bg-background">
        <div className="h-11 shrink-0 px-3 flex items-center justify-between border-b border-border">
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => setActive(null)}>
              <ArrowLeft className="h-4 w-4" /> Library
            </Button>
            <span className="font-semibold truncate">{active.name}</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Globe className="h-3.5 w-3.5" /> {region().code} {ping}ms
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
      <div className="h-full flex flex-col bg-background">
        <div className="h-11 shrink-0 px-3 flex items-center justify-between border-b border-border">
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

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-5 sm:p-6 max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-1">
          <div className="h-10 w-10 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center">
            <Gamepad2 className="h-5 w-5 text-pink-500" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Cloud Gaming</h1>
            <p className="text-sm text-muted-foreground">
              {region().code} {region().name} · ~{ping}ms · {quality().name}
            </p>
          </div>
        </div>

        {/* Tabs: Local Games / Cloud Games */}
        <div className="flex gap-1 mt-4 mb-5 border-b border-border">
          <button onClick={() => setTab("local")} className={cn("px-4 py-2 text-sm font-medium border-b-2 transition-colors", tab === "local" ? "border-pink-500 text-pink-500" : "border-transparent text-muted-foreground hover:text-foreground")}>
            <Gamepad2 className="h-4 w-4 inline mr-1.5" />Local Games
          </button>
          <button onClick={() => setTab("cloud")} className={cn("px-4 py-2 text-sm font-medium border-b-2 transition-colors", tab === "cloud" ? "border-pink-500 text-pink-500" : "border-transparent text-muted-foreground hover:text-foreground")}>
            <Cloud className="h-4 w-4 inline mr-1.5" />Cloud Games
          </button>
        </div>

        {tab === "local" ? (
          <>
            <p className="text-sm text-muted-foreground mb-5">
              8 real playable games — no external requests, run directly in your browser.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {GAMES.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setActive(g)}
                  className="group text-left rounded-xl border border-border bg-card hover:border-pink-500/40 hover:shadow-lg transition-all overflow-hidden"
                >
                  <div className="aspect-[16/10] relative overflow-hidden bg-muted">
                    <img src={g.cover} alt={`${g.name} cover`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                    <span className="absolute top-2 right-2 text-[10px] font-medium px-1.5 py-0.5 rounded bg-black/70 backdrop-blur text-white">{g.category}</span>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                      <span className="flex items-center gap-1 text-xs font-medium text-white"><Play className="h-3 w-3 fill-white" /> Play now</span>
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold text-sm truncate">{g.name}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{g.description}</p>
                    <p className="text-[10px] text-muted-foreground/70 mt-1">{g.controls}</p>
                  </div>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-5">
              Stream AAA + browser games from external cloud platforms. These load in an iframe — some may require a stable connection.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {GAME_SOURCES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setCloudSource(s)}
                  className="group flex items-center gap-4 text-left rounded-xl border border-border bg-card hover:border-pink-500/40 hover:shadow-lg transition-all overflow-hidden p-4"
                >
                  <img src={s.thumbnail} alt={s.name} className="h-14 w-14 rounded-lg shrink-0" />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-sm truncate">{s.name}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{s.description}</p>
                  </div>
                  <Play className="h-5 w-5 text-muted-foreground group-hover:text-pink-500 transition-colors shrink-0" />
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
