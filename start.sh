#!/usr/bin/env bash
# Synnical start script — works on Replit, HF Spaces, Koyeb, Railway, any host.
# Runs Next.js + socket.io chat on a single port via the custom server (server.ts).
set -e
cd "$(dirname "$0")"

echo "[synnical] Starting..."

# Ensure directories exist
mkdir -p db uploads

# Generate Prisma client
echo "[synnical] Generating Prisma client..."
bunx prisma generate

# Push schema to database (works with both local SQLite and Turso)
echo "[synnical] Pushing database schema..."
bunx prisma db push --accept-data-loss || echo "[synnical] WARNING: db push failed, continuing..."

# Set NEXT_PUBLIC_SOCKET_URL BEFORE build (Next.js bakes public env vars at build time)
export NEXT_PUBLIC_SOCKET_URL="/socket.io"

# Build Next.js for production
echo "[synnical] Building Next.js..."
bun run build

# Start the custom server (Next.js + socket.io on one port)
# HF Spaces uses port 7860, others use PORT env var or default 3000
export NODE_ENV=production
export PORT=${PORT:-3000}
export HOSTNAME=0.0.0.0

echo "[synnical] Launching on port $PORT..."
exec bun server.ts
