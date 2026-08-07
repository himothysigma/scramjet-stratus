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

// 50 specific, real, playable browser games hosted on CrazyGames.
// Each entry links directly to the game's page on crazygames.com and uses
// the real CrazyGames favicon (served via Google's S2 favicon service).
// All games share the crazygames.com domain, so the favicon is the same —
// it is a real icon (not AI-generated), and the card distinguishes each
// game by its name, description, and category badge.
export type CloudGameCategory =
  | "Arcade"
  | "Puzzle"
  | "Action"
  | "Racing"
  | "Sports"
  | "Strategy"

export type CloudGame = {
  id: string
  name: string
  url: string
  thumbnail: string
  description: string
  category: CloudGameCategory
}

const CG_FAVICON = "https://www.google.com/s2/favicons?domain=www.crazygames.com&sz=128"
const cg = (
  slug: string,
  name: string,
  description: string,
  category: CloudGameCategory,
): CloudGame => ({
  id: slug,
  name,
  url: `https://www.crazygames.com/game/${slug}`,
  thumbnail: CG_FAVICON,
  description,
  category,
})

export const CLOUD_GAMES: CloudGame[] = [
  cg("shell-shockers", "Shell Shockers", "Egg-based multiplayer FPS. Crack your enemies before they crack you.", "Action"),
  cg("krunker", "Krunker.io", "Fast-paced blocky FPS with parkour movement and multiple game modes.", "Action"),
  cg("smash-karts", "Smash Karts", "Drive a kart, grab weapons, smash opponents in chaotic arena battles.", "Action"),
  cg("rooftop-snipers", "Rooftop Snipers", "Two-button 1v1 sniper duel on a rooftop. Knock your friend off.", "Action"),
  cg("getaway-shootout", "Getaway Shootout", "Two-player chase with weird physics and absurd weapons.", "Action"),
  cg("wolfenstein-3d", "Wolfenstein 3D", "The original FPS. Blast Nazis through maze-like castle corridors.", "Action"),
  cg("doom", "DOOM", "Play the legendary 1993 demon-shooting FPS right in your browser.", "Action"),
  cg("quaketouch", "Quake Touch", "Browser port of the iconic fast arena shooter Quake.", "Action"),
  cg("combat-online", "Combat Online", "Blocky tactical FPS with multiple maps, modes, and a server browser.", "Action"),
  cg("break-bricks", "Break Bricks", "Smash every brick with a bouncing ball and paddle.", "Action"),
  cg("vex", "Vex", "Stickman platformer with spikes, traps, and tight parkour runs.", "Action"),
  cg("happy-wheels", "Happy Wheels", "Infamous physics obstacle course with hilariously brutal ragdolls.", "Action"),
  cg("basketball-stars", "Basketball Stars", "1v1 street basketball with slick moves, dunks, and quick matches.", "Sports"),
  cg("soccer-skills", "Soccer Skills", "Fast 3v3 soccer with quick matches and simple swipe controls.", "Sports"),
  cg("throwing-toss", "Throwing Toss", "Launch a turtle from a cannon and see how far you can fling it.", "Sports"),
  cg("basketball-legends", "Basketball Legends", "Arcade-style 1v1 hoops with oversized stars and special moves.", "Sports"),
  cg("8-ball-pool", "8 Ball Pool", "Classic pool hall 8-ball. Aim, set spin, sink your balls first.", "Sports"),
  cg("archery-world-tour", "Archery World Tour", "Aim and shoot arrows across world tour stops with realistic physics.", "Sports"),
  cg("bowling-stars", "Bowling Stars", "Realistic 3D bowling with spin, oil patterns, and tournaments.", "Sports"),
  cg("mini-golf-club", "Mini Golf Club", "Top-down mini golf across creative obstacle-filled courses.", "Sports"),
  cg("ping-pong", "Ping Pong", "Table tennis with smooth controls and competitive rallies.", "Sports"),
  cg("tennis-masters", "Tennis Masters", "2D arcade tennis with special moves and 1v1 or 2v2 modes.", "Sports"),
  cg("volleyball", "Volleyball", "Beach volleyball with simple controls and satisfying digs.", "Sports"),
  cg("boxing-random", "Boxing Random", "Hilarious physics boxing with random rules every round.", "Sports"),
  cg("soccer-random", "Soccer Random", "Wobbly 2-button soccer where every goal is a comedy of errors.", "Sports"),
  cg("basketball-random", "Basketball Random", "Two-button ragdoll basketball with absurd jump physics.", "Sports"),
  cg("moto-x3m", "Moto X3M", "Ride a dirt bike through deadly obstacle courses and beat the clock.", "Racing"),
  cg("drift-hunters", "Drift Hunters", "Tune your car and chain massive drifts across multiple tracks.", "Racing"),
  cg("snow-rider-3d", "Snow Rider 3D", "Sled down snowy hills, dodge trees, and grab gifts on the way.", "Racing"),
  cg("tunnel-rush", "Tunnel Rush", "Race through neon tunnels dodging obstacles at blistering speed.", "Arcade"),
  cg("stickman-hook", "Stickman Hook", "Swing through levels like Spider-Man with sticky grappling hooks.", "Arcade"),
  cg("flappy-bird", "Flappy Bird", "Tap to flap through the pipes. Endlessly frustrating, endlessly fun.", "Arcade"),
  cg("tower-building", "Tower Builder", "Stack blocks perfectly to build the tallest tower you can.", "Arcade"),
  cg("stack-balls", "Stack Ball", "Smash a ball through rotating helix platforms without hitting red.", "Arcade"),
  cg("helix-jump", "Helix Jump", "Guide a ball down a rotating helix, avoiding red zones.", "Arcade"),
  cg("awkward-raccoon", "Awkward Raccoon", "Quirky arcade adventure starring a mischievous raccoon.", "Arcade"),
  cg("parking-fury", "Parking Fury", "Park cars precisely without scratching them across tricky lots.", "Puzzle"),
  cg("bubble-shooter", "Bubble Shooter", "Match-three bubble popping. Clear the board before it drops.", "Puzzle"),
  cg("solitaire-classic", "Solitaire Classic", "Klondike solitaire. Sort the deck into suits from Ace to King.", "Puzzle"),
  cg("mahjong", "Mahjong", "Tile-matching solitaire. Pair identical tiles to clear the board.", "Puzzle"),
  cg("sudoku-classic", "Sudoku Classic", "9x9 number logic puzzle. Fill every row, column, and box.", "Puzzle"),
  cg("tetris", "Tetris", "Stack falling tetrominoes and clear lines in the timeless classic.", "Puzzle"),
  cg("2048", "2048", "Slide and merge numbered tiles to reach the elusive 2048.", "Puzzle"),
  cg("minesweeper", "Minesweeper", "Flag the mines and reveal the board without blowing up.", "Puzzle"),
  cg("bubble-game", "Bubble Game", "Casual bubble popping with relaxing pastel colors.", "Puzzle"),
  cg("fireboy-and-watergirl", "Fireboy & Watergirl", "Two-player cooperative puzzle platformer with elemental heroes.", "Puzzle"),
  cg("snail-bob", "Snail Bob", "Point-and-click puzzle adventure to guide a snail safely home.", "Puzzle"),
  cg("raft-wars", "Raft Wars", "Turn-based projectile duel on the water. Aim, fire, splash.", "Strategy"),
  cg("chess-online", "Chess Online", "Full chess with online multiplayer, bots, and rated play.", "Strategy"),
  cg("checkers", "Checkers", "Classic draughts. Jump and capture all of your opponent's pieces.", "Strategy"),
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
