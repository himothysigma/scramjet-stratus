"use client"

import { Crown, Shield, Wrench, User as UserIcon } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { Role } from "@/lib/api"
import { cn } from "@/lib/utils"

export function RoleBadge({ role, className }: { role: Role; className?: string }) {
  if (role === "MEMBER") return null
  const config = {
    OWNER: { label: "Owner", cls: "role-tag-owner", Icon: Crown },
    ADMIN: { label: "Admin", cls: "role-tag-admin", Icon: Shield },
    MOD: { label: "Mod", cls: "role-tag-mod", Icon: Wrench },
  }[role]
  if (!config) return null
  const { Icon } = config
  return (
    <span className={cn("role-tag", config.cls, className)}>
      <Icon className="h-2.5 w-2.5" />
      {config.label}
    </span>
  )
}

export function DisplayName({ name, role, className }: { name: string; role: Role; className?: string }) {
  return (
    <span className={cn(role === "OWNER" && "owner-name", className)}>
      {name}
    </span>
  )
}

const DECO_CLASS: Record<string, string> = {
  "neon-ring": "deco-neon-ring",
  "gold-crown": "deco-gold-crown",
  "pixel-border": "deco-pixel-border",
  "glow-aura": "deco-glow-aura",
  "star-frame": "deco-star-frame",
}

export function AvatarWithDeco({
  src,
  name,
  role,
  avatarDeco,
  isGif,
  size = "md",
  className,
}: {
  src: string | null | undefined
  name: string
  role: Role
  avatarDeco?: string | null
  isGif?: boolean
  size?: "xs" | "sm" | "md" | "lg" | "xl"
  className?: string
}) {
  const sizes = {
    xs: "h-6 w-6",
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-16 w-16",
    xl: "h-20 w-20",
  }
  const decoClass = avatarDeco && avatarDeco !== "none" ? DECO_CLASS[avatarDeco] : ""
  return (
    <Avatar className={cn(sizes[size], decoClass, className)}>
      {src && <AvatarImage src={src} alt={name} />}
      <AvatarFallback className={cn(
        "text-xs",
        role === "OWNER" ? "bg-amber-500/15 text-amber-500" : "bg-emerald-500/15 text-emerald-600"
      )}>
        {name.slice(0, 2).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  )
}

// Profile effect particles (CSS-only, owner-only feature)
export function ProfileEffectLayer({ effect }: { effect: string | null | undefined }) {
  if (!effect || effect === "none") return null

  const configs: Record<string, { emoji: string; count: number; duration: [number, number] }> = {
    "falling-stars": { emoji: "✨", count: 20, duration: [4, 9] },
    confetti: { emoji: "🎉", count: 15, duration: [3, 7] },
    snow: { emoji: "❄️", count: 25, duration: [5, 12] },
    bubbles: { emoji: "○", count: 18, duration: [4, 8] },
    fireflies: { emoji: "🟡", count: 15, duration: [6, 10] },
  }
  const cfg = configs[effect]
  if (!cfg) return null

  return (
    <div className="profile-effect-layer">
      {Array.from({ length: cfg.count }).map((_, i) => {
        const left = Math.random() * 100
        const delay = Math.random() * 5
        const dur = cfg.duration[0] + Math.random() * (cfg.duration[1] - cfg.duration[0])
        const fontSize = 10 + Math.random() * 14
        return (
          <span
            key={i}
            className="effect-particle"
            style={{
              left: `${left}%`,
              animationDelay: `${delay}s`,
              animationDuration: `${dur}s`,
              fontSize: `${fontSize}px`,
            }}
          >
            {cfg.emoji}
          </span>
        )
      })}
    </div>
  )
}
