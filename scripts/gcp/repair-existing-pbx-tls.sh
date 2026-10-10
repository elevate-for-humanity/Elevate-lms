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
command -v python3 >/dev/null
IP="$(getent ahostsv4 "$HOST" | awk 'NR==1{print $1}')"
[[ "$IP" == "$EXPECTED_IP" ]] || { echo "DNS mismatch: $IP" >&2; exit 1; }
docker inspect pbx_asterisk_1 --format '{{.State.Running}}' | grep -qx true
curl -fsS --max-time 5 http://127.0.0.1:8088/httpstatus >/dev/null || {
  echo "Asterisk local HTTP endpoint unavailable; preserving existing service." >&2; exit 1;
}
# Asterisk's SIP-over-WebSocket URI is normally /ws, but verify the running
# instance instead of publishing a proxy that can only return 404.
WS_PATH=""
for candidate in /ws /asterisk/ws; do
  status="$(curl -sS --max-time 5 -o /dev/null -w '%{http_code}' \
    -H 'Connection: Upgrade' -H 'Upgrade: websocket' \
    -H 'Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==' \
    -H 'Sec-WebSocket-Version: 13' -H 'Sec-WebSocket-Protocol: sip' \
    "http://127.0.0.1:8088$candidate" || true)"
  if [[ "$status" == 101 ]]; then
    WS_PATH="$candidate"; break
  fi
done
if [[ -z "$WS_PATH" ]]; then
  echo "Asterisk SIP WebSocket endpoint is not enabled on 127.0.0.1:8088; refusing a false TLS deployment." >&2
  docker exec pbx_asterisk_1 asterisk -rx 'http show status' >&2 || true
  exit 1
fi
# Preserve an established gateway BEFORE writing its Caddyfile or pulling images.
# A static /healthz alone cannot establish that the SIP route is correct.
if docker inspect "$NAME" >/dev/null 2>&1; then
  if [[ "$(docker inspect "$NAME" --format '{{.State.Running}}')" != true ]]; then
    echo "Existing TLS gateway is stopped; preserve it for reviewed recovery." >&2
    exit 1
  fi
  curl -fsS --max-time 8 --resolve "$HOST:443:127.0.0.1" "https://$HOST/healthz" | grep -qx ok || {
    echo "Existing gateway failed trusted health verification; configuration preserved." >&2
    exit 1
  }
  python3 - <<'PYWS'
import base64, hashlib, os, socket, ssl
host = 'phone.elevateforhumanity.org'
key = base64.b64encode(os.urandom(16)).decode()
request = (f'GET /ws HTTP/1.1\r\nHost: {host}\r\nConnection: Upgrade\r\n'
           f'Upgrade: websocket\r\nSec-WebSocket-Key: {key}\r\n'
           'Sec-WebSocket-Version: 13\r\nSec-WebSocket-Protocol: sip\r\n\r\n')
try:
    with socket.create_connection(('127.0.0.1',443), timeout=8) as conn:
        with ssl.create_default_context().wrap_socket(conn, server_hostname=host) as tls:
            tls.settimeout(8)
            tls.sendall(request.encode())
            response = b''
            while b'\r\n\r\n' not in response and len(response) < 16384:
                chunk = tls.recv(4096)
                if not chunk:
                    break
                response += chunk
    lines = response.decode('latin1').split('\r\n')
    headers = dict(line.lower().split(':',1) for line in lines[1:] if ':' in line)
    expected = base64.b64encode(hashlib.sha1((key+'258EAFA5-E914-47DA-95CA-C5AB0DC85B11').encode()).digest()).decode()
    # Header names are case insensitive; Sec-WebSocket-Accept values are not.
    original = dict((line.split(':',1)[0].lower(),line.split(':',1)[1].strip()) for line in lines[1:] if ':' in line)
    assert lines[0].startswith('HTTP/1.1 101 ')
    assert original.get('sec-websocket-accept') == expected
    assert original.get('sec-websocket-protocol') == 'sip'
    assert headers.get('upgrade','').strip() == 'websocket'
    assert 'upgrade' in [part.strip() for part in headers.get('connection','').split(',')]
except Exception:
    raise SystemExit('Existing gateway SIP verification failed; configuration preserved for reviewed repair.')
PYWS
  echo "Existing TLS and SIP gateway verified; configuration and container preserved. Calls remain untested."
  exit 0
fi
if [[ -e "$CONF_DIR/Caddyfile" ]]; then
  echo "Existing gateway configuration requires reviewed recovery; refusing replacement." >&2
  exit 1
fi
# Do not replace unrelated services already bound to the public TLS port.
if ss -ltn '( sport = :443 )' | grep -q LISTEN && ! docker ps --format '{{.Names}}' | grep -qx "$NAME"; then
  echo "TCP 443 already occupied by another service. Refusing takeover." >&2; exit 1;
fi
install -d -m 0755 "$CONF_DIR" "$STATE_DIR"
cat > "$CONF_DIR/Caddyfile" <<CADDY
{
  auto_https disable_redirects
}
phone.elevateforhumanity.org {
  tls {
    issuer acme {
      disable_http_challenge
    }
  }
  @sipws path /ws
  handle @sipws {
    uri replace /ws $WS_PATH
    reverse_proxy 127.0.0.1:8088
  }
  respond /healthz "ok" 200
  respond "Not Found" 404
}
CADDY
docker pull caddy:2.10.2
docker run --rm --network host -v "$CONF_DIR/Caddyfile:/etc/caddy/Caddyfile:ro" --entrypoint caddy caddy:2.10.2 validate --config /etc/caddy/Caddyfile --adapter caddyfile
# This branch is only for a new managed gateway; established state was preserved above.
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
