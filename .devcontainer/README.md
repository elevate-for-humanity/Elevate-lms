# Dev Container — Elevate LMS

Standalone dev container for local and Ona-based development workflows.

---

## Quick start

### Prerequisites

- Docker Desktop (or any OCI-compatible runtime)
- VS Code with the [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)

### Steps

1. Open the repo in VS Code → **F1** → **Dev Containers: Reopen in Container**

The container will:
- Provide Node.js 22 and Docker-in-Docker
- Run the Ona `setup` task to prepare `.env.local` and install pnpm dependencies
- Copy `.env.example` to `.env.local` if no local env file exists

2. Fill any local-only secrets in `.env.local`.

3. Start a dev server:

```bash
gitpod automations service start lms-dev
gitpod automations service start admin-dev
```

Or run scripts directly:

```bash
pnpm dev          # LMS   -> http://localhost:3000
pnpm dev:admin    # Admin -> http://localhost:3001
```

---

## Secrets

Production and preview secrets are managed through Northflank runtime
environment variables and secret groups. Local dev uses `.env.local`.

`setup-env.sh` creates `.env.local` from `.env.example` when needed. It does not
pull production secrets into the dev container.

To refresh secrets manually at any time:

```bash
bash .devcontainer/setup-env.sh
make env
```

### Missing secrets?

Fill in
values manually in `.env.local`, or add them to the appropriate Northflank
secret group for deployed services.

---

## Container lifecycle

Lifecycle setup is defined in `.ona/automations.yaml`.

Dev servers are **not started automatically**. Start `lms-dev` or `admin-dev` when needed.

---

## Make targets

| Target | Description |
|--------|-------------|
| `make env` | Prepare `.env.local` from `.env.example` when missing |
| `make install` | Install pnpm dependencies |
| `make dev` | Start LMS dev server (port 3000) |
| `make dev-admin` | Start Admin dev server (port 3001) |
| `make build` | Production build |
| `make lint` | Run ESLint |
| `make setup` | Full first-time setup (env + install) |

---

## Files

| File | Purpose |
|------|---------|
| `devcontainer.json` | Container definition — image, features, ports, editor extensions |
| `setup-env.sh` | Creates `.env.local` from `.env.example` when missing |
| `.ona/automations.yaml` | Repeatable setup, build, lint, test, and dev server workflows |
