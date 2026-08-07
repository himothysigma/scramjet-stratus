"use client"

import { Crown, Shield, Wrench } from "lucide-react"
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

// Soft inner halo (kept for backwards-compat + complements the SVG overlay).
// The actual visual decoration is rendered by <AvatarDecoOverlay /> below.
const DECO_CLASS: Record<string, string> = {
  "neon-ring": "deco-neon-ring",
  "gold-crown": "deco-gold-crown",
  "pixel-border": "deco-pixel-border",
  "glow-aura": "deco-glow-aura",
  "star-frame": "deco-star-frame",
  "diamond-ring": "deco-diamond-ring",
  "fire-border": "deco-fire-border",
  "ice-crystals": "deco-ice-crystals",
  "rainbow-ring": "deco-rainbow-ring",
  "royal-frame": "deco-royal-frame",
}

// Shared props for every decoration SVG.
// viewBox "-30 -30 160 160" reserves 30 units of padding on every side so
// decorations (crowns, flames, corner stars…) can extend BEYOND the avatar's
// 100×100 box. `overflow: visible` lets that overflow render.
const SVG_PROPS = {
  viewBox: "-30 -30 160 160",
  preserveAspectRatio: "xMidYMid meet",
  "aria-hidden": true,
  focusable: false as const,
  style: {
    position: "absolute" as const,
    inset: "0",
    width: "100%",
    height: "100%",
    overflow: "visible",
    pointerEvents: "none" as const,
  },
}

/**
 * Renders real inline-SVG decorations positioned around the avatar.
 * The overlay sits ABOVE the avatar (pointer-events disabled so clicks pass
 * through to the avatar image / fallback).
 *
 * For decos that need a backdrop (e.g. glow-aura), see <AvatarDecoBackdrop />.
 */
export function AvatarDecoOverlay({ deco }: { deco: string }) {
  switch (deco) {
    case "gold-crown":
      return (
        <svg {...SVG_PROPS} className="deco-crown-bob">
          <defs>
            <linearGradient id="deco-gc-gold" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fde68a" />
              <stop offset="45%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#b45309" />
            </linearGradient>
          </defs>
          <g>
            {/* Crown body — bottom strip sits at y=14 (overlapping the top of the avatar), peaks rise above y=0 */}
            <path
              d="M 14 14 L 14 8 L 26 -12 L 36 2 L 50 -22 L 64 2 L 74 -12 L 86 8 L 86 14 Z"
              fill="url(#deco-gc-gold)"
              stroke="#7c2d12"
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
            {/* Base band */}
            <rect x="14" y="11" width="72" height="5" rx="1.5" fill="#b45309" />
            <rect x="14" y="11" width="72" height="2" rx="1" fill="#fde68a" opacity="0.6" />
            {/* Gems on the three peaks */}
            <circle cx="26" cy="-12" r="3.2" fill="#ef4444" stroke="#7f1d1d" strokeWidth="0.6" />
            <circle cx="50" cy="-22" r="3.8" fill="#3b82f6" stroke="#1e3a8a" strokeWidth="0.6" />
            <circle cx="74" cy="-12" r="3.2" fill="#22c55e" stroke="#14532d" strokeWidth="0.6" />
            {/* Tiny pearls along the band */}
            <circle cx="26" cy="13.5" r="1.6" fill="#fef3c7" />
            <circle cx="38" cy="13.5" r="1.6" fill="#fef3c7" />
            <circle cx="50" cy="13.5" r="1.6" fill="#fef3c7" />
            <circle cx="62" cy="13.5" r="1.6" fill="#fef3c7" />
            <circle cx="74" cy="13.5" r="1.6" fill="#fef3c7" />
          </g>
        </svg>
      )

    case "neon-ring":
      return (
        <svg {...SVG_PROPS}>
          <defs>
            <filter id="deco-nr-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <circle
            cx="50" cy="50" r="48"
            fill="none" stroke="#22c55e" strokeWidth="3"
            filter="url(#deco-nr-glow)"
            className="deco-neon-pulse"
          />
          <circle
            cx="50" cy="50" r="48"
            fill="none" stroke="#bbf7d0" strokeWidth="1"
            opacity="0.7"
          />
        </svg>
      )

    case "pixel-border":
      return (
        <svg {...SVG_PROPS}>
          {/* Three offset dashed rects in different colors = pixel-art vibe */}
          <rect x="-2" y="-2" width="104" height="104" rx="6"
            fill="none" stroke="#22c55e" strokeWidth="3"
            strokeDasharray="6 6" strokeDashoffset="0" />
          <rect x="3" y="3" width="94" height="94" rx="4"
            fill="none" stroke="#ec4899" strokeWidth="3"
            strokeDasharray="6 6" strokeDashoffset="3" />
          <rect x="8" y="8" width="84" height="84" rx="3"
            fill="none" stroke="#a855f7" strokeWidth="3"
            strokeDasharray="6 6" strokeDashoffset="6" />
          {/* Corner pixel squares */}
          {[
            [-6, -6], [104, -6], [-6, 104], [104, 104],
          ].map(([x, y], i) => (
            <g key={i}>
              <rect x={x - 3} y={y - 3} width="6" height="6" fill={i % 2 === 0 ? "#fbbf24" : "#22c55e"} />
              <rect x={x - 1.5} y={y - 1.5} width="3" height="3" fill="#0a0a0a" />
            </g>
          ))}
        </svg>
      )

    case "star-frame": {
      // 5-pointed gold star path centered at (0,0), radius ~12.
      const star = "M 0 -12 L 3.5 -3.7 L 12 -3.7 L 5.1 2.8 L 7.7 11.4 L 0 6 L -7.7 11.4 L -5.1 2.8 L -12 -3.7 L -3.5 -3.7 Z"
      const corners = [
        [-12, -12], [112, -12], [-12, 112], [112, 112],
      ]
      return (
        <svg {...SVG_PROPS}>
          <defs>
            <linearGradient id="deco-sf-gold" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fef3c7" />
              <stop offset="60%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#a16207" />
            </linearGradient>
          </defs>
          {corners.map(([x, y], i) => (
            <path
              key={i}
              d={star}
              transform={`translate(${x}, ${y})`}
              fill="url(#deco-sf-gold)"
              stroke="#7c2d12"
              strokeWidth="0.9"
              strokeLinejoin="round"
              className="deco-star-twinkle"
              style={{ animationDelay: `${i * 0.25}s` }}
            />
          ))}
        </svg>
      )
    }

    case "diamond-ring": {
      // Blue diamond (rotated square) with a highlight facet.
      const diamond = (
        <g>
          <path d="M 0 -10 L 9 0 L 0 10 L -9 0 Z" fill="url(#deco-dm-blue)" stroke="#1e3a8a" strokeWidth="0.9" strokeLinejoin="round" />
          <path d="M 0 -10 L 4 -3 L 0 0 L -4 -3 Z" fill="rgba(255,255,255,0.55)" />
          <path d="M 0 -10 L 9 0 L 0 0 Z" fill="rgba(255,255,255,0.18)" />
        </g>
      )
      const spots = [
        [-14, -14], [114, -14], [-14, 114], [114, 114], // corners
        [50, -16], [50, 116], [-16, 50], [116, 50],     // edge midpoints
      ]
      return (
        <svg {...SVG_PROPS}>
          <defs>
            <linearGradient id="deco-dm-blue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#bfdbfe" />
              <stop offset="50%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#1e3a8a" />
            </linearGradient>
          </defs>
          {spots.map(([x, y], i) => (
            <g key={i} transform={`translate(${x}, ${y})`} className="deco-diamond-sparkle" style={{ animationDelay: `${i * 0.3}s` }}>
              {diamond}
            </g>
          ))}
        </svg>
      )
    }

    case "fire-border": {
      // Flame teardrop path pointing up, centered at (0,0).
      // M 0 0 (base center) → curve up-left → curve up to tip → curve down-right → close.
      const flame = "M 0 0 C -7 -6 -8 -14 -3 -20 C -3 -24 0 -28 0 -28 C 0 -28 3 -24 3 -24 C 8 -18 7 -10 0 0 Z"
      // 8 flames around the avatar perimeter (top, sides, bottom, corners).
      const flames = [
        { x: 50, y: -4, rot: 0, delay: 0 },
        { x: 86, y: 14, rot: 45, delay: 0.2 },
        { x: 104, y: 50, rot: 90, delay: 0.4 },
        { x: 86, y: 86, rot: 135, delay: 0.1 },
        { x: 50, y: 104, rot: 180, delay: 0.3 },
        { x: 14, y: 86, rot: 225, delay: 0.5 },
        { x: -4, y: 50, rot: 270, delay: 0.15 },
        { x: 14, y: 14, rot: 315, delay: 0.35 },
      ]
      return (
        <svg {...SVG_PROPS}>
          <defs>
            <radialGradient id="deco-fb-fire" cx="50%" cy="70%" r="60%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="40%" stopColor="#fb923c" />
              <stop offset="80%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#7f1d1d" />
            </radialGradient>
          </defs>
          {flames.map((f, i) => (
            <g
              key={i}
              transform={`translate(${f.x}, ${f.y}) rotate(${f.rot})`}
              className="deco-flame-flicker"
              style={{ animationDelay: `${f.delay}s` }}
            >
              <path d={flame} fill="url(#deco-fb-fire)" stroke="#7c2d12" strokeWidth="0.5" />
              <path d="M 0 -2 C -3 -5 -3 -10 -1 -14 C 0 -16 0 -18 0 -18 C 0 -18 1 -16 1 -14 C 3 -10 3 -5 0 -2 Z" fill="rgba(255,240,180,0.55)" />
            </g>
          ))}
        </svg>
      )
    }

    case "ice-crystals": {
      // 6-pointed ice crystal — three overlapping thin diamonds.
      const crystal = (
        <g>
          <path d="M 0 -13 L 3.5 -3.5 L 13 -3.5 L 5.5 2 L 8 11 L 0 6 L -8 11 L -5.5 2 L -13 -3.5 L -3.5 -3.5 Z"
            fill="url(#deco-ic-ice)" stroke="#0c4a6e" strokeWidth="0.8" strokeLinejoin="round" />
          <path d="M 0 -13 L 0 6" stroke="#e0f2fe" strokeWidth="0.8" opacity="0.7" />
          <path d="M -13 -3.5 L 8 11" stroke="#e0f2fe" strokeWidth="0.6" opacity="0.5" />
          <path d="M 13 -3.5 L -8 11" stroke="#e0f2fe" strokeWidth="0.6" opacity="0.5" />
        </g>
      )
      const spots = [
        [-14, -14, 0], [114, -14, 30], [-14, 114, -30], [114, 114, 15],
        [50, -16, 0], [50, 116, 180],
      ]
      return (
        <svg {...SVG_PROPS}>
          <defs>
            <linearGradient id="deco-ic-ice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f0f9ff" />
              <stop offset="50%" stopColor="#7dd3fc" />
              <stop offset="100%" stopColor="#0369a1" />
            </linearGradient>
          </defs>
          {spots.map(([x, y, r], i) => (
            <g key={i} transform={`translate(${x}, ${y}) rotate(${r})`} className="deco-ice-shimmer" style={{ animationDelay: `${i * 0.4}s` }}>
              {crystal}
            </g>
          ))}
        </svg>
      )
    }

    case "rainbow-ring":
      // 6 colored arcs tile around the circle to form a full rainbow ring.
      // Circumference = 2π·48 ≈ 301.6, so each 1/6 arc ≈ 50.27.
      return (
        <svg {...SVG_PROPS}>
          <g>
            <animateTransform
              attributeName="transform"
              attributeType="XML"
              type="rotate"
              from="0 50 50"
              to="360 50 50"
              dur="8s"
              repeatCount="indefinite"
            />
            {[
              { c: "#ef4444", a: 0 },
              { c: "#f97316", a: 60 },
              { c: "#eab308", a: 120 },
              { c: "#22c55e", a: 180 },
              { c: "#3b82f6", a: 240 },
              { c: "#a855f7", a: 300 },
            ].map((s, i) => (
              <circle
                key={i}
                cx="50" cy="50" r="48"
                fill="none" stroke={s.c} strokeWidth="5"
                strokeDasharray="50.27 301.6"
                transform={`rotate(${s.a} 50 50)`}
                strokeLinecap="butt"
              />
            ))}
          </g>
          {/* Static thin white inner ring for definition */}
          <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
        </svg>
      )

    case "royal-frame":
      return (
        <svg {...SVG_PROPS}>
          <defs>
            <linearGradient id="deco-rf-purple" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#d8b4fe" />
              <stop offset="50%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#581c87" />
            </linearGradient>
            <linearGradient id="deco-rf-gold" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fde68a" />
              <stop offset="100%" stopColor="#b45309" />
            </linearGradient>
          </defs>
          {/* Outer ornate frame */}
          <rect x="-8" y="-8" width="116" height="116" rx="16" ry="16"
            fill="none" stroke="url(#deco-rf-purple)" strokeWidth="3.5" />
          {/* Inner thin frame */}
          <rect x="-3" y="-3" width="106" height="106" rx="11" ry="11"
            fill="none" stroke="#c084fc" strokeWidth="1" opacity="0.55" />
          {/* Corner gold gems */}
          {[
            [-8, -8], [108, -8], [-8, 108], [108, 108],
          ].map(([x, y], i) => (
            <g key={i}>
              <circle cx={x} cy={y} r="5" fill="url(#deco-rf-gold)" stroke="#7c2d12" strokeWidth="0.8" />
              <circle cx={x - 1} cy={y - 1.5} r="1.5" fill="rgba(255,255,255,0.7)" />
            </g>
          ))}
          {/* Edge midpoint pink gems */}
          {[
            [50, -8], [50, 108], [-8, 50], [108, 50],
          ].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="3.2" fill="#ec4899" stroke="#831843" strokeWidth="0.6" />
          ))}
        </svg>
      )

    default:
      return null
  }
}

/**
 * Renders a backdrop decoration that sits BEHIND the avatar
 * (e.g. the pulsing aura for "glow-aura"). Returns null for decos that
 * don't need a backdrop.
 */
export function AvatarDecoBackdrop({ deco }: { deco: string }) {
  if (deco !== "glow-aura") return null
  return (
    <svg {...SVG_PROPS} className="deco-aura-pulse">
      <defs>
        <radialGradient id="deco-ga-aura" cx="50" cy="50" r="75" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="rgba(236,72,153,0.75)" />
          <stop offset="55%" stopColor="rgba(168,85,247,0.45)" />
          <stop offset="100%" stopColor="rgba(168,85,247,0)" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="78" fill="url(#deco-ga-aura)" />
      <circle cx="50" cy="50" r="55" fill="rgba(236,72,153,0.18)" />
    </svg>
  )
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
  const hasDeco = !!avatarDeco && avatarDeco !== "none"
  const decoClass = hasDeco ? DECO_CLASS[avatarDeco as string] : ""

  // When there is no decoration, render the bare Avatar (no wrapper) to
  // preserve the exact layout/click target of the previous version.
  if (!hasDeco) {
    return (
      <Avatar className={cn(sizes[size], className)}>
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

  // With a decoration: wrap in a relative inline-flex container so the SVG
  // overlays can be positioned absolutely above & below the avatar.
  // `isolation: isolate` creates a clean stacking context so the backdrop
  // (z=0) stays behind the avatar (z=1) which stays behind the front SVG (z=2).
  return (
    <span className="relative inline-flex align-middle" style={{ isolation: "isolate" }}>
      <span className="absolute inset-0" style={{ zIndex: 0 }}>
        <AvatarDecoBackdrop deco={avatarDeco as string} />
      </span>
      <Avatar className={cn(sizes[size], decoClass, className)} style={{ position: "relative", zIndex: 1 }}>
        {src && <AvatarImage src={src} alt={name} />}
        <AvatarFallback className={cn(
          "text-xs",
          role === "OWNER" ? "bg-amber-500/15 text-amber-500" : "bg-pink-500/15 text-pink-600"
        )}>
          {name.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <span className="absolute inset-0" style={{ zIndex: 2 }}>
        <AvatarDecoOverlay deco={avatarDeco as string} />
      </span>
    </span>
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
