#!/usr/bin/env bash
# Stratus start script — works on Replit and any standard host.
# Runs the Next.js app + socket.io chat on a single port (PORT or 3000)
# via the custom server (server.ts). No separate chat service needed here.
set -e
cd "$(dirname "$0")"

# Ensure the SQLite db directory exists
mkdir -p db uploads

# Ensure the Prisma client is generated + schema is pushed
bunx prisma generate
bunx prisma db push --accept-data-loss

# Build Next.js for production (uses webpack — custom servers aren't
# supported with Turbopack, so we don't pass --turbopack).
bun run build

# Hand off to the custom server (Next.js + socket.io on one port).
# NODE_ENV=production so Next serves the built app.
export NODE_ENV=production
export PORT=${PORT:-3000}
export HOSTNAME=0.0.0.0
# Tell the frontend to connect to socket.io on the SAME origin (custom server).
export NEXT_PUBLIC_SOCKET_URL="/socket.io"

exec bun server.ts
