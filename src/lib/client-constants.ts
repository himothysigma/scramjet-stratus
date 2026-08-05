// Client-side constants for Synnical

export type GameDef = {
  id: string
  name: string
  description: string
  url: string
  cover: string
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
    cover: "/games/covers/snake.png",
    category: "Arcade",
    controls: "Arrows / WASD / Swipe",
    accent: "#22c55e",
  },
  {
    id: "2048",
    name: "2048",
    description: "Slide and merge tiles to reach 2048.",
    url: "/games/2048.html",
    cover: "/games/covers/2048.png",
    category: "Puzzle",
    controls: "Arrows / WASD / Swipe",
    accent: "#f59e0b",
  },
  {
    id: "breakout",
    name: "Breakout",
    description: "Bounce the ball, smash every brick. Don't drop it.",
    url: "/games/breakout.html",
    cover: "/games/covers/breakout.png",
    category: "Action",
    controls: "Mouse / Arrows / Touch",
    accent: "#ef4444",
  },
  {
    id: "tetris",
    name: "Tetris",
    description: "Stack tetrominoes, clear lines, climb levels.",
    url: "/games/tetris.html",
    cover: "/games/covers/tetris.png",
    category: "Puzzle",
    controls: "Arrows / Space",
    accent: "#8b5cf6",
  },
  {
    id: "pong",
    name: "Pong Duel",
    description: "Paddle vs AI. First to 7 wins. Ball speeds up every hit.",
    url: "/games/pong.html",
    cover: "/games/covers/pong.png",
    category: "Arcade",
    controls: "Mouse / Arrows / Touch",
    accent: "#06b6d4",
  },
  {
    id: "minesweeper",
    name: "Minesweeper Grid",
    description: "Find every mine without blowing up. Flag and reveal.",
    url: "/games/minesweeper.html",
    cover: "/games/covers/minesweeper.png",
    category: "Puzzle",
    controls: "Click / Right-click / Long-press",
    accent: "#f43f5e",
  },
  {
    id: "memory",
    name: "Memory Match",
    description: "Flip cards, match pairs, beat your best move count.",
    url: "/games/memory.html",
    cover: "/games/covers/memory.png",
    category: "Puzzle",
    controls: "Click / Tap",
    accent: "#eab308",
  },
  {
    id: "invaders",
    name: "Void Invaders",
    description: "Shoot the alien fleet. Survive 6 waves. Don't get hit.",
    url: "/games/invaders.html",
    cover: "/games/covers/invaders.png",
    category: "Action",
    controls: "Arrows / A-D / Space",
    accent: "#a855f7",
  },
]

// Cloud gaming regions (text codes, no flag emojis)
export const REGIONS = [
  { id: "auto", name: "Auto (Nearest)", code: "AUTO" },
  { id: "eu-west", name: "Europe West", code: "EU" },
  { id: "eu-north", name: "Europe North", code: "UK" },
  { id: "us-east", name: "US East", code: "US" },
  { id: "us-west", name: "US West", code: "US" },
  { id: "ap-south", name: "Asia South", code: "IN" },
  { id: "ap-east", name: "Asia East", code: "JP" },
] as const

// Stream quality (real — controls the game frame render scale)
export const QUALITY_LEVELS = [
  { id: "low", name: "Low (720p · 30fps)", scale: 0.75 },
  { id: "medium", name: "Medium (1080p · 60fps)", scale: 1 },
  { id: "high", name: "High (1440p · 60fps)", scale: 1.25 },
  { id: "ultra", name: "Ultra (Native)", scale: 1 },
] as const

// Browser quick links — icon is a lucide-react icon name string
import type { LucideIcon } from "lucide-react"
import {
  BookOpen, Code, Newspaper, Archive, Search, Gamepad2, Film,
} from "lucide-react"

export type QuickLink = {
  name: string
  url: string
  icon: LucideIcon
}

export const QUICK_LINKS: QuickLink[] = [
  { name: "Wikipedia", url: "https://en.wikipedia.org", icon: BookOpen },
  { name: "MDN", url: "https://developer.mozilla.org", icon: Code },
  { name: "Hacker News", url: "https://news.ycombinator.com", icon: Newspaper },
  { name: "Lobsters", url: "https://lobste.rs", icon: Newspaper },
  { name: "Archive.org", url: "https://archive.org", icon: Archive },
  { name: "DuckDuckGo", url: "https://duckduckgo.com", icon: Search },
  { name: "Raccoon", url: "https://www.raccoongame.com/#/platform/cloudgame", icon: Gamepad2 },
  { name: "Cineb", url: "https://cineb.best/", icon: Film },
]

// Search engines — icon is a lucide-react icon
export type SearchEngine = {
  id: string
  name: string
  url: string
  icon: LucideIcon
}

export const SEARCH_ENGINES: SearchEngine[] = [
  { id: "duckduckgo", name: "DuckDuckGo", url: "https://duckduckgo.com/?q=", icon: Search },
  { id: "google", name: "Google", url: "https://www.google.com/search?q=", icon: Search },
  { id: "bing", name: "Bing", url: "https://www.bing.com/search?q=", icon: Search },
  { id: "startpage", name: "Startpage", url: "https://www.startpage.com/sp/search?query=", icon: Search },
  { id: "wikipedia", name: "Wikipedia", url: "https://en.wikipedia.org/w/index.php?search=", icon: BookOpen },
]
