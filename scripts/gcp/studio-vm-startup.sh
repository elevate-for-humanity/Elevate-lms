#!/usr/bin/env bash
set -euo pipefail
# No configuration values or credentials belong in instance metadata.
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq docker.io
systemctl enable --now docker
install -d -m 700 /etc/elevate-studio
touch /run/studio-host-ready
