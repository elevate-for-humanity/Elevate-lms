# Elevate Communications PBX

This service owns Elevate internal voice routing. It is intentionally separate from
Cloud Run because SIP/RTP requires stable networking and UDP media ports.

## Carrier migration safety (October 15, 2026)

The operator reports **Twilio is now the carrier**, replacing Telnyx. This
statement records the intended/current provider, **not** a verified cutover or
an authorization to alter live calls. Historical Telnyx handlers, workflows and
database rows may still exist. Do not treat their presence as evidence of an
active production connection, and do not execute historical Telnyx reconciliation
or provisioning scripts as part of Twilio rollout.

The intended routing contract is:
- Elevate extension -> Elevate extension: internal PBX only.
- Website/PWA internet call -> PARIS/directory/extension: internal PBX only.
- E.164 outside destination -> verified, explicitly configured Twilio gateway.
- Public business number inbound -> verified Twilio ingress -> PBX/PARIS/directory.

Before changing any production carrier route, verify Twilio ownership and status
of the existing number, current inbound webhook or SIP trunk, outbound caller-ID
authorization, webhook request signature validation, active-call behavior,
E.911/emergency routing where applicable, and rollback instructions. Never guess
a Twilio trunk SID, number, callback URL, API key or SIP endpoint. Ensure that
existing working calls remain intact; do not delete legacy handling until the
new route is live and accepted.

## Production acceptance

A passing DNS/TLS/WSS probe proves transport only. It does **not** prove a
registered PWA SIP endpoint, two-way audio, TURN relay, extension 0, voicemail,
or a functional PARIS conversation. Verify these journeys separately, including
inbound/outbound PSTN and foreground/background mobile PWA behavior, using
approved non-disruptive test credentials and numbers. Do not mark the whole
phone flow live until the protected end-to-end tests pass.

Do not commit SIP passwords, Twilio credentials, ARI passwords, or WebRTC
endpoint secrets. Runtime secrets belong in Google Secret Manager / the
canonical Elevate secret store.
