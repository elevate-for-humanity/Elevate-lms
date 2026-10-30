#!/usr/bin/env bash
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq docker.io curl
systemctl enable --now docker
install -d -m 700 /etc/legacy83 /var/lib/legacy83/caddy /var/lib/legacy83/caddy-config
touch /run/legacy83-host-ready
