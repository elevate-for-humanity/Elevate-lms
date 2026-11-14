#!/usr/bin/env bash
set -euo pipefail
: "${CLOUDFLARE_API_TOKEN:?CLOUDFLARE_API_TOKEN is required}"
: "${CLOUDFLARE_ZONE_ID:?CLOUDFLARE_ZONE_ID is required}"
HOSTNAME="${PBX_HOSTNAME:-phone.elevateforhumanity.org}"
IP="${PBX_IP:-107.178.216.162}"
API="https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/dns_records"
auth=(-H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" -H "Content-Type: application/json")
existing="$(curl -fsS "${auth[@]}" "${API}?type=A&name=${HOSTNAME}")"
id="$(printf '%s' "$existing" | python3 -c 'import json,sys; d=json.load(sys.stdin); print((d.get("result") or [{}])[0].get("id",""))')"
payload="$(printf '{"type":"A","name":"%s","content":"%s","ttl":300,"proxied":false,"comment":"Elevate PBX WebRTC/SIP endpoint on Google Compute Engine"}' "$HOSTNAME" "$IP")"
if [[ -n "$id" ]]; then
  curl -fsS -X PUT "${auth[@]}" --data "$payload" "${API}/${id}" >/dev/null
else
  curl -fsS -X POST "${auth[@]}" --data "$payload" "$API" >/dev/null
fi
echo "${HOSTNAME} -> ${IP} (DNS only)"
