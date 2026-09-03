# Elevate LMS — dev task runner
# No dependency on Gitpod, Ona, or any CI platform.
#
# Usage:
#   make env        Create .env.local from .env.example when missing
#   make install    Install pnpm dependencies
#   make dev        Start LMS dev server (port 3000)
#   make dev-admin  Start Admin dev server (port 3001)
#   make build      Production build (LMS)
#   make lint       Run ESLint
#   make setup      Full first-time setup (env + install)

.PHONY: env install dev dev-admin build lint setup

env:
	bash .devcontainer/setup-env.sh

install:
	corepack enable && corepack prepare pnpm@10.28.2 --activate && pnpm install

dev:
	pnpm dev

dev-admin:
	pnpm dev:admin

build:
	pnpm next build

lint:
	pnpm lint

setup: env install
	@echo "Setup complete. Run 'make dev' to start."
