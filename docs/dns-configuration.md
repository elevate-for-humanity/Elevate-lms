# Production DNS and routing

Production application deployment is Google Cloud only: project `elegant-racer-299721`, region `us-central1`. Never restore Northflank CNAMEs or attach these domains to legacy services.

## Ownership and destinations

The October 10, 2026 recursive DNS audit returned `ns1.systemdns.com`, `ns2.systemdns.com`, and `ns3.systemdns.com` as the authoritative nameservers. Do not assume Cloudflare owns this zone because an old API token exists. Query the delegation and each authoritative server before any change. Recursive results alone are not authoritative verification.

| Host | Observed DNS | Intended destination |
|---|---|---|
| elevateforhumanity.org | A 34.110.235.233 | Google public edge; permanent HTTPS redirect to www |
| www.elevateforhumanity.org | A 34.110.235.233 | elevate-marketing-migration |
| app.elevateforhumanity.org | CNAME www.elevateforhumanity.org | elevate-lms-migration |
| admin.elevateforhumanity.org | CNAME www.elevateforhumanity.org | elevate-admin-migration |
| store.elevateforhumanity.org | CNAME www.elevateforhumanity.org | elevate-store-migration |
| phone.elevateforhumanity.org | A 107.178.216.162 | elevate-pbx, us-central1-a |

The application hostnames share the Google HTTPS load balancer, with the `elevate-public-routes` URL map and separate serverless network endpoint groups. A CNAME to www does not make LMS/Admin/Store the Marketing application: HTTP host routing must independently select the correct backend. TLS is terminated by the Google edge for applications and the PBX gateway for phone. Keep phone DNS-only if a proxy provider is introduced; validate SIP WebSocket and media requirements before any proxy change.

## Read-only verification

`.github/workflows/verify-google-cutover.yml` independently verifies Marketing, LMS, Admin and Store. It records service readiness, latest-created revision readiness, created/ready equality, reconciled generations, active traffic, startup/liveness probes, immutable image identity, artifact digest for the observed application commit, Supabase readiness, public identity/commit, Google URL-map/backend/NEG ownership, every authoritative DNS answer, and trusted TLS hostname/date validation.

The workflow fails if the previous deployment remains healthy while the latest deployment failed or has no traffic. A ready retired candidate can be considered for a separate controlled promotion, but is not a completed production deployment. A concurrent rollout invalidates the acceptance snapshot and requires a fresh run.

The PBX transport audit is `.github/workflows/audit-owned-pbx-callpath.yml`. DNS, trusted TLS, health and WebSocket handshake evidence do not establish registration, ringing, two-way audio, operator routing, voicemail delivery or PARIS conversation acceptance; those need controlled real calls.

## Change and rollback procedure

1. Read authoritative records and TTLs; save the exact prior record set and Google routing configuration securely.
2. Verify replacement Google service/revision and intended commit, Supabase, host routing and trusted TLS against the replacement address before changing DNS.
3. Make only the reviewed hostname change at the actual authoritative provider. Never change unrelated MX/TXT/verification records.
4. Verify all authoritative servers, recursive DNS, HTTPS destination, application identity and commit after propagation.
5. If acceptance fails, restore the saved record and traffic configuration; retain the known-good Google revision.

No authoritative DNS changes are performed by the verification workflow. Legacy `scripts/northflank/configure-dns.ts` and `configure-domains.ts` entry points are retired and fail before network access. Historical code remains for incident evidence.

## Telephone carrier continuity

Telnyx remains the production carrier and existing public number route. The independent Asterisk registration/PARIS path must pass authenticated registration and controlled real-call acceptance before any separately authorized telephone traffic cutover. Never reuse Telnyx SIP credentials for Asterisk or claim PBX readiness from a health response.
