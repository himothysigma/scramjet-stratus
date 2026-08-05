#!/usr/bin/env bash
# Synnical start script — works on Replit and any standard host.
# Runs Next.js + socket.io chat on ONE port via the custom server (server.ts).
set -e
cd "$(dirname "$0")"

echo "[synnical] Starting..."

# Ensure directories exist
mkdir -p db uploads

# Generate Prisma client + push schema
echo "[synnical] Setting up database..."
bunx prisma generate
bunx prisma db push --accept-data-loss

# Build Next.js for production
echo "[synnical] Building Next.js..."
bun run build

# Start the custom server (Next.js + socket.io on one port)
export NODE_ENV=production
export PORT=${PORT:-3000}
export HOSTNAME=0.0.0.0
export NEXT_PUBLIC_SOCKET_URL="/socket.io"

echo "[synnical] Launching on port $PORT..."
exec bun server.ts
