# Stage 1: Builder
FROM oven/bun:1-alpine AS builder

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .


# Stage 2: Runtime
FROM oven/bun:1-alpine

WORKDIR /app

# Copy from builder stage (must match EXACT name)
COPY --from=builder /app /app

USER bun

EXPOSE 3000

CMD ["bun", "run", "index.ts"]