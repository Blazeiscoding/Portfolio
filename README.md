## Portfolio – Docker + Caddy deployment (GCP VM)

This project is an Astro-based portfolio (`nikhilrathore.com`) configured to run on a VM using Docker and Caddy with automatic HTTPS.

### Prerequisites

- A GCP VM (Linux) with:
  - Docker and Docker Compose installed
  - Ports **80** and **443** open in the firewall
- Domain DNS (Spaceship) pointing to the VM:
  - `A @` → your VM external IP
  - `A www` → your VM external IP

### Environment variables

Create a `.env` file on the VM (do **not** commit it). For example:

```bash
GITHUB_TOKEN=your_token_here
UPSTASH_REDIS_REST_URL=https://your-db.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_upstash_rest_token
```

The `.dockerignore` ensures `.env` is not baked into images.

### Build & run with Docker + Caddy

On the VM, clone the repo and run:

```bash
git clone <this-repo-url> portfolio
cd portfolio

# First build and start
docker compose up -d --build
```

This will:

- Build the `portfolio` service using the `Dockerfile` (Node adapter, production build).
- Start the `caddy` service which:
  - Listens on ports **80/443**
  - Obtains/renews Let’s Encrypt certificates for `nikhilrathore.com` and `www.nikhilrathore.com`
  - Reverse-proxies traffic to the `portfolio` container on port `4321`

### Configuration overview

- `astro.config.mjs`
  - Uses `@astrojs/node` as the default adapter (for Docker/VM).
  - Falls back to `@astrojs/vercel` when `DEPLOY_TARGET=vercel` is set.
- `Dockerfile`
  - Multi-stage build:
    - Install deps
    - Run `npm run build`
    - Run the Node server from `dist/server/entry.mjs` on port `4321`
- `docker-compose.yml`
  - `portfolio` service (internal only, `expose: 4321`)
  - `caddy` service (public on `80/443`, reverse-proxy to `portfolio`)
- `Caddyfile`
  - Redirects `www.nikhilrathore.com` → `nikhilrathore.com`
  - Proxies all traffic to `portfolio:4321`

### Useful commands

```bash
# Rebuild and restart after code changes
docker compose up -d --build

# View running services
docker compose ps

# Tail logs
docker compose logs -f portfolio
docker compose logs -f caddy

# Stop everything
docker compose down
```

