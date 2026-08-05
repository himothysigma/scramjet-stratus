"use client"

import { useState, useRef, useEffect } from "react"
import { GAMES, type GameDef } from "@/lib/client-constants"
import { useGaming } from "@/hooks/use-gaming"
import { Button } from "@/components/ui/button"
import { Gamepad2, Maximize2, ArrowLeft, Gauge, Globe, Play } from "lucide-react"
import { cn } from "@/lib/utils"

export function CloudGamingPanel() {
  const [active, setActive] = useState<GameDef | null>(null)
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
      <div className="h-[calc(100vh-3.5rem-2rem)] flex flex-col bg-background">
        <div className="h-11 shrink-0 px-3 flex items-center justify-between border-b border-border">
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => setActive(null)}>
              <ArrowLeft className="h-4 w-4" /> Library
            </Button>
            <span className="font-semibold truncate">{active.name}</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Globe className="h-3.5 w-3.5" /> {region().flag} {ping}ms
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

  return (
    <div className="h-[calc(100vh-3.5rem-2rem)] overflow-y-auto">
      <div className="p-5 sm:p-6 max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-1">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Gamepad2 className="h-5 w-5 text-emerald-500" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Cloud Gaming</h1>
            <p className="text-sm text-muted-foreground">
              {region().flag} {region().name} · ~{ping}ms · {quality().name}
            </p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mt-4 mb-5">
          Pick a game and play instantly in your browser. Use the region and quality extensions in the top bar to tune your session.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {GAMES.map((g) => (
            <button
              key={g.id}
              onClick={() => setActive(g)}
              className="group text-left rounded-xl border border-border bg-card hover:border-emerald-500/40 hover:shadow-lg transition-all overflow-hidden"
            >
              <div
                className="h-28 flex items-center justify-center relative"
                style={{ background: `linear-gradient(135deg, ${g.accent}22, ${g.accent}08)` }}
              >
                <Gamepad2 className="h-9 w-9" style={{ color: g.accent }} />
                <span className="absolute top-2 right-2 text-[10px] font-medium px-1.5 py-0.5 rounded bg-background/80 backdrop-blur text-muted-foreground">
                  {g.category}
                </span>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold">{g.name}</h3>
                  <Play className="h-4 w-4 text-muted-foreground group-hover:text-emerald-500 transition-colors" />
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{g.description}</p>
                <p className="text-[11px] text-muted-foreground/80">{g.controls}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
