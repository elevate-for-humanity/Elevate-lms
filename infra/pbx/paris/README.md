# Independent PARIS ARI media gateway — staged integration

This is **not a completed, deployable PARIS receptionist**. The ARI/RTP gateway
has been added to the repository to establish the media transport boundary.
It is intentionally disconnected from the production dialplan and public
Telnyx route. It MUST NOT be enabled for the 24 existing extensions until the
remaining integration and live acceptance work is complete.

## Transport and security

The runtime uses Asterisk ARI on loopback (HTTP and WS), a mixing bridge, and
an externalMedia channel carrying PCMU RTP over a loopback-only UDP socket. A
Stasis application named `elevate-paris` must be registered. The independent
PBX must route only a dedicated authorized test call into that application
following dialplan review. Do not alter the public carrier trunk.

Required server-side environment: `PARIS_ARI_USER`, `PARIS_ARI_PASSWORD`,
`PARIS_ARI_URL`, `PARIS_ARI_WS`, `PARIS_TURN_URL`, `PARIS_TURN_TOKEN`.
The endpoint URL must be private HTTPS. Credentials must be supplied at runtime
from Google Secret Manager; never commit or print them. The turn processor must
accept `{callId,sessionId,sequence,encoding:'PCMU',sampleRate:8000,audioBase64}`
and return `{replyAudioUlawBase64,endCall?}` where the reply is 8 kHz PCMU.
An actual authenticated PARIS conversation/ASR/TTS processor implementing this
contract is still required. The service fails closed when it is missing; it
cannot synthesize a working receptionist by itself.

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
