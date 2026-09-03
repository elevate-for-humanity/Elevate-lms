#!/bin/bash
# ONE-COMMAND GITHUB SECRETS SETUP
# Supply credentials through environment variables. Never commit live secrets.

set -euo pipefail

REPO="${REPO:-elevate-for-humanity/Elevate-lms}"

required=(GH_TOKEN CLOUDFLARE_API_TOKEN CLOUDFLARE_ACCOUNT_ID)
for name in "${required[@]}"; do
  if [ -z "${!name:-}" ]; then
    echo "Missing required environment variable: $name" >&2
    exit 1
  fi
done

set_secret() {
  local secret_name="$1"
  local secret_value="$2"

  KEY_RESPONSE=$(curl -fsS -H "Authorization: Bearer $GH_TOKEN" \
    -H "X-GitHub-Api-Version: 2022-11-28" \
    "https://api.github.com/repos/$REPO/actions/secrets/public-key")

  KEY_ID=$(printf '%s' "$KEY_RESPONSE" | python3 -c 'import json,sys; print(json.load(sys.stdin)["key_id"])')
  PUBLIC_KEY=$(printf '%s' "$KEY_RESPONSE" | python3 -c 'import json,sys; print(json.load(sys.stdin)["key"])')

  ENCRYPTED_VALUE=$(PUBLIC_KEY="$PUBLIC_KEY" SECRET_VALUE="$secret_value" python3 <<'PY'
import base64
import os
from nacl import encoding, public
key = public.PublicKey(os.environ['PUBLIC_KEY'].encode(), encoding.Base64Encoder())
box = public.SealedBox(key)
print(base64.b64encode(box.encrypt(os.environ['SECRET_VALUE'].encode())).decode())
PY
)

  curl -fsS -X PUT \
    -H "Authorization: Bearer $GH_TOKEN" \
    -H "X-GitHub-Api-Version: 2022-11-28" \
    -H "Content-Type: application/json" \
    "https://api.github.com/repos/$REPO/actions/secrets/$secret_name" \
    -d "{\"encrypted_value\":\"$ENCRYPTED_VALUE\",\"key_id\":\"$KEY_ID\"}" >/dev/null

  echo "Configured $secret_name"
}

set_secret CLOUDFLARE_API_TOKEN "$CLOUDFLARE_API_TOKEN"
set_secret CLOUDFLARE_ACCOUNT_ID "$CLOUDFLARE_ACCOUNT_ID"

ZONE_ID="${CLOUDFLARE_ZONE_ID:-}"
if [ -z "$ZONE_ID" ]; then
  ZONES=$(curl -fsS \
    -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
    -H "Content-Type: application/json" \
    "https://api.cloudflare.com/client/v4/zones?name=elevateforhumanity.org&status=active")
  ZONE_ID=$(printf '%s' "$ZONES" | python3 -c 'import json,sys; data=json.load(sys.stdin); print((data.get("result") or [{}])[0].get("id", ""))')
fi

if [ -n "$ZONE_ID" ]; then
  set_secret CLOUDFLARE_ZONE_ID "$ZONE_ID"
else
  echo "Unable to resolve CLOUDFLARE_ZONE_ID for elevateforhumanity.org" >&2
  exit 1
fi

echo "Cloudflare deployment secrets configured for $REPO."
