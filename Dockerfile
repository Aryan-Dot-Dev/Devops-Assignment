# Stage 1: Builder
FROM oven/bun:1-alpine AS builder

WORKDIR /app

# Copy dependency files first (better caching)
COPY package.json bun.lock ./

RUN bun install --frozen-lockfile

# Copy source
COPY . .

# Optional: if using TS build step
# RUN bun run build


# Stage 2: Runtime
FROM oven/bun:1-alpine

WORKDIR /app

# Create non-root user
RUN addgroup -S bun && adduser -S bun -G bun

# Copy only necessary files
COPY --from=builder /app /app

USER bun

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD bun run -e "const res = await fetch('http://localhost:3000/health'); process.exit(res.ok ? 0 : 1)"

CMD ["bun", "run", "index.ts"]