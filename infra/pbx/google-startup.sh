#!/bin/bash
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive

apt-get update
apt-get install -y docker.io git ca-certificates

if apt-cache show docker-compose-plugin >/dev/null 2>&1; then
  apt-get install -y docker-compose-plugin
elif apt-cache show docker-compose >/dev/null 2>&1; then
  apt-get install -y docker-compose
fi

systemctl enable --now docker
install -d -m 0755 /opt/elevate-pbx

if [[ ! -d /opt/elevate-pbx/repo/.git ]]; then
  git clone --depth=1 https://github.com/elevate-for-humanity/Elevate-lms.git /opt/elevate-pbx/repo
else
  git -C /opt/elevate-pbx/repo fetch origin main --depth=1
  git -C /opt/elevate-pbx/repo reset --hard origin/main
fi

cd /opt/elevate-pbx/repo/infra/pbx

if docker compose version >/dev/null 2>&1; then
  COMPOSE=(docker compose)
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE=(docker-compose)
else
  echo "No Docker Compose implementation is available" >&2
  exit 1
fi

"${COMPOSE[@]}" pull
"${COMPOSE[@]}" up -d
"${COMPOSE[@]}" ps
