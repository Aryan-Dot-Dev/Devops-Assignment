# Todo API — DevOps Assignment

A minimal, production-ready REST API for managing todos, built with **Bun**, containerized with **Docker**, and deployed using a full **CI/CD pipeline** and **infrastructure as code**.

---

## Live Deployment

**URL:** https://devops-assignment-latest.onrender.com

Health check:

```
GET /health → 200 OK
```

---

## Features

* RESTful API (CRUD for todos)
* Multi-stage Docker build (optimized, <150MB)
* Non-root container execution
* GitHub Actions CI/CD pipeline
* Image publishing to GitHub Container Registry (GHCR)
* Deployment via Render (IaC using `render.yaml`)
* Structured logging (JSON)
* Prometheus-compatible `/metrics` endpoint

---

## API Endpoints

| Method | Endpoint   | Description        |
| ------ | ---------- | ------------------ |
| GET    | /health    | Health check       |
| GET    | /todos     | List todos         |
| POST   | /todos     | Create todo        |
| PUT    | /todos/:id | Update todo        |
| DELETE | /todos/:id | Delete todo        |
| GET    | /metrics   | Prometheus metrics |

---

## Local Development

```bash
bun install
bun run index.ts
```

Test:

```bash
curl http://localhost:3000/health
```

---

## Docker

### Build

```bash
docker build -t todo-api .
```

### Run

```bash
docker run -p 3000:3000 todo-api
```

---

## Docker Architecture

* **Base Image:** `oven/bun:alpine`
* Multi-stage build (builder + runtime)
* Runs as non-root (`bun` user)
* Health check enabled
* Minimal runtime footprint

---

## CI/CD Pipeline

### CI (GitHub Actions)

Triggered on:

* push to `main`
* pull requests

Steps:

* Install dependencies (Bun)
* Lint code
* Run tests
* Build Docker image
* Run container
* Verify `/health`

---

### CD (GitHub Actions)

Triggered on:

* push to `main`

Steps:

* Build Docker image
* Tag with:

  * `latest`
  * commit SHA
* Push to **GHCR**

Example image:

```
ghcr.io/aryan-dot-dev/devops-assignment:latest
```

---

## Deployment (Render)

This project uses **Render Blueprint (IaC)**.

### `render.yaml`

```yaml
services:
  - type: web
    name: todo-api
    runtime: docker
    image:
      url: ghcr.io/aryan-dot-dev/devops-assignment:latest
    envVars:
      - key: LOG_LEVEL
        value: info
    healthCheckPath: /health
```

---

### Deployment Steps

1. Push code to GitHub
2. Ensure CD pipeline pushes image to GHCR
3. Connect repo to Render
4. Render pulls image and deploys

---

## Environment Variables

Configured via Render (not hardcoded):

| Variable  | Purpose       |
| --------- | ------------- |
| PORT      | Server port   |
| LOG_LEVEL | Logging level |

---

## Observability

### Logging

* JSON structured logs
* Includes:

  * method
  * path
  * status
  * latency

### Metrics

Endpoint:

```
GET /metrics
```

Exposes:

* `http_requests_total`
* `http_request_duration_seconds`

---

## Repository Structure

```
.
├── src/
├── Dockerfile
├── docker-compose.yml
├── .github/workflows/
│   ├── ci.yml
│   └── cd.yml
├── render.yaml
├── README.md
└── ANSWERS.md
```

---

## How to Reproduce (End-to-End)

```bash
git clone <repo>
cd repo

# Run locally
docker compose up

# Or build manually
docker build -t app .
docker run -p 3000:3000 app
```

---

## Key Design Decisions

* **Bun over Node** → faster startup, simpler runtime
* **Multi-stage Docker** → smaller and secure image
* **GHCR** → integrated with GitHub Actions
* **Render** → simple deployment with IaC support
* **Stateless API** → easy horizontal scaling

---

## Evaluation Checklist

* Container builds and runs ✔
* CI pipeline passes ✔
* CD pushes image ✔
* Public URL reachable ✔
* `/health` returns 200 ✔
* IaC (`render.yaml`) included ✔

---

## License

MIT
