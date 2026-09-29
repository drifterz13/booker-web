# syntax=docker/dockerfile:1

FROM node:24-bookworm-slim AS build
WORKDIR /app
RUN npm install --global pnpm@11.11.0
COPY package.json pnpm-lock.yaml ./
# Dependencies ship the binaries needed here; skip package lifecycle scripts.
RUN --mount=type=cache,id=booker-pnpm,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile --ignore-scripts
COPY . .
# Vite embeds this public URL into the client bundle at build time.
ARG VITE_API_BASE_URL
RUN : "${VITE_API_BASE_URL:?Set VITE_API_BASE_URL to the public backend URL}" && pnpm build

FROM caddy:2-alpine AS runtime
RUN chown -R 1000:1000 /data /config
COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/build/client /srv
USER 1000:1000
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget -q -O /dev/null http://127.0.0.1:3000/ || exit 1
CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
