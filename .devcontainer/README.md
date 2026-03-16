# Dev Container Configuration

This project uses a standard `.devcontainer/devcontainer.json` that works with both **GitHub Codespaces** and **Ona** (Gitpod Flex).

## Active files

| File | Purpose |
|------|---------|
| `.devcontainer/devcontainer.json` | Container image, port forwarding, VS Code extensions, postCreateCommand |
| `.ona/automations.yaml` | Ona-specific startup tasks and dev server service |

## Container

- **Image**: `mcr.microsoft.com/devcontainers/typescript-node:1-22-bookworm` (Node 22 LTS)
- **postCreateCommand**: enables corepack, activates pnpm 10.28.2, runs `pnpm install`, copies `.env.example` → `.env.local` if missing
- **Port 3000**: Next.js dev server

## GitHub Codespaces setup

1. Open the repo on GitHub → **Code** → **Codespaces** → **New codespace**
2. The container builds automatically and runs `postCreateCommand`
3. Add secrets in **Settings → Secrets and variables → Codespaces** (see required secrets below)
4. Open a terminal and run: `pnpm dev --turbopack`

### Required Codespaces secrets

Set these as repository-level Codespaces secrets (Settings → Secrets → Codespaces):

| Secret | Description |
|--------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) |
| `NEXTAUTH_SECRET` | Random 32-byte hex string (`openssl rand -hex 32`) |
| `STRIPE_SECRET_KEY` | Stripe secret key (use test key for dev) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `OPENAI_API_KEY` | Optional — AI features only |
| `SENDGRID_API_KEY` | Optional — email features only |

All other variables in `.env.example` are optional for local development. Fill them in `.env.local` as needed.

## Ona (Gitpod Flex) startup sequence

1. `setup-env` — copies `.env.example` → `.env.local` if missing
2. `install-deps` — runs `pnpm install`
3. `generate-hvac-audio` — generates MP3s via OpenAI TTS (skips if no API key)
4. `generate-hvac-videos` — generates MP4s via D-ID (skips if no API key)
5. `dev-server` service — starts `pnpm dev --turbopack` on port 3000

## Manual setup (no container)

```bash
node -v          # requires Node 22+
corepack enable
corepack prepare pnpm@10.28.2 --activate
pnpm install
cp .env.example .env.local   # then fill in Supabase keys
pnpm dev --turbopack
```

## Other files in this directory

- `devcontainer.json.codespaces-only` — superseded by the main devcontainer.json; kept for reference
- `verify-ona.sh` — diagnostic script for Ona environment checks
