# Synnical Dockerfile — works on Render, Koyeb, Railway, Fly.io
# Uses Node.js for build (Bun can't run Turbopack), Node for runtime

FROM node:20-slim AS builder
WORKDIR /app

# Install system dependencies for Prisma (if needed)
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package.json bun.lock* package-lock.json* ./
COPY prisma ./prisma

# Install dependencies
RUN npm install

# Copy source
COPY . .

# Set environment for build — RELATIVE path (works in any container)
ENV DATABASE_URL=file:./db/custom.db
ENV NEXT_PUBLIC_SOCKET_URL=/socket.io
ENV NODE_ENV=production

# Create db directory
RUN mkdir -p db uploads

# Generate Prisma client
RUN npx prisma generate

# Push schema to local SQLite (for initial build — use Turso env vars at runtime for persistence)
RUN npx prisma db push --accept-data-loss || true

# Build Next.js with Node.js (NOT Bun)
RUN npx next build

# ---- Runtime stage ----
FROM node:20-slim AS runner
WORKDIR /app

# Copy everything from builder
COPY --from=builder /app ./

# Create directories for runtime
RUN mkdir -p db uploads

# Set environment — RELATIVE paths (work in any container)
ENV DATABASE_URL=file:./db/custom.db
ENV NEXT_PUBLIC_SOCKET_URL=/socket.io
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Expose port
EXPOSE 3000

# Start the custom server (Next.js + Socket.IO on one port)
CMD ["npx", "tsx", "server.ts"]
