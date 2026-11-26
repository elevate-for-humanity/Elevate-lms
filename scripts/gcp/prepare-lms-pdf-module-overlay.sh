#!/bin/sh
# Replace only the four traced PDF module entries that conflict with the
# complete PDF export copied immediately afterward in Dockerfile.google-lms.
set -eu
modules="${1:?node_modules directory required}"
if [ ! -d "$modules" ] || [ -L "$modules" ] || [ "${modules##*/}" != "node_modules" ]; then
  echo "Refusing PDF overlay against invalid node_modules directory" >&2
  exit 1
fi
if [ -L "$modules/@napi-rs" ]; then
  echo "Refusing PDF overlay through symlinked @napi-rs scope" >&2
  exit 1
fi
for package in pdf-parse pdfjs-dist @napi-rs/canvas @napi-rs/canvas-linux-x64-gnu; do
  path="$modules/$package"
  if [ -e "$path" ] || [ -L "$path" ]; then
    rm -rf -- "$path"
    echo "Cleared traced PDF module entry: $package"
  fi
done
