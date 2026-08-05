# Scramjet Stratus

Minimal cloud-gaming platform with **real-time chat**, a **proxy browser**, and a **profile system**. Everything actually works — no fakes.

## Features
- **Real-time chat** (socket.io) — messages sync across devices instantly, persisted to SQLite, real online presence.
- **Persistent login** — 1-year session cookie, stays logged in across visits.
- **Cloud gaming** — 8 real, fully-playable HTML5 games (Snake, 2048, Breakout, Tetris, Pong, Minesweeper, Memory, Void Invaders) with AI-generated cover art. No shortcuts/links — they run in-app.
- **Scramjet-style proxy browser** — server-side fetch rewrites pages same-origin and strips anti-iframe headers so far more sites load. Tabs, bookmarks, history, search-engine picker, proxy toggle.
- **Profile** — pfp (circular crop) + banner (wide crop, GIFs keep animation) uploads, editable name/bio.
- **Owner verification** — enter the owner password in Settings to unlock the Owner role.

## Tech stack
- Next.js 16 (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- Prisma + SQLite
- socket.io (real-time chat)
- react-image-crop (image cropping)

## Run locally (this sandbox)
```bash
bun run db:push        # create the SQLite schema
bun run dev            # Next.js on :3000
# in another terminal:
cd mini-services/chat-service && bun run dev   # chat on :3001
```
The frontend connects to the chat service through the gateway via `/?XTransformPort=3001`.

## Run on Replit (single port — custom server)
Replit exposes one port. The custom `server.ts` runs Next.js + socket.io chat on that single port.

1. Push this project to GitHub (see below).
2. On Replit: **Create Repl → Import from GitHub**.
3. Replit auto-detects the `.replit` file. Click **Run** — it runs `start.sh` which:
   - generates the Prisma client + pushes the schema,
   - builds Next.js for production,
   - starts `server.ts` (Next.js + chat on one port).
4. Open the web view. Register an account. To become owner: **Settings → Verify ownership →** enter the owner password.

> The owner password is defined in `src/lib/constants.ts` (`OWNER_PASSWORD`). **Change it** before deploying publicly.

## Push to GitHub via device flow (automated)
This project includes `github-auth.ts` — a GitHub OAuth device-flow script.

1. Create a GitHub OAuth App at https://github.com/settings/applications/new
   - Homepage URL: `http://localhost:3000`
   - Authorization callback URL: `http://localhost:9999`
2. Copy the **Client ID**.
3. Create an empty repo on github.com (e.g. `scramjet-stratus`).
4. Run:
   ```bash
   bun github-auth.ts <your-client-id> <your-github-username> scramjet-stratus
   ```
5. The script prints a **user code** (e.g. `ABCD-1234`).
6. Open https://github.com/login/device, enter the code, authorize.
7. The script polls automatically, saves the token to `.github-token`, and pushes.
8. Import to Replit: https://replit.com/github/<your-user>/scramjet-stratus

## Push to GitHub manually
```bash
cd scramjet-stratus
git init
git add .
git commit -m "Scramjet Stratus — cloud gaming, chat, proxy browser"
git branch -M main
git remote add origin https://github.com/<your-user>/scramjet-stratus.git
git push -u origin main
```

## Environment variables
| Var | Purpose | Default |
|---|---|---|
| `DATABASE_URL` | SQLite path | `file:/home/z/my-project/db/custom.db` |
| `PORT` | HTTP port (Replit sets this) | `3000` |
| `NEXT_PUBLIC_SOCKET_URL` | socket.io endpoint. Empty → sandbox gateway mode (`/?XTransformPort=3001`). Set to `/socket.io` for Replit/custom server. | empty |

## Owner password
Set in `src/lib/constants.ts`. Change `OWNER_PASSWORD` before going live.

## Project structure
```
prisma/schema.prisma          # User, Session, Channel, Message
src/app/api/                  # auth, chat, profile, owner-verify, proxy, uploads
src/lib/chat-server.ts        # socket.io logic (used by server.ts on Replit)
src/lib/auth.ts               # cookie sessions, scrypt password hashing
server.ts                     # custom server: Next.js + chat on one port (Replit)
mini-services/chat-service/   # standalone chat service (sandbox dev mode)
public/games/                 # 8 self-contained playable HTML5 games + covers
start.sh                      # Replit/production start script
.replit                       # Replit config
```

## Honest notes
- The browser proxy rewrites HTML/CSS/URLs server-side. Simple sites (Wikipedia, MDN, news sites) load well. Complex single-page apps with heavy JS bundling may not fully work — that's an inherent limitation of any HTML-rewriting proxy, not a bug.
- Chrome Web Store extensions cannot run inside a web iframe — they require Chromium's extension runtime. The proxy + preferences (search engine, homepage, bookmarks, theme) are the real, working alternatives.
