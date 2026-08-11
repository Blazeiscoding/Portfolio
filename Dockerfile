# syntax=docker/dockerfile:1.4

FROM node:20-alpine AS deps
WORKDIR /app

# Set npm registry and timeout for better reliability
RUN npm config set registry https://registry.npmjs.org/ && \
    npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000

COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm install --prefer-offline --no-audit


FROM node:20-alpine AS build
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build


# The Astro build is `output: "static"`, so the runtime is just a file server.
# No Node.js and no node_modules ship in the final image.
FROM caddy:2-alpine AS runner

COPY --from=build /app/dist /srv
COPY docker/Caddyfile /etc/caddy/Caddyfile

EXPOSE 4321
