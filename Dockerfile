# Synnical Dockerfile — works on Render, Koyeb, Railway, Fly.io, any Docker host
# Uses Node.js for build (Bun can't run Next.js Turbopack), Bun for runtime

FROM node:20-slim AS builder
WORKDIR /app

# Copy package files
COPY package.json bun.lock* package-lock.json* ./
COPY prisma ./prisma

# Install dependencies with npm (works in all environments)
RUN npm install

# Copy source
COPY . .

# Set environment for build
ENV NEXT_PUBLIC_SOCKET_URL=/socket.io
ENV NODE_ENV=production

# Generate Prisma client + push schema (local SQLite for build, Turso at runtime)
RUN npx prisma generate
RUN npx prisma db push --accept-data-loss || true

# Build Next.js with Node.js (NOT Bun — Bun can't run Turbopack worker_threads)
RUN npx next build

# ---- Runtime stage ----
FROM node:20-slim AS runner
WORKDIR /app

# Copy built app + dependencies
COPY --from=builder /app ./

# Set environment
ENV NODE_ENV=production
ENV NEXT_PUBLIC_SOCKET_URL=/socket.io
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Expose port (Render uses PORT env, others can set it)
EXPOSE 3000

# Start the custom server (Next.js + Socket.IO on one port)
# Uses Node.js (not Bun) for maximum compatibility
CMD ["npx", "tsx", "server.ts"]
