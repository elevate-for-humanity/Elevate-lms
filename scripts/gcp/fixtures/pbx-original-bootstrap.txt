#!/bin/bash
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y docker.io docker-compose-plugin git ca-certificates
systemctl enable --now docker
install -d -m 0755 /opt/elevate-pbx
if [[ ! -d /opt/elevate-pbx/repo/.git ]]; then
  git clone --depth=1 https://github.com/elevate-for-humanity/Elevate-lms.git /opt/elevate-pbx/repo
else
  git -C /opt/elevate-pbx/repo fetch origin main --depth=1
  git -C /opt/elevate-pbx/repo reset --hard origin/main
fi
cd /opt/elevate-pbx/repo/infra/pbx
docker compose pull
docker compose up -d
