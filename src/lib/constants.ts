// App-wide constants.
export const OWNER_PASSWORD = "Samseunlore+2711"

// Session lasts 1 year so users stay logged in across visits.
export const SESSION_COOKIE = "stratus_session"
export const SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 365

// Chat mini-service port (socket.io) — sandbox dev mode.
export const CHAT_SERVICE_PORT = 3001

// Upload directory (persisted outside public, served via API)
export const UPLOAD_DIR = "/home/z/my-project/uploads"

// Roles
export type Role = "OWNER" | "ADMIN" | "MOD" | "MEMBER"
export const ROLES: Role[] = ["OWNER", "ADMIN", "MOD", "MEMBER"]

// Avatar decorations (owner-only) — id → label
export const AVATAR_DECOS = [
  { id: "none", name: "None" },
  { id: "neon-ring", name: "Neon Ring" },
  { id: "gold-crown", name: "Gold Crown" },
  { id: "pixel-border", name: "Pixel Border" },
  { id: "glow-aura", name: "Glow Aura" },
  { id: "star-frame", name: "Star Frame" },
] as const

// Auto-punishment thresholds (configurable)
export const AUTO_PUNISHMENTS = {
  WARN_THRESHOLD_1H_MUTE: 3,    // 3 warns → 1h mute
  WARN_THRESHOLD_24H_MUTE: 5,   // 5 warns → 24h mute
  WARN_THRESHOLD_PERM_BAN: 7,   // 7 warns → permanent ban
}

// Trusted user requirements
export const TRUSTED_REQUIREMENTS = {
  MIN_ACCOUNT_AGE_DAYS: 7,
  MIN_MESSAGES: 1000,
  NO_INFRACTION_DAYS: 30, // no infractions in last 30 days
}

// Profile effects (owner-only) — id → label
export const PROFILE_EFFECTS = [
  { id: "none", name: "None" },
  { id: "falling-stars", name: "Falling Stars" },
  { id: "confetti", name: "Confetti" },
  { id: "snow", name: "Snow" },
  { id: "bubbles", name: "Bubbles" },
  { id: "fireflies", name: "Fireflies" },
] as const
