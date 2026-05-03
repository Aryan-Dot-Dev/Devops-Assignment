# Stage 1: Builder
# Use official Bun Alpine image for minimal build dependencies
FROM oven/bun:latest-alpine AS builder

WORKDIR /build

# Copy only source files needed for build
COPY index.ts ./
COPY package.json ./

# Install dependencies and compile TypeScript
RUN bun install --production

# Stage 2: Runtime
# Use Alpine 3.18+ for security patches and smaller footprint
FROM alpine:3.18

WORKDIR /app

# Install CA certificates for HTTPS and libc compatibility layer
RUN apk add --no-cache ca-certificates tzdata

# Create non-root user with restricted permissions
RUN addgroup -S bun && adduser -S bun -G bun

# Copy runtime binary from builder
COPY --from=builder --chown=bun:bun /usr/local/bin/bun /usr/local/bin/bun

# Copy application files from builder
COPY --from=builder --chown=bun:bun /build/index.ts ./
COPY --from=builder --chown=bun:bun /build/node_modules ./node_modules
COPY --from=builder --chown=bun:bun /build/package.json ./

# Switch to non-root user
USER bun

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD bun run -e "const res = await fetch('http://localhost:3000/health'); process.exit(res.ok ? 0 : 1)"

# Expose port
EXPOSE 3000

# Run application
CMD ["bun", "run", "index.ts"]