"use client"

import { useState, lazy, Suspense } from "react"
import { TopBar } from "@/components/top-bar"
import { ErrorBoundary } from "@/components/error-boundary"
import { MessageSquare, Gamepad2, Globe, User, Settings, Users, Shield, Music, Bot, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"

// Lazy load panels — only load what the user actually opens
const ChatPanel = lazy(() => import("@/components/chat-panel").then(m => ({ default: m.ChatPanel })))
const FriendsPanel = lazy(() => import("@/components/friends-panel").then(m => ({ default: m.FriendsPanel })))
const CloudGamingPanel = lazy(() => import("@/components/cloud-gaming-panel").then(m => ({ default: m.CloudGamingPanel })))
const ProfilePanel = lazy(() => import("@/components/profile-panel").then(m => ({ default: m.ProfilePanel })))
const SettingsPanel = lazy(() => import("@/components/settings-panel").then(m => ({ default: m.SettingsPanel })))
const InfractionsPanel = lazy(() => import("@/components/infractions-panel").then(m => ({ default: m.InfractionsPanel })))
const MusicPanel = lazy(() => import("@/components/music-panel").then(m => ({ default: m.MusicPanel })))
const AIPanel = lazy(() => import("@/components/ai-panel").then(m => ({ default: m.AIPanel })))
const AdultPanel = lazy(() => import("@/components/adult-panel").then(m => ({ default: m.AdultPanel })))
// BrowserPanel loaded directly (was causing issues with lazy loading)
import { BrowserPanel } from "@/components/browser-panel"

export type Panel = "chat" | "friends" | "moderation" | "cloud-gaming" | "browser" | "music" | "ai" | "adult" | "profile" | "settings"

const NAV: { id: Panel; label: string; icon: typeof MessageSquare; modOnly?: boolean }[] = [
  { id: "chat", label: "Chat", icon: MessageSquare },
  { id: "friends", label: "Friends", icon: Users },
  { id: "moderation", label: "Moderation", icon: Shield, modOnly: true },
  { id: "cloud-gaming", label: "Gaming", icon: Gamepad2 },
  { id: "browser", label: "Synnical", icon: Globe },
  { id: "music", label: "Music", icon: Music },
  { id: "ai", label: "AI Assistant", icon: Bot },
  { id: "adult", label: "18+ Adult", icon: AlertTriangle },
  { id: "profile", label: "Profile", icon: User },
  { id: "settings", label: "Settings", icon: Settings },
]

export function AppShell() {
  const [panel, setPanel] = useState<Panel>("chat")
  const { user } = useAuth()

  const isMod = user?.role === "OWNER" || user?.role === "ADMIN" || user?.role === "MOD"
  const visibleNav = NAV.filter((item) => !item.modOnly || isMod)

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a]">
      <TopBar panel={panel} onPanel={setPanel} />

      <div className="flex-1 flex min-h-0">
        {/* Icon rail */}
        <nav className="w-14 sm:w-16 shrink-0 border-r border-[#2a2a2a] bg-[#0d0d0d] flex flex-col items-center py-3 gap-1 overflow-y-auto custom-scroll">
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
                  active ? "bg-pink-500/10 text-pink-500" : "text-[#888888] hover:bg-[#1a1a1a] hover:text-[#f0f0f0]"
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
          <Suspense fallback={<div className="flex items-center justify-center h-full"><div className="h-6 w-6 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" /></div>}>
            <ErrorBoundary>
              {panel === "chat" && <ChatPanel />}
              {panel === "friends" && <FriendsPanel />}
              {panel === "moderation" && isMod && <InfractionsPanel />}
              {panel === "cloud-gaming" && <CloudGamingPanel />}
              {panel === "browser" && <BrowserPanel />}
              {panel === "music" && <MusicPanel />}
              {panel === "ai" && <AIPanel />}
              {panel === "adult" && <AdultPanel />}
              {panel === "profile" && <ProfilePanel />}
              {panel === "settings" && <SettingsPanel />}
            </ErrorBoundary>
          </Suspense>
        </main>
      </div>

      {/* Sticky functional footer */}
      <footer className="h-8 shrink-0 border-t border-[#2a2a2a] bg-[#0a0a0a] flex items-center justify-between px-3 text-xs text-[#888888]">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-pink-500 animate-pulse" />
          <span>Synnical</span>
        </div>
        <span className="hidden sm:block">everything here actually works</span>
      </footer>
    </div>
  )
}
