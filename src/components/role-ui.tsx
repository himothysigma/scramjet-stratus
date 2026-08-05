"use client"

import { Crown, Shield, Wrench, User as UserIcon, Star, Sparkles, Snowflake, Circle, Hexagon } from "lucide-react"
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
        role === "OWNER" ? "bg-amber-500/15 text-amber-500" : "bg-pink-500/15 text-pink-600"
      )}>
        {name.slice(0, 2).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  )
}

// Profile effect particles (lucide icons, CSS-animated, owner-only feature)
export function ProfileEffectLayer({ effect }: { effect: string | null | undefined }) {
  if (!effect || effect === "none") return null

  const configs: Record<string, { Icon: typeof Star; count: number; duration: [number, number]; color: string; sizeRange: [number, number] }> = {
    "falling-stars": { Icon: Star, count: 20, duration: [4, 9], color: "#fbbf24", sizeRange: [10, 20] },
    confetti: { Icon: Sparkles, count: 18, duration: [3, 7], color: "#ec4899", sizeRange: [10, 18] },
    snow: { Icon: Snowflake, count: 25, duration: [5, 12], color: "#e0e7ff", sizeRange: [8, 16] },
    bubbles: { Icon: Circle, count: 18, duration: [4, 8], color: "#38bdf8", sizeRange: [8, 18] },
    fireflies: { Icon: Hexagon, count: 15, duration: [6, 10], color: "#a3e635", sizeRange: [8, 14] },
  }
  const cfg = configs[effect]
  if (!cfg) return null
  const { Icon } = cfg

  return (
    <div className="profile-effect-layer">
      {Array.from({ length: cfg.count }).map((_, i) => {
        const left = Math.random() * 100
        const delay = Math.random() * 5
        const dur = cfg.duration[0] + Math.random() * (cfg.duration[1] - cfg.duration[0])
        const size = cfg.sizeRange[0] + Math.random() * (cfg.sizeRange[1] - cfg.sizeRange[0])
        return (
          <span
            key={i}
            className="effect-particle"
            style={{
              left: `${left}%`,
              animationDelay: `${delay}s`,
              animationDuration: `${dur}s`,
            }}
          >
            <Icon style={{ width: `${size}px`, height: `${size}px`, color: cfg.color }} fill={cfg.color} />
          </span>
        )
      })}
    </div>
  )
}
