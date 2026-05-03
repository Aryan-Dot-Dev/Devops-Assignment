# Todo API Server — Production Docker Setup

A lightweight, type-safe REST API for todo management built with Bun and deployed with a production-grade Docker multi-stage build.

## Quick Start

### Local Development
```bash
bun install
bun --watch index.ts
```

### Docker Build & Run
```bash
# Build image
docker build -t todo-api:latest .

# Run container
docker run -p 3000:3000 todo-api:latest

# Verify health
curl http://localhost:3000/health
```

---

## API Endpoints

| Method | Endpoint       | Description                  | Body                  |
|--------|----------------|------------------------------|-----------------------|
| GET    | `/health`      | Health check                 | N/A                   |
| GET    | `/todos`       | List all todos               | N/A                   |
| POST   | `/todos`       | Create todo                  | `{title, done?}`      |
| PUT    | `/todos/:id`   | Update todo (partial)        | `{title?, done?}`     |
| DELETE | `/todos/:id`   | Delete todo                  | N/A                   |

### Example Requests

```bash
# Health check
curl http://localhost:3000/health
# {"status":"ok"}

# List todos
curl http://localhost:3000/todos

# Create todo
curl -X POST http://localhost:3000/todos \
  -H "Content-Type: application/json" \
  -d '{"title":"Buy milk","done":false}'

# Update todo
curl -X PUT http://localhost:3000/todos/1 \
  -H "Content-Type: application/json" \
  -d '{"done":true}'

# Delete todo
curl -X DELETE http://localhost:3000/todos/1
```

---

## Docker Architecture

### Multi-Stage Build Rationale

The Dockerfile uses a **two-stage build pattern** to optimize for size and security:

#### **Stage 1: Builder** (`oven/bun:latest-alpine`)
- Includes full Bun toolchain (compiler, package manager, TypeScript support)
- Compiles TypeScript and resolves dependencies
- ~1.5 GB uncompressed (discarded after build)

#### **Stage 2: Runtime** (`alpine:3.18`)
- Minimal Alpine Linux base (~7 MB)
- Only copies compiled artifacts and runtime binaries from builder
- No build tools, no TypeScript compiler, no source maps
- Security-hardened and patched

### Base Image Choice: Alpine 3.18

**Why Alpine?**

| Aspect | Benefit |
|--------|---------|
| **Size** | ~7 MB base vs 50-100 MB for Debian-based images |
| **Security** | Minimal attack surface; fewer packages = fewer vulnerabilities |
| **Build Time** | Layer caching and small pulls; faster CI/CD pipelines |
| **Production Fit** | Industry standard for containerized microservices |
| **musl libc** | Fully compatible with Bun; standard in Go/Rust communities |

**Trade-offs:**
- Larger package (Alpine) vs larger base image (Debian) — we win on Alpine
- Requires `ca-certificates` for HTTPS (explicitly added)
- No `bash` (uses `sh`); acceptable for stateless API servers

### Image Size Verification

```bash
# Check final image size
docker images todo-api:latest

# Expected output: <150 MB (typically 60-80 MB with Bun binary)
```

---

## Security & Production Hardening

### Non-Root User Execution
```dockerfile
RUN addgroup -S bun && adduser -S bun -G bun
USER bun
```
- Container runs as `bun` user (UID 1000+), not `root`
- Prevents privilege escalation if container is compromised
- Limits damage from container escape exploits

### No Secrets in Image
- `.env` files explicitly listed in `.dockerignore`
- Environment variables injected at **runtime** via `docker run -e` or orchestrator (K8s secrets, Docker Compose `.env`)
- No hardcoded API keys, database credentials, or tokens in image layers

### Health Check
```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3
```
- Validates `/health` endpoint every 30 seconds
- Kubernetes and Docker Swarm use this for service reliability
- Automatic container restart on repeated failures

### Minimal Dependencies
```dockerfile
RUN apk add --no-cache ca-certificates tzdata
```
- Only runtime essentials (SSL certs, timezone data)
- `--no-cache` prevents apt-get layer caching bloat

---

## Environment Variables

Configure at **runtime**, not build time:

```bash
docker run \
  -p 3000:3000 \
  -e PORT=3000 \
  todo-api:latest
```

Or with Docker Compose:
```yaml
services:
  api:
    image: todo-api:latest
    ports:
      - "3000:3000"
    environment:
      PORT: 3000
```

---

## Performance & Optimization

### Why Bun?
- **Speed**: Compiled to standalone binary; no V8 startup overhead
- **Zero-Dependency**: Native HTTP server (no Express needed)
- **TypeScript Native**: Runs `.ts` directly without extra tooling
- **Memory Efficient**: ~30-50 MB runtime footprint

### Layer Caching
```dockerfile
COPY package.json ./
RUN bun install --production  # Cached if package.json unchanged

COPY index.ts ./               # Only recopied on source changes
```

---

## Deployment Examples

### Docker CLI
```bash
docker run -d \
  --name todo-api \
  -p 3000:3000 \
  --restart unless-stopped \
  todo-api:latest
```

### Docker Compose
```yaml
version: "3.8"
services:
  api:
    build: .
    ports:
      - "3000:3000"
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000/health"]
      interval: 30s
      timeout: 3s
      retries: 3
```

### Kubernetes
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: todo-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: todo-api
  template:
    metadata:
      labels:
        app: todo-api
    spec:
      containers:
      - name: api
        image: todo-api:latest
        ports:
        - containerPort: 3000
        env:
        - name: PORT
          value: "3000"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 30
        resources:
          requests:
            memory: "64Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "500m"
```

---

## File Structure

```
.
├── index.ts              # Main server code
├── package.json          # Bun dependencies & scripts
├── Dockerfile            # Multi-stage build
├── .dockerignore         # Build context exclusions
└── README.md            # This file
```

---

## Troubleshooting

### Image Size Larger Than Expected?
```bash
docker history todo-api:latest
```
Check individual layer sizes. If builder stage is large, ensure `--production` flag in `bun install`.

### Container Won't Start?
```bash
docker logs todo-api
docker run -it todo-api:latest /bin/sh  # Interactive debugging
```

### Permission Denied Errors?
Ensure files are owned by `bun:bun`:
```dockerfile
COPY --chown=bun:bun /build/index.ts ./
```

---

## License

MIT