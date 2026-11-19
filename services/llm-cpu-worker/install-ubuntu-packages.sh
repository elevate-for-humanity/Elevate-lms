#!/bin/sh
set -eu

sources=/etc/apt/sources.list.d/ubuntu.sources
sed -i '/^URIs: /s|http://|https://|g' "$sources"

install_packages() {
  apt-get -o Acquire::Retries=2 -o Acquire::https::Timeout=20 \
    -o APT::Update::Error-Mode=any update &&
  apt-get -o Acquire::Retries=2 -o Acquire::https::Timeout=20 \
    install -y --no-install-recommends "$@"
}

if ! install_packages "$@"; then
  # The Ubuntu archive mirror serves amd64, including noble-security. Keep
  # Ubuntu's existing archive signing key and freshness checks in force.
  [ "$(dpkg --print-architecture)" = amd64 ] || exit 1
  echo 'Retrying Ubuntu package installation using the kernel.org archive mirror' >&2
  sed -i -E 's|https://(archive|security)\.ubuntu\.com/ubuntu/?|https://mirrors.edge.kernel.org/ubuntu/|g' "$sources"
  rm -rf /var/lib/apt/lists/*
  install_packages "$@"
fi

rm -rf /var/lib/apt/lists/*
