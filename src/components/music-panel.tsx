"use client"

import { useState } from "react"
import { Music, ExternalLink, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export function MusicPanel() {
  const [loading, setLoading] = useState(true)

  return (
    <div className="h-full flex flex-col bg-[#0a0a0a]">
      {/* Header */}
      <div className="h-12 shrink-0 flex items-center justify-between px-4 border-b border-[#2a2a2a]">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-pink-500/10 border border-pink-500/20 flex items-center justify-center">
            <Music className="h-4 w-4 text-pink-500" />
          </div>
          <span className="font-semibold text-[#f0f0f0]">Music</span>
        </div>
        <Button asChild size="sm" className="bg-pink-500 hover:bg-pink-600 text-white h-8 gap-1.5">
          <a href="https://mono.geeked.wtf/" target="_blank" rel="noreferrer">
            <ExternalLink className="h-3.5 w-3.5" />
            Open in new tab
          </a>
        </Button>
      </div>

      {/* Iframe */}
      <div className="flex-1 bg-[#0a0a0a] relative">
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-pink-500" />
            <p className="text-sm text-[#888888]">Loading music…</p>
          </div>
        )}
        <iframe
          src="https://mono.geeked.wtf/"
          title="Music"
          className="w-full h-full"
          style={{ border: "none" }}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation"
          referrerPolicy="no-referrer"
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          onLoad={() => setLoading(false)}
        />
      </div>
    </div>
  )
}
