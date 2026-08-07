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

export const GAMES: GameDef[] = [
  { id: "snake", name: "Neon Snake", description: "Classic snake. Eat, grow, survive. Speeds up as you score.", url: "/games/snake.html", cover: "/games/covers/snake.png", category: "Arcade", controls: "Arrows / WASD / Swipe", accent: "#22c55e" },
  { id: "2048", name: "2048", description: "Slide and merge tiles to reach 2048.", url: "/games/2048.html", cover: "/games/covers/2048.png", category: "Puzzle", controls: "Arrows / WASD / Swipe", accent: "#f59e0b" },
  { id: "breakout", name: "Breakout", description: "Bounce the ball, smash every brick. Don't drop it.", url: "/games/breakout.html", cover: "/games/covers/breakout.png", category: "Action", controls: "Mouse / Arrows / Touch", accent: "#ef4444" },
  { id: "tetris", name: "Tetris", description: "Stack tetrominoes, clear lines, climb levels.", url: "/games/tetris.html", cover: "/games/covers/tetris.png", category: "Puzzle", controls: "Arrows / Space", accent: "#8b5cf6" },
  { id: "pong", name: "Pong Duel", description: "Paddle vs AI. First to 7 wins. Ball speeds up every hit.", url: "/games/pong.html", cover: "/games/covers/pong.png", category: "Arcade", controls: "Mouse / Arrows / Touch", accent: "#06b6d4" },
  { id: "minesweeper", name: "Minesweeper Grid", description: "Find every mine without blowing up. Flag and reveal.", url: "/games/minesweeper.html", cover: "/games/covers/minesweeper.png", category: "Puzzle", controls: "Click / Right-click / Long-press", accent: "#f43f5e" },
  { id: "memory", name: "Memory Match", description: "Flip cards, match pairs, beat your best move count.", url: "/games/memory.html", cover: "/games/covers/memory.png", category: "Puzzle", controls: "Click / Tap", accent: "#eab308" },
  { id: "invaders", name: "Void Invaders", description: "Shoot the alien fleet. Survive 6 waves. Don't get hit.", url: "/games/invaders.html", cover: "/games/covers/invaders.png", category: "Action", controls: "Arrows / A-D / Space", accent: "#a855f7" },
  { id: "flappy", name: "Flappy Pink", description: "Tap to flap, dodge the pipes. How far can you fly?", url: "/games/flappy.html", cover: "", category: "Arcade", controls: "Click / Space / Tap", accent: "#ec4899" },
  { id: "tictactoe", name: "Tic Tac Toe", description: "Classic 3x3 vs smart AI. Get three in a row to win.", url: "/games/tictactoe.html", cover: "", category: "Puzzle", controls: "Click / Tap", accent: "#ec4899" },
  { id: "chess", name: "Mini Chess", description: "Two-player chess on a full 8x8 board. Basic rules.", url: "/games/chess.html", cover: "", category: "Puzzle", controls: "Click to move", accent: "#ec4899" },
  { id: "sudoku", name: "Mini Sudoku", description: "Relaxing 4x4 sudoku. Fill every row, column and box.", url: "/games/sudoku.html", cover: "", category: "Puzzle", controls: "Click / Tap", accent: "#ec4899" },
]

// Regions — text codes, no flag emojis
export const REGIONS = [
  { id: "auto", name: "Auto (Nearest)", code: "AUTO" },
  { id: "eu-west", name: "Europe West", code: "EU" },
  { id: "eu-north", name: "Europe North", code: "UK" },
  { id: "us-east", name: "US East", code: "US" },
  { id: "us-west", name: "US West", code: "US" },
  { id: "ap-south", name: "Asia South", code: "IN" },
  { id: "ap-east", name: "Asia East", code: "JP" },
] as const

export const QUALITY_LEVELS = [
  { id: "low", name: "Low (0.75x scale)", scale: 0.75 },
  { id: "medium", name: "Medium (1x scale)", scale: 1 },
  { id: "high", name: "High (1.25x scale)", scale: 1.25 },
  { id: "ultra", name: "Ultra (native)", scale: 1 },
] as const

// External cloud game sources (embedded under Gaming → Cloud Games tab)
// These are real game platforms loaded in an iframe.
export type GameSource = {
  id: string
  name: string
  url: string
  thumbnail: string
  description: string
}

export const GAME_SOURCES: GameSource[] = [
  { id: "raccoon", name: "Raccoon Cloud Games", url: "https://www.raccoongame.com/#/platform/cloudgame", thumbnail: "https://www.google.com/s2/favicons?domain=raccoongame.com&sz=128", description: "AAA cloud gaming — stream games directly in browser." },
  { id: "crazygames", name: "CrazyGames", url: "https://www.crazygames.com/", thumbnail: "https://www.google.com/s2/favicons?domain=crazygames.com&sz=128", description: "Thousands of free browser games." },
  { id: "genizymath", name: "Genizy Math Games", url: "https://genizymath.github.io/", thumbnail: "https://www.google.com/s2/favicons?domain=genizymath.github.io&sz=128", description: "Educational + fun math games." },
  { id: "crackstuff", name: "Crackstuff Games", url: "https://crackstuff.pages.dev/games", thumbnail: "https://www.google.com/s2/favicons?domain=crackstuff.pages.dev&sz=128", description: "Cracked/unblocked game collection." },
]

// Quick links — real website thumbnails (favicons via Google's service, NOT emojis/icons)
export type QuickLink = { name: string; url: string; thumbnail: string }

export const QUICK_LINKS: QuickLink[] = [
  { name: "Wikipedia", url: "https://en.wikipedia.org", thumbnail: "https://www.google.com/s2/favicons?domain=en.wikipedia.org&sz=128" },
  { name: "MDN", url: "https://developer.mozilla.org", thumbnail: "https://www.google.com/s2/favicons?domain=developer.mozilla.org&sz=128" },
  { name: "Hacker News", url: "https://news.ycombinator.com", thumbnail: "https://www.google.com/s2/favicons?domain=news.ycombinator.com&sz=128" },
  { name: "Lobsters", url: "https://lobste.rs", thumbnail: "https://www.google.com/s2/favicons?domain=lobste.rs&sz=128" },
  { name: "Archive.org", url: "https://archive.org", thumbnail: "https://www.google.com/s2/favicons?domain=archive.org&sz=128" },
  { name: "DuckDuckGo", url: "https://duckduckgo.com", thumbnail: "https://www.google.com/s2/favicons?domain=duckduckgo.com&sz=128" },
  { name: "Raccoon", url: "https://www.raccoongame.com/#/platform/cloudgame", thumbnail: "https://www.google.com/s2/favicons?domain=raccoongame.com&sz=128" },
  { name: "Cineb", url: "https://cineb.best/", thumbnail: "https://www.google.com/s2/favicons?domain=cineb.best&sz=128" },
]

// Search engines — lucide icons
import type { LucideIcon } from "lucide-react"
import { Search, BookOpen } from "lucide-react"

export type SearchEngine = { id: string; name: string; url: string; icon: LucideIcon }

export const SEARCH_ENGINES: SearchEngine[] = [
  { id: "duckduckgo", name: "DuckDuckGo", url: "https://duckduckgo.com/?q=", icon: Search },
  { id: "google", name: "Google", url: "https://www.google.com/search?q=", icon: Search },
  { id: "bing", name: "Bing", url: "https://www.bing.com/search?q=", icon: Search },
  { id: "startpage", name: "Startpage", url: "https://www.startpage.com/sp/search?query=", icon: Search },
  { id: "wikipedia", name: "Wikipedia", url: "https://en.wikipedia.org/w/index.php?search=", icon: BookOpen },
]
