# Dockerfile - Independent Marketing Next.js build
# Serves www.elevateforhumanity.org

FROM node:22-bookworm AS builder

ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable && corepack prepare pnpm@10.28.2 --activate

ENV PNPM_HOME="/app/.pnpm-home"
ENV PATH="$PNPM_HOME:$PATH"
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS="--max-old-space-size=8192"
ENV CI=true

WORKDIR /app

# Dependency manifests first for caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/marketing/package.json ./apps/marketing/package.json
COPY packages/db/package.json ./packages/db/package.json
COPY packages/shared/package.json ./packages/shared/package.json
COPY packages/ui/package.json ./packages/ui/package.json

RUN pnpm install --frozen-lockfile

# Application source
COPY . .

ARG NEXT_PUBLIC_SITE_URL=https://www.elevateforhumanity.org
ARG NEXT_PUBLIC_APP_URL=https://app.elevateforhumanity.org
ARG NEXT_PUBLIC_ADMIN_URL=https://admin.elevateforhumanity.org
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG GITHUB_SHA=unknown
ARG BUILD_TIMESTAMP=unknown

ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_ADMIN_URL=$NEXT_PUBLIC_ADMIN_URL
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV GITHUB_SHA=$GITHUB_SHA
ENV NEXT_PUBLIC_GIT_SHA=$GITHUB_SHA
ENV NEXT_PUBLIC_BUILD_ID=$GITHUB_SHA
ENV BUILD_ID=$GITHUB_SHA
ENV BUILD_TIMESTAMP=$BUILD_TIMESTAMP

RUN pnpm --filter @elevate/marketing build

RUN echo "=== STANDALONE SERVER LOCATION ===" && \
    find /app/apps/marketing/.next/standalone \
      -type f \
      -name "server.js" \
      -print

FROM node:22-bookworm-slim AS runner

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=8080

WORKDIR /app

# Copy standalone (preserves monorepo workspace layout)
COPY --from=builder /app/apps/marketing/.next/standalone ./

# Copy static and public to the correct monorepo-relative location
COPY --from=builder /app/apps/marketing/.next/static ./apps/marketing/.next/static
COPY --from=builder /app/apps/marketing/public ./apps/marketing/public

EXPOSE 8080

# Runtime-port-aware health check for Northflank and other container platforms.
HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=3 \
  CMD curl -fsS "http://127.0.0.1:${PORT:-8080}/api/version" || exit 1

CMD ["node", "--max-http-header-size=32768", "apps/marketing/server.js"]
