# Deployment

The site builds to **static HTML** (`astro.config.mjs` sets `output: "static"`), so any static host can serve it. Two paths are supported and maintained here:

| Path | Status | `/api/visitors` |
| --- | --- | --- |
| [Vercel](#vercel-production) | Production (`nikhilrathore.com`) | ✅ runs as a serverless function |
| [Docker + Caddy on a VM](#docker--caddy-self-hosted-vm) | Supported alternative | ❌ not available — counter shows its fallback value |

---

## Vercel (production)

Vercel builds the Astro site and, separately, deploys `api/visitors.js` as a Node serverless function under `/api/visitors`. No adapter is configured because the site itself is fully static.

1. Import the repository at [vercel.com/new](https://vercel.com/new). The framework preset (Astro), build command (`npm run build`) and output directory (`dist`) are detected automatically.
2. Add the environment variables below under **Settings → Environment Variables** (Production and Preview).
3. Push to `main` — every push deploys; pull requests get preview URLs.

### Environment variables

| Variable | Purpose |
| --- | --- |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST endpoint, e.g. `https://your-db.upstash.io` |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST token |

Create a free database at [console.upstash.com](https://console.upstash.com) and copy the **REST** URL and token (not the `redis://` connection string).

Both are optional. Without them the endpoint still returns `200` with an in-memory count and a `warning` field — the page never breaks.

### Verifying the counter

```bash
curl -i https://nikhilrathore.com/api/visitors            # read the current month
curl -i -X POST https://nikhilrathore.com/api/visitors    # increment
curl -s "https://nikhilrathore.com/api/visitors?debug=1"  # include the failure reason
```

Check the `X-Counter-Source` response header:

- `upstash` — talking to Redis correctly.
- `fallback` — env vars missing, or Upstash errored/timed out (1.5 s budget). Re-run with `?debug=1` to see why.

Counts are stored per month under the key `portfolio_visits_<YYYY>_<MM>`, using the `Asia/Kolkata` timezone. The browser increments once per session (tracked in `sessionStorage`) when the Projects section scrolls into view.

---

## Docker + Caddy (self-hosted VM)

Two containers: `portfolio` builds the site and serves `dist/` internally on port `4321`; `caddy` terminates TLS on `80`/`443` and reverse-proxies to it.

> **Heads-up:** `api/visitors.js` is a Vercel Function, not an Astro route, so it does not exist in this deployment. `/api/visitors` returns 404 and the header counter keeps its default value. Everything else works identically.

### Prerequisites

- A Linux VM with Docker Engine and the Compose plugin.
- Firewall open on ports **80** and **443**.
- DNS records pointing at the VM's public IP:
  - `A @` → VM IP
  - `A www` → VM IP

### Deploy

```bash
git clone https://github.com/Dhirenderchoudhary/Portfolioo.git portfolio
cd portfolio

docker compose up -d --build
```

Caddy requests Let's Encrypt certificates for `nikhilrathore.com` and `www.nikhilrathore.com` on first boot and renews them automatically. DNS must already resolve to the VM, or issuance fails.

### Using your own domain

Edit the `caddy` service in `docker-compose.yml`:

```yaml
environment:
  - CADDY_DOMAIN=example.com
  - ACME_EMAIL=you@example.com
```

The `Caddyfile` reads both values, redirects `www.` to the apex and proxies everything to `portfolio:4321`.

To serve over plain HTTP by IP with no domain, comment out the two site blocks in `Caddyfile` and uncomment the `:80` block at the bottom.

Also update `site` in `astro.config.mjs` — it is baked into canonical URLs, the sitemap and OG tags at build time.

### How the image is built

`Dockerfile` is a three-stage build:

1. **deps** — `npm install` on `node:20-alpine`, with a BuildKit cache mount for `~/.npm`.
2. **build** — `npm run build`, producing static files in `/app/dist`.
3. **runner** — `caddy:2-alpine` serving `/srv` on `:4321` using `docker/Caddyfile`.

The runtime image contains no Node.js and no `node_modules` — just Caddy and the built files. It needs no environment variables.

### Operations

```bash
docker compose up -d --build          # rebuild and restart after a content or code change
docker compose ps                     # service status
docker compose logs -f portfolio      # app logs
docker compose logs -f caddy          # TLS / proxy logs
docker compose down                   # stop everything (certs persist in the caddy_data volume)
```

### Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| Certificate never issues | DNS not yet pointing at the VM, or port 80 blocked — Let's Encrypt needs both. Check `docker compose logs caddy`. |
| `502 Bad Gateway` | The `portfolio` container failed to start. Check `docker compose logs portfolio`. |
| Old content after deploy | Rebuild rather than restart: `docker compose up -d --build`. Content is baked in at build time. |
| Wrong canonical URLs / sitemap | `site` in `astro.config.mjs` still points at the old domain. |

---

## Any other static host

`npm run build` produces a self-contained `dist/`. Upload it to Netlify, Cloudflare Pages, GitHub Pages, S3 + CloudFront or similar. Two things to remember:

- Update `site` in `astro.config.mjs` to the final URL before building.
- `/api/visitors` will not exist unless the host supports Node serverless functions with Vercel's `api/` convention. The UI handles its absence gracefully.
