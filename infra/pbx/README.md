# Elevate Communications PBX

This service owns Elevate internal voice routing. It is intentionally separate from
Cloud Run because SIP/RTP requires stable networking and UDP media ports.

Routing contract:
- Elevate extension -> Elevate extension: internal PBX only.
- Website/PWA internet call -> PARIS/directory/extension: internal PBX only.
- E.164 outside destination: carrier gateway (Telnyx initially).
- Public 317 number inbound: Telnyx SIP -> PBX -> PARIS/directory/extension.

The existing Telnyx WebRTC implementation remains the production fallback until
this PBX has passed authenticated internal, inbound PSTN, outbound PSTN, voicemail,
background-PWA and failover tests.

Do not commit SIP passwords, carrier credentials, ARI passwords, or WebRTC endpoint
secrets. Runtime secrets belong in Google Secret Manager / the canonical Elevate
secret store.
