// Client-side constants for Stratus

export type GameDef = {
  id: string
  name: string
  description: string
  url: string
  category: "Arcade" | "Puzzle" | "Action"
  controls: string
  accent: string
}

// Real, locally-hosted playable games (no external requests, work in iframe).
export const GAMES: GameDef[] = [
  {
    id: "snake",
    name: "Neon Snake",
    description: "Classic snake. Eat, grow, survive. Speeds up as you score.",
    url: "/games/snake.html",
    category: "Arcade",
    controls: "Arrows / WASD / Swipe",
    accent: "#22c55e",
  },
  {
    id: "2048",
    name: "2048",
    description: "Slide and merge tiles to reach 2048.",
    url: "/games/2048.html",
    category: "Puzzle",
    controls: "Arrows / WASD / Swipe",
    accent: "#f59e0b",
  },
  {
    id: "breakout",
    name: "Breakout",
    description: "Bounce the ball, smash every brick. Don't drop it.",
    url: "/games/breakout.html",
    category: "Action",
    controls: "Mouse / Arrows / Touch",
    accent: "#ef4444",
  },
  {
    id: "tetris",
    name: "Tetris",
    description: "Stack tetrominoes, clear lines, climb levels.",
    url: "/games/tetris.html",
    category: "Puzzle",
    controls: "Arrows / Space",
    accent: "#8b5cf6",
  },
]

// Cloud gaming regions (real preference — stored + shown, drives ping indicator)
export const REGIONS = [
  { id: "auto", name: "Auto (Nearest)", flag: "⚡" },
  { id: "eu-west", name: "Europe West", flag: "🇪🇺" },
  { id: "eu-north", name: "Europe North", flag: "🇬🇧" },
  { id: "us-east", name: "US East", flag: "🇺🇸" },
  { id: "us-west", name: "US West", flag: "🇺🇸" },
  { id: "ap-south", name: "Asia South", flag: "🇮🇳" },
  { id: "ap-east", name: "Asia East", flag: "🇯🇵" },
] as const

// Stream quality (real — controls the game frame render scale)
export const QUALITY_LEVELS = [
  { id: "low", name: "Low (720p · 30fps)", scale: 0.75 },
  { id: "medium", name: "Medium (1080p · 60fps)", scale: 1 },
  { id: "high", name: "High (1440p · 60fps)", scale: 1.25 },
  { id: "ultra", name: "Ultra (Native)", scale: 1 },
] as const

// Browser quick links (real URLs that work in iframe where allowed)
export const QUICK_LINKS = [
  { name: "Wikipedia", url: "https://en.wikipedia.org" },
  { name: "MDN", url: "https://developer.mozilla.org" },
  { name: "Hacker News", url: "https://news.ycombinator.com" },
  { name: "Lobsters", url: "https://lobste.rs" },
]
