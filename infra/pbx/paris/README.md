# PARIS phone receptionist and ARI media gateway

## Current deployment (November 1, 2026)

The Google PBX is connected to the verified Twilio business number
**+1 463-240-1404** through the dedicated
`elevate-4632401404.pstn.twilio.com` trunk. The incoming dialplan answers and
enters `Stasis(elevate-paris)` before its existing operator fallback. Telnyx
and `elevate-standalone.pstn.twilio.com` are retired; do not restore them.

Repair commit `4e4ee047562c4e452c17aaa8f79be039e7b6d7b3` passed protected
activation run `41341890130`: trusted SIP TLS, exact carrier source identity,
Twilio number/trunk/destination readback, saved greeting/instruction parity,
all 22 enabled extension routes, synthesized greeting audio, spoken operator
routing, and synthesized operator reply. The voicemail worker was active with
no recent retry errors. These checks did not place a call or deliver voicemail.

A separate manually dispatched workflow, `exercise-paris-self-call.yml`, makes
one bounded call to this owned business number. It verifies the saved greeting
on its own recording channel, then asks PARIS to repeat a harmless test phrase.
Timed speech on the same channel must confirm the reply; the caller-side test
announcement cannot pass either check. It does not certify handset transfers,
acoustic conversation quality, or voicemail delivery. Do not infer those
outcomes from successful configuration checks.

## SIP TLS trust store

The running Asterisk image is `mlan/asterisk:xtra-1.1.13` (Asterisk 20.15.2).
In an isolated copy of that exact image, a valid RSA certificate with
`ca_list_file=/etc/ssl/certs/ca-certificates.crt` caused TLS handshakes to stall
after ClientHello. The same certificate and network passed direct OpenSSL TLS
1.2 checks. Changing only the trust-store access to
`ca_list_path=/etc/ssl/certs` allowed trusted Asterisk TLS 1.2 handshakes.

The managed transport now uses the hashed system CA directory, retains
`verify_server=yes` and `method=tlsv1_2`, and installs the hostname-verified RSA
certificate/key under `/etc/asterisk/tls/`. Do not disable certificate validation
or replace the trusted certificate with a self-signed one. The ingress repair
script checks for idle calls/channels, backs up owned files, restarts the same
container only when necessary, and rolls back if trusted TLS or route readback
fails. Retiring the old outbound contact is independent of TLS rollback.

`scripts/gcp/diagnose-pbx-sip-tls.py` compares the running transport with a
private container using the same image and copied configuration. It publishes
no ports, uses an internal-only network, materializes only links that resolve
inside the reviewed configuration root, and removes its own test resources.
It emits allowlisted results rather than credentials, certificates, raw logs,
or caller audio. It does not modify live configuration or call routing.

## Audio NAT and private speech routing

The managed carrier transport classifies the verified VM private interface as
local using only its `/32`, alongside loopback. Asterisk rewrites that internal
SDP media address to the established public media address. The repair obtains
the address from Compute metadata, verifies it against the host interfaces,
and checks the loaded transport after an idle restart. This NAT classification
does not broaden carrier-source authorization.

The greeting must also pass through the exact deployed `private-turn.mjs`
HTTPS helper. A direct adapter test is insufficient: the private HTTPS route returned 404 despite direct adapter speech returning
audio. `repair-paris-turn-proxy.py` restores only the owned
loopback POST route, preserves the existing trusted gateway configuration and
bind-mounted inode, validates Caddy, verifies application authentication, and
rolls back on failure. External requests to that path receive 403. The phone
readiness audit now gates on actual audio through this deployed HTTPS helper.

## Media and speech path

Asterisk ARI remains on loopback. The gateway joins a PJSIP/Local caller to a
`mixing,proxy_media` bridge and a preallocated `paris-media-` externalMedia
channel. The private leg uses AudioSocket TCP with signed 16-bit little-endian
mono 8 kHz PCM. Each connection binds only to `127.0.0.1`, checks the independent
per-call UUID handshake before processing audio, bounds message sizes, handles
fragmented TCP data, and converts between PCM and the adapter's PCMU format.
ExternalMedia events are excluded by namespace and channel technology to avoid
recursive bridges. Owned resources are released on hangup or handoff.

The former UDP externalMedia receive path failed a controlled test on the same
running Asterisk: two channels each sent 100 synthetic tone frames and received
zero audible frames, under both simple and full mixing. The full mixer emitted
silence only. The private AudioSocket comparison returned all 100 audible frames
in both directions, with verified UUID handshakes (run `41349706692`). Carrier
TLS/SRTP, source authorization, global ICE, and browser phone configuration were
preserved. No video mixer workaround or additional call participant is used.

The gateway starts the saved greeting after its private handshake, owned Stasis
registration, and bridge join. Caller speech is not required. Google speech
recognition and TTS remain behind the authenticated private HTTPS helper; the
configured conversation provider and saved receptionist instructions govern
voice replies. Both running services must match the authoritative greeting,
instructions, and all 22 enabled extension routes.

Protected deployment run `41350044816` installed gateway SHA-256
`04965211e167a7895df38bcacad67d58adb81046c248a94f4a05534e05a0dd87`.
Live acceptance passed in run `41350265030` on November 1 at 21:07 UTC:
- The verified business self-call completed in 41 seconds.
- Recorded PARIS speech matched the saved greeting with a 1.00 word score.
- PARIS heard the spoken prompt and repeated the test phrase on its own
  recording channel after the prompt: greeting PASS, conversation PASS.
- The carrier sent and received audio, the media channel used TCP, and the
  gateway reported one completed greeting and one completed spoken turn.
- Staff-device transfers and voicemail delivery remain NOT_TESTED.

This is a successful public-number audio test, not certification of every
phone workflow or of conversational answer quality.

Spoken three-digit extension requests are limited to that authorized list.
Transfers resume the existing `elevate-pwa-extensions` dialplan rather than
constructing arbitrary SIP destinations. Operator 0 uses the reviewed operator
route. Failed speech processing and failed transfers return to the existing
dialplan fallback. Sessions are limited to 16 concurrent calls and 15 minutes.

## Runtime and change controls

The turn adapter and gateway run as the dedicated `elevate-paris` OS account
under systemd, using Node 22 or later and Google workload identity. Runtime
secrets are loaded from Google Secret Manager; never commit or print them.
`/etc/elevate-pbx/paris.conf` contains the reviewed secret references and
nonsecret settings. ARI credentials and the turn bearer token are separate.

The adapter binds `127.0.0.1:8091`; its HTTPS proxy accepts loopback clients only
and retains bearer-token authentication. The gateway connects directly to
loopback 443 while retaining `phone.elevateforhumanity.org` for SNI and trusted
certificate verification. Do not expose ARI, private media, or the turn endpoint
to public clients. Preserve existing recordings, phone records, configuration
backups, and voicemail history during repairs.

Use main-branch protected Google workflows for deployment. Verify idle state
before service restarts, retain the previous compatible runtime, and keep
carrier cutover behind trusted TLS and actual speech-readiness checks.

Focused checks:

- `python3 scripts/gcp/test-repair-paris-turn-proxy.py`
- `python3 scripts/gcp/test-connect-pbx-paris-ingress.py`
- `node --test scripts/gcp/connect-twilio-paris.test.mjs scripts/gcp/retire-standalone-trunk.test.mjs`
- `node --test scripts/gcp/exercise-paris-self-call.test.mjs`
- `node --test infra/pbx/paris/*.test.mjs`

Mocked tests establish contracts. A real greeting call, actual registered-device
transfer, two-way conversation, and delivered voicemail require their own
separate evidence.

## Diagnostics

`diagnose-pbx-sip-tls.yml` defaults to configuration and speech readiness reads.
Its optional local-media inputs create only uniquely owned temporary loopback
channels with synthetic audio and verify their cleanup; they place no phone
call. Their results are diagnostic fields, not proof of public phone acceptance.

`exercise-paris-self-call.yml` is manual-only. It verifies the owned DID,
dedicated secure trunk, exact destination and idle account before making exactly
one call (45-second maximum). It never retries uncertain call creation. Its
recording and transcription are scoped to that test call and emit scores and
status only, without audio, transcript, credentials or unrelated caller details.
Keep operator transfers and voicemail delivery marked NOT_TESTED until each has
independent real evidence. Configuration parity and synthesized speech alone
cannot authorize a claim that a caller heard the receptionist.
