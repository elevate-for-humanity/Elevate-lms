#!/bin/bash
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive

# Bootstrap only a new host. Compute startup metadata runs again on reboot;
# resetting this checkout would replace reviewed runtime configuration and
# Compose could recreate the active PBX. Recovery is an explicit operation.
if command -v docker >/dev/null 2>&1; then
  if ! docker info >/dev/null 2>&1; then
    echo "Docker state unavailable; refusing PBX bootstrap or configuration replacement." >&2
    exit 1
  fi
  if docker inspect pbx_asterisk_1 >/dev/null 2>&1; then
    if [[ "$(docker inspect pbx_asterisk_1 --format '{{.State.Running}}')" != true ]]; then
      echo "Existing PBX is stopped; preserve it for explicit recovery." >&2
      exit 1
    fi
    if ! docker exec pbx_asterisk_1 asterisk -rx 'core show uptime' >/dev/null 2>&1; then
      echo "Existing PBX did not answer its CLI; preserving its configuration and container." >&2
      exit 1
    fi
    echo "Existing PBX preserved; bootstrap made no configuration or image changes."
    exit 0
  fi
fi
if [[ -e /opt/elevate-pbx/repo || -e /var/lib/elevate-pbx-tls ]]; then
  echo "Existing PBX state requires reviewed recovery; refusing fresh bootstrap." >&2
  exit 1
fi

apt-get update
apt-get install -y docker.io git ca-certificates

if apt-cache show docker-compose-plugin >/dev/null 2>&1; then
  apt-get install -y docker-compose-plugin
elif apt-cache show docker-compose >/dev/null 2>&1; then
  apt-get install -y docker-compose
fi

systemctl enable --now docker
install -d -m 0755 /opt/elevate-pbx

git clone --depth=1 https://github.com/elevate-for-humanity/Elevate-lms.git /opt/elevate-pbx/repo

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
