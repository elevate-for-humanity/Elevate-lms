# Dev Container Configuration

This project runs on **Ona** (Gitpod Flex) using `.devcontainer/devcontainer.json` + `.ona/automations.yaml`.

## Active files

| File | Purpose |
|------|---------|
| `.devcontainer/devcontainer.json` | Container image, port forwarding, VS Code extensions |
| `.ona/automations.yaml` | Startup tasks (env setup, pnpm install, audio/video generation) and dev server service |

## Container

- **Image**: `mcr.microsoft.com/devcontainers/typescript-node:1-22-bookworm` (Node 22 LTS)
- **postCreateCommand**: enables corepack and activates pnpm 10.28.2
- **Port 3000**: Next.js dev server (Turbopack)

## Startup sequence (Ona automations)

1. `setup-env` — copies `.env.example` → `.env.local` if missing
2. `install-deps` — runs `pnpm install` (depends on setup-env)
3. `generate-hvac-audio` — generates MP3s via OpenAI TTS (skips if no API key)
4. `generate-hvac-videos` — generates MP4s via D-ID (skips if no API key)
5. `dev-server` service — starts `pnpm dev --turbopack` on port 3000

## Local development (without Ona)

```bash
node -v          # requires Node 22+
corepack enable
corepack prepare pnpm@10.28.2 --activate
pnpm install
cp .env.example .env.local   # then fill in Supabase keys
pnpm dev --turbopack
```

## Other files in this directory

- `devcontainer.json.codespaces-only` — GitHub Codespaces config (not used by Ona)
- `verify-ona.sh` — diagnostic script for Ona environment checks
