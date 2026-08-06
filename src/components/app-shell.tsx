"use client"

import { useState } from "react"
import { TopBar } from "@/components/top-bar"
import { ChatPanel } from "@/components/chat-panel"
import { CloudGamingPanel } from "@/components/cloud-gaming-panel"
import { BrowserPanel } from "@/components/browser-panel"
import { ProfilePanel } from "@/components/profile-panel"
import { SettingsPanel } from "@/components/settings-panel"
import { FriendsPanel } from "@/components/friends-panel"
import { InfractionsPanel } from "@/components/infractions-panel"
import { MessageSquare, Gamepad2, Globe, User, Settings, Users, Shield } from "lucide-react"
import { cn } from "@/lib/utils"
import { useGaming } from "@/hooks/use-gaming"
import { useAuth } from "@/hooks/use-auth"
import { REGIONS } from "@/lib/client-constants"

export type Panel = "chat" | "cloud-gaming" | "browser" | "friends" | "moderation" | "profile" | "settings"

const NAV: { id: Panel; label: string; icon: typeof MessageSquare; modOnly?: boolean }[] = [
  { id: "chat", label: "Chat", icon: MessageSquare },
  { id: "friends", label: "Friends", icon: Users },
  { id: "moderation", label: "Moderation", icon: Shield, modOnly: true },
  { id: "cloud-gaming", label: "Gaming", icon: Gamepad2 },
  { id: "browser", label: "Synnical", icon: Globe },
  { id: "profile", label: "Profile", icon: User },
  { id: "settings", label: "Settings", icon: Settings },
]

export function AppShell() {
  const [panel, setPanel] = useState<Panel>("chat")
  const { regionId } = useGaming()
  const { user } = useAuth()
  const region = REGIONS.find((r) => r.id === regionId) || REGIONS[0]

  const isMod = user?.role === "OWNER" || user?.role === "ADMIN" || user?.role === "MOD"
  const visibleNav = NAV.filter((item) => !item.modOnly || isMod)

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TopBar panel={panel} onPanel={setPanel} />

      <div className="flex-1 flex min-h-0">
        {/* Icon rail */}
        <nav className="w-14 sm:w-16 shrink-0 border-r border-border bg-background flex flex-col items-center py-3 gap-1">
          {visibleNav.map((item) => {
            const Icon = item.icon
            const active = panel === item.id
            return (
              <button
                key={item.id}
                onClick={() => setPanel(item.id)}
                aria-label={item.label}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group relative flex flex-col items-center justify-center gap-1 w-11 h-12 rounded-lg transition-colors",
                  active ? "bg-pink-500/10 text-pink-600" : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] font-medium hidden sm:block">{item.label.split(" ")[0]}</span>
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-0.5 rounded-r bg-pink-500" />
                )}
              </button>
            )
          })}
        </nav>

        {/* Panel content */}
        <main className="flex-1 min-w-0 min-h-0 overflow-hidden">
          {panel === "chat" && <ChatPanel />}
          {panel === "friends" && <FriendsPanel />}
          {panel === "moderation" && isMod && <InfractionsPanel />}
          {panel === "cloud-gaming" && <CloudGamingPanel />}
          {panel === "browser" && <BrowserPanel />}
          {panel === "profile" && <ProfilePanel />}
          {panel === "settings" && <SettingsPanel />}
        </main>
      </div>

      {/* Sticky functional footer — region + status */}
      <footer className="h-8 shrink-0 border-t border-border bg-background flex items-center justify-between px-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-pink-500 animate-pulse" />
          <span>Region: {region.code} {region.name}</span>
        </div>
        <span className="hidden sm:block">Stratus · everything here actually works</span>
      </footer>
    </div>
  )
}
