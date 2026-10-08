#!/usr/bin/env bash
# Execute on the EXISTING elevate-pbx VM. Never restarts Asterisk or changes Telnyx.
set -euo pipefail
HOST=phone.elevateforhumanity.org
EXPECTED_IP=107.178.216.162
NAME=elevate-pbx-wss-proxy
CONF_DIR=/opt/elevate-pbx/tls-proxy
STATE_DIR=/var/lib/elevate-pbx-tls
[[ "$(id -u)" == 0 ]] || { echo "Requires root" >&2; exit 1; }
command -v docker >/dev/null
command -v curl >/dev/null
command -v getent >/dev/null
IP="$(getent ahostsv4 "$HOST" | awk 'NR==1{print $1}')"
[[ "$IP" == "$EXPECTED_IP" ]] || { echo "DNS mismatch: $IP" >&2; exit 1; }
docker inspect pbx_asterisk_1 --format '{{.State.Running}}' | grep -qx true
curl -fsS --max-time 5 http://127.0.0.1:8088/httpstatus >/dev/null || {
  echo "Asterisk local HTTP endpoint unavailable; preserving existing service." >&2; exit 1;
}
# Do not replace unrelated services already bound to the public TLS port.
if ss -ltn '( sport = :443 )' | grep -q LISTEN && ! docker ps --format '{{.Names}}' | grep -qx "$NAME"; then
  echo "TCP 443 already occupied by another service. Refusing takeover." >&2; exit 1;
fi
install -d -m 0755 "$CONF_DIR" "$STATE_DIR"
cat > "$CONF_DIR/Caddyfile" <<'CADDY'
phone.elevateforhumanity.org {
  tls {
    issuer acme {
      disable_http_challenge
    }
  }
  @sipws path /ws
  reverse_proxy @sipws 127.0.0.1:8088
  respond /healthz "ok" 200
  respond "Not Found" 404
}
CADDY
docker pull caddy:2.10.2
docker run --rm --network host -v "$CONF_DIR/Caddyfile:/etc/caddy/Caddyfile:ro" caddy:2.10.2 validate --config /etc/caddy/Caddyfile --adapter caddyfile
# Replace only our own proxy; never touch the healthy PBX container.
if docker ps -a --format '{{.Names}}' | grep -qx "$NAME"; then
  docker rm -f "$NAME"
fi
docker run -d --name "$NAME" --restart unless-stopped --network host \
  -v "$CONF_DIR/Caddyfile:/etc/caddy/Caddyfile:ro" \
  -v "$STATE_DIR/data:/data" -v "$STATE_DIR/config:/config" \
  caddy:2.10.2
passed=0
for attempt in $(seq 1 24); do
  if curl --silent --show-error --fail --max-time 8 --resolve "$HOST:443:127.0.0.1" "https://$HOST/healthz" | grep -qx ok; then
    passed=1; break
  fi
  sleep 5
done
if [[ "$passed" != 1 ]]; then
  docker logs --tail 80 "$NAME" >&2 || true
  docker rm -f "$NAME" || true
  echo "TLS verification failed; proxy rolled back. Asterisk untouched." >&2
  exit 1
fi
echo "Verified trusted HTTPS on local existing PBX host. Next require public /ws upgrade, authenticated WebRTC and PARIS call tests."
