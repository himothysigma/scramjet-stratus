"use client"

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Globe, Gauge, Settings, Crown, Check } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useGaming } from "@/hooks/use-gaming"
import { REGIONS, QUALITY_LEVELS } from "@/lib/client-constants"
import type { Panel } from "@/components/app-shell"
import { DisplayName } from "@/components/role-ui"

export function TopBar({ panel, onPanel }: { panel: Panel; onPanel: (p: Panel) => void }) {
  const { user } = useAuth()
  const { regionId, qualityId, setRegion, setQuality } = useGaming()

  if (!user) return null

  return (
    <header className="h-14 shrink-0 border-b border-[#2a2a2a] bg-[#0a0a0a]/80 backdrop-blur flex items-center gap-2 px-3">
      {/* Brand */}
      <button
        onClick={() => onPanel("chat")}
        className="flex items-center gap-2 px-2 mr-1 hover:opacity-80 transition-opacity"
      >
        <div className="h-8 w-8 rounded-lg bg-pink-500/10 border border-pink-500/20 flex items-center justify-center">
          <img src="/logo.svg" alt="Synnical" className="h-7 w-7" />
        </div>
        <span className="font-semibold tracking-tight hidden sm:block">Synnical</span>
      </button>

      <div className="flex-1" />

      {/* Extensions — real controls that affect cloud gaming */}
      <div className="flex items-center gap-1">
        {/* Region extension */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1.5 h-9">
              <Globe className="h-4 w-4 text-pink-500" />
              <span className="hidden md:inline text-xs">
                {REGIONS.find((r) => r.id === regionId)?.code} {REGIONS.find((r) => r.id === regionId)?.name.split(" ")[0]}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-56 p-1">
            <p className="px-2 py-1.5 text-xs font-medium text-[#888888]">Game server region</p>
            {REGIONS.map((r) => (
              <button
                key={r.id}
                onClick={() => setRegion(r.id)}
                className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-[#1a1a1a] transition-colors"
              >
                <span className="text-base">{r.code}</span>
                <span className="flex-1 text-left">{r.name}</span>
                {regionId === r.id && <Check className="h-4 w-4 text-pink-500" />}
              </button>
            ))}
          </PopoverContent>
        </Popover>

        {/* Quality extension */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1.5 h-9">
              <Gauge className="h-4 w-4 text-pink-500" />
              <span className="hidden md:inline text-xs">
                {QUALITY_LEVELS.find((q) => q.id === qualityId)?.name.split(" ")[0]}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-60 p-1">
            <p className="px-2 py-1.5 text-xs font-medium text-[#888888]">Stream quality</p>
            {QUALITY_LEVELS.map((q) => (
              <button
                key={q.id}
                onClick={() => setQuality(q.id)}
                className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-[#1a1a1a] transition-colors"
              >
                <span className="flex-1 text-left">{q.name}</span>
                {qualityId === q.id && <Check className="h-4 w-4 text-pink-500" />}
              </button>
            ))}
          </PopoverContent>
        </Popover>

        {/* Settings */}
        <Button
          variant={panel === "settings" ? "secondary" : "ghost"}
          size="sm"
          className="h-9 w-9 p-0"
          onClick={() => onPanel("settings")}
          aria-label="Settings"
        >
          <Settings className="h-4 w-4" />
        </Button>

        {/* User chip → profile */}
        <button
          onClick={() => onPanel("profile")}
          className={`flex items-center gap-2 h-9 pl-1 pr-2 rounded-md transition-colors ${
            panel === "profile" ? "bg-[#1a1a1a]" : "hover:bg-[#1a1a1a]"
          }`}
        >
          <Avatar className="h-7 w-7">
            <AvatarImage src={user.pfpUrl || undefined} alt={user.displayName} />
            <AvatarFallback className="bg-pink-500/15 text-pink-600 text-xs">
              {user.displayName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <DisplayName name={user.displayName} role={user.role} className="text-sm font-medium max-w-[100px] truncate hidden sm:block" />
          {user.role === "OWNER" && <Crown className="h-3.5 w-3.5 text-amber-500 hidden sm:block" />}
        </button>
      </div>
    </header>
  )
}
