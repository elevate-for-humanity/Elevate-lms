# Independent PARIS ARI media gateway — staged integration

This is **not a completed, deployable PARIS receptionist**. The ARI/RTP gateway
has been added to the repository to establish the media transport boundary.
It is intentionally disconnected from the production dialplan and public
Telnyx route. It MUST NOT be enabled for existing extensions until the
remaining integration and live acceptance work is complete.

## Transport and security

The runtime uses Asterisk ARI on loopback (HTTP and WS), a mixing bridge, and
an externalMedia channel carrying PCMU RTP over a loopback-only UDP socket. A
Stasis application named `elevate-paris` must be registered. The independent
PBX must route only a dedicated authorized test call into that application
following dialplan review. Do not alter the public carrier trunk.

External media channels use a preallocated `paris-media-` channel ID. The event
handler accepts only PJSIP/Local caller channels and excludes that namespace,
including when the media channel's `StasisStart` arrives before its HTTP creation
response. Asterisk 20 externalMedia does not support the `appArgs` parameter;
using an argument marker alone would let media channels recursively create more
bridges. The channel-ID response is verified before bridging.

The gateway answers caller legs that are not already answered. Failed voice
processing or ARI disconnection returns the caller to the next priority after
its original Stasis application; the reviewed dialplan must provide the fallback
there. If that continuation fails, only that caller leg is hung up. A successful
operator handoff is not hung up by media cleanup. Sessions are bounded to 16
concurrent calls and 15 minutes each; capacity/time limits use the same fallback.
Resource creation completed after caller hangup is cleaned up on response.

Required server-side environment: `PARIS_ARI_USER`, `PARIS_ARI_PASSWORD`,
`PARIS_ARI_URL`, `PARIS_ARI_WS`, `PARIS_TURN_URL`, `PARIS_TURN_TOKEN`.
The endpoint URL must be private HTTPS. Credentials must be supplied at runtime
from Google Secret Manager; never commit or print them. The turn processor must
accept `{callId,sessionId,sequence,encoding:'PCMU',sampleRate:8000,audioBase64}`
and return `{replyAudioUlawBase64,endCall?}` where the reply is 8 kHz PCMU.
The Google ASR/TTS turn adapter implementing this contract is described below.
Its required private TLS route, identity, secrets and running processes must be
verified before enabling a controlled test extension.

## Next gates before release

1. Verify the running Asterisk ARI and externalMedia transport on an isolated
   clone of the production container, including module and format compatibility.
2. Implement and test authenticated, low-latency PARIS speech recognition,
   dialogue, authorized actions and audio synthesis for this turn protocol.
3. Add bounded sessions, audio privacy/recording consent, call transfer and
   voicemail fallback; test WebSocket reconnect and RTP loss/jitter/timeout.
4. Install with least-privileged Google identity and network isolation.
5. Validate one real SIP registered test extension with two-way audio, PARIS
   multi-turn interview, operator 0 and voicemail; store redacted evidence.
6. Only after those gates pass consider an explicitly approved staged route
   activation. Existing Telnyx PSTN routing remains unchanged throughout.

Contract smoke tests: `node --test infra/pbx/paris/ari-media.test.mjs`.
These tests verify packet/boundary behavior only; they do NOT certify a live call.

## Phase 2: real Google voice turns (source implemented, NOT deployed)

`turn-adapter.mjs` implements Google Speech-to-Text recognition for
MULAW/8000 caller audio, a constrained Vertex Gemini conversational response,
and Google Text-to-Speech synthesis of 8 kHz PCM converted to PCMU RTP payload.
The adapter binds **127.0.0.1:8091** and exposes only
`POST /internal/paris/turn`. It requires a 32+ byte `PARIS_TURN_TOKEN`
from Secret Manager; the gateway requires the same secret and a **private HTTPS**
proxy destination in `PARIS_TURN_URL`. ARI credentials are independent of this
secret. No plain HTTP/public turn service is authorized.

## Runtime startup wiring

The systemd units run as a dedicated `elevate-paris` OS account. Install the two
units, `paris/*.mjs`, and `runtime-secrets.mjs` under `/opt/elevate-pbx/`, keeping
the same directory layout. They require `/usr/bin/node` version 22 or later.
`launch.mjs` loads role-specific secrets from Compute workload identity before
importing the gateway or adapter; no password belongs in the unit or config file.
The root-owned `/etc/elevate-pbx/paris.conf` supplies these nonsecret settings:

- `PARIS_ARI_USER=elevate-paris` (must match a reviewed runtime ARI user)
- `PARIS_ARI_PASSWORD_SECRET`: pinned GSM version resource from the bootstrap report
- `PARIS_TURN_TOKEN_SECRET`: pinned GSM version resource from the bootstrap report
- `PARIS_TURN_URL=https://phone.elevateforhumanity.org/internal/paris/turn`

Merge `Caddyfile.fragment` into the existing hostname block, validate the complete
Caddy configuration, and reload without recreating its container. `private-turn.mjs`
connects directly to 127.0.0.1:443, retaining the public hostname for TLS certificate
verification and SNI. The proxy route accepts loopback clients only; the adapter
retains its independent bearer-token check. No external turn endpoint is opened.

`scripts/gcp/prepare-pbx-secrets.mjs --apply` creates/reuses four owned GSM secrets,
copies the existing LMS Supabase service key in memory, and grants per-secret
runtime access. It checks required permissions before writing anything and never
rotates existing enabled versions. Run it from the repository root using Node 22+
and an authorized project administrator's gcloud session when the WIF identity
reports missing permissions. Do not grant project-wide Secret Manager Admin as a
shortcut. This preparation does not change Telnyx, select extensions, install
mailboxes, or claim live call acceptance.

Required prerequisites: Google VM service identity has only the needed Speech,
Vertex AI and Text-to-Speech permissions; those APIs are enabled; the private TLS
reverse proxy is configured; audio retention/consent and transcripts are reviewed.
Run: `node --test infra/pbx/paris/*.test.mjs`. The mocked adapter tests are
contract checks and cannot establish an actual call.

**Remaining blockers:** Turn-taking/echo cancellation needs live acoustic tuning,
caller speech recording consent is not implemented, transcripts/call outcomes do
not yet persist to Supabase, the model is not yet grounded in the approved live
program catalog, and tool-mediated booking/transfer/voicemail are not implemented.
Neither file is wired into the production dialplan; no existing Telnyx numbers
or existing extensions have been changed. DO NOT activate in production yet.
