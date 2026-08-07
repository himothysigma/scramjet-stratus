# Synnical Dockerfile — works on HF Spaces, Koyeb, Railway, Fly.io, any Docker host
# HF Spaces requires port 7860. Other hosts use PORT env var.

FROM oven/bun:1.1 AS base
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package.json bun.lock ./
COPY prisma ./prisma

# Install dependencies
RUN bun install

# Copy source
COPY . .

# Set environment for build
ENV NEXT_PUBLIC_SOCKET_URL=/socket.io
ENV NODE_ENV=production

# Generate Prisma client + push schema
RUN bunx prisma generate
RUN bunx prisma db push --accept-data-loss || true

# Build Next.js
RUN bun run build

# Expose port (7860 for HF Spaces, 3000 for others)
EXPOSE 7860

# Start the custom server (Next.js + Socket.IO on one port)
# Uses PORT env var (HF Spaces sets PORT=7860, others can set PORT=3000)
CMD ["sh", "-c", "PORT=${PORT:-7860} bun server.ts"]
