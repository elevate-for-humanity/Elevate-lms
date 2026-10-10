# Production phone repair evidence — 10 October 2026

This repair is incomplete. The follow-up change is a **draft**, not a completed
telephone replacement or authority to switch carrier traffic. No Telnyx number,
trunk, authoritative DNS record, production database row or recording was modified
in preparing it. Local test fixtures are isolated and are not production evidence.

## Merged readiness repair

[PR 1691](https://github.com/elevate-for-humanity/Elevate-lms/pull/1691) merged at
`2bb293d9a1b64d87c9e32c0d060a9a597cd9d6f9` after `CI Required Gate` passed. The
nonrequired Integrity Gate failed on pre-existing course-builder/image findings.

The repaired workflow actually ran in Google through the existing WIF identity:
[run 38031986044](https://github.com/elevate-for-humanity/Elevate-lms/actions/runs/38031986044),
observations at 06:45 UTC. It correctly failed deployment readiness while public
responses from previous revisions remained healthy. Each service uploaded its own
sanitized JSON evidence artifact. Recheck after any subsequent deployment; these
are timestamped observations, not a permanent claim about current state.

| Application | Latest created revision observed | Result | Evidence |
| --- | --- | --- | --- |
| Marketing | `elevate-marketing-migration-r97a6397d-38030538876-1` | FAIL | Ready/ContainerHealthy False, HealthCheckContainerError; older `g2-4bc83a58-38029790057` serves traffic. |
| LMS | `elevate-lms-migration-00015-fnj` | FAIL | Ready Unknown and ImmediateRetry; `00013-grk` served traffic. |
| Admin | `elevate-admin-migration-00039-g4x` | FAIL | Ready True but Retired, Active False, zero traffic; older `g2-4bc83a58-38029790057` serves traffic. |
| Store | `elevate-store-migration-ra59826c2-38011873208-1` | FAIL | Ready/ContainerHealthy False, HealthCheckContainerError; `r56837635-38007538048-1` serves traffic. |

All four observed public commits differed from the selected newest revision's
image digest. Passing the old website cannot approve these new deployments.

## Domain evidence

| Host | Result | Authoritative destination and routing |
| --- | --- | --- |
| elevateforhumanity.org | PASS | All three systemdns authorities: A 34.110.235.233; canonical www redirect and Marketing backend verified. |
| www.elevateforhumanity.org | PASS | A 34.110.235.233; Google URL map → Marketing serverless NEG → elevate-marketing-migration. |
| app.elevateforhumanity.org | PASS | CNAME www → 34.110.235.233; host-specific LMS backend/NEG verified. |
| admin.elevateforhumanity.org | PASS | CNAME www → 34.110.235.233; host-specific Admin backend/NEG verified. |
| store.elevateforhumanity.org | PASS | CNAME www → 34.110.235.233; host-specific Store backend/NEG verified. |
| phone.elevateforhumanity.org | NOT TESTED | Recursive resolution 107.178.216.162 and HTTP health observed; the complete authoritative/TLS/SIP acceptance is outstanding. |

The five application hosts had trusted hostname-matching Google Trust Services
certificates, valid 6 October 2026 through 4 January 2027. No unexpected AAAA or
conflicting authoritative responses appeared in that run. Authorities were
ns1.systemdns.com, ns2.systemdns.com and ns3.systemdns.com; the obsolete
Cloudflare/Northflank documentation and two legacy DNS write entry points were
repaired by PR 1691.

## Follow-up source changes

- SIP.js 0.21.2 implements a provider-aware PWA client: confirmed registration,
  WSS, DTLS media, configurable short-lived TURN credentials, incoming ringing,
  internal dialing, mute, hold, hangup and connection recovery. Telnyx remains the
  default provider and retains its public-call path.
- The authenticated token endpoint scopes every credential to an enabled,
  non-preview extension owner. Asterisk provisioning independently repeats the
  ownership check on the VM. Production control-plane credentials must come from
  Google Secret Manager. SIP passwords never enter the database or logs.
- Registration and connection state are separate. Credential issuance no longer
  fabricates a heartbeat. Asterisk availability requires fresh qualified contact
  evidence. Provider-namespaced device IDs preserve the existing Telnyx records
  and old uniqueness constraint through a rolling deployment.
- The VM service generates scoped configuration with per-device secrets, leases,
  availability windows and the configured administrator alias. Its reload/readback
  transaction rolls back a rejected generation. It binds loopback only, and
  includes staged installation and rollback instructions. **It has not been
  installed and does not implement the complete IVR, voicemail or PARIS bridge.**
- The Telnyx webhook filters Telnyx devices so independent SIP usernames cannot
  accidentally be dialed through Telnyx.
- The notification worker uses Google Admin and a GSM-loaded cron secret. GET
  checks the new delivery contract; POST processes. The duplicate GET scheduler
  entry was removed. PostgreSQL atomically claims eligible rows; the migration
  holds the existing backlog. Stale/duplicate/unverified reminders and ambiguous
  sends require review. Provider acceptance is counted only after persistence;
  failures yield HTTP 503. No unknown-outcome send is automatically retried.

The live database audit found 14 provisioned active device records but no heartbeat
within three minutes. That proves missing recent connection evidence, not why any
particular person's browser stopped. Authentication, lifecycle and microphone
failures still require an authorized device session to distinguish.

## Migration and deployment order

1. Review the three new migrations and current live schema; retain the default
   `webrtc_provider=telnyx` for all existing extensions. Apply through the approved
   Supabase migration path. No production migration has been applied by this PR.
2. Deploy and verify the LMS revision before the Admin consumer starts requiring
   the new device state. Verify existing Telnyx ready heartbeats and inbound calls.
   Keep prior healthy application revisions for rollback.
3. Deploy Admin. The notification workflow refuses to call POST against a handler
   that does not expose delivery contract 2. Review held backlog records against
   current business state and provider receipts; do not bulk-release them.
4. Inspect and snapshot actual PBX/Caddy configuration, verify GSM bindings and
   install/validate configuration against the same Asterisk version in an isolated
   instance before any reload. Follow `infra/pbx/provisioner/README.md`; never run
   the VM startup script to recreate the live container.
5. Activate only approved test extensions after deployment. Do not route the
   public Telnyx number into the independent system. Require real call acceptance
   before any separately approved public cutover.

Rollback keeps all three migrations and all records: restore the old app revisions,
keep or restore Telnyx extension selection, stop the new worker if needed, and
preserve held notifications until reconciliation. Revoke only generated pilot
endpoints and restore reviewed PBX/Caddy snapshots with validated reloads. Do not
remove phone histories, callback tasks, recordings or the production number.

## Remaining acceptance and implementation

| Component | Result | Evidence or exact remaining work |
| --- | --- | --- |
| Readiness workflow | PASS | Merged code ran against actual Google metadata and exposed failed/latest-vs-serving revisions independently. |
| Google deployment | FAIL | The observed newest revisions do not meet the deployment gates above. |
| Application DNS/TLS/routing | PASS | Authoritative records, certificate validation and Google backend/NEG mapping in run 38031986044. |
| Supabase connectivity | PASS | Direct Google and public /api/health responses report connected for each of the four applications; plugin metadata queries also worked. |
| Asterisk dialplan | NOT TESTED | Earlier VM audit confirmed a running Asterisk process but did not prove operator or voicemail routing; generated configuration is not installed. |
| WebRTC registration | NOT TESTED | Local protocol/boundary tests pass; no live authorized PWA SIP registration has been completed. |
| PWA incoming/two-way audio | BLOCKED | Requires permitted test accounts/devices and a live acceptance participant; no actual two-way call has been made. |
| Independent PARIS | FAIL | Authenticated duplex ARI media consumer and action integration are not implemented or deployed. Existing Telnyx PARIS is retained. |
| Operator 0 | NOT TESTED | Generated administrator alias is unit-tested only; actual runtime destination and unavailable fallback must be integrated and called. |
| Independent voicemail | FAIL | Running mailbox assignments, recording ingest/storage, recipient inbox and notification integration remain incomplete. |
| Notification delivery | NOT TESTED | Claim/error handling is locally tested; production migration, revised worker deployment and authorized delivery verification remain outstanding. |
| Website phone entry | NOT TESTED | HTTP page checks do not prove the interactive phone entry or sign-in flow. |
| Mobile PWA | BLOCKED | Supported mobile devices, microphone grants and real background/reconnect/ringing acceptance are unavailable in this session. |
| Telnyx production continuity | NOT TESTED | No carrier configuration was changed. An actual carrier call has not been performed, so continuity is not classified PASS. |

PARIS still requires a real authenticated duplex media integration, approved live
program knowledge, structured permission-aware transfer/callback actions and
scheduling that verifies the configured provider's availability before booking.
The existing scheduling helper stores appointments and provides Calendly links;
that alone cannot support a verified live booking claim. The remaining checklist
must not be replaced by a one-way audio demonstration or a passing health URL.

## Source verification for this draft

- 35 affected Vitest checks passed across device/client boundaries, notification
  delivery, existing call routing and Host Shop communication contracts.
- 8 Node tests passed for the loopback provisioner, authorization, availability,
  qualified contacts, transactional rollback and lease/owner revocation.
- Both migrations and their assertions executed successfully in an isolated
  PGlite 0.5.8 PostgreSQL engine. No test data was inserted in Supabase.
- LMS TypeScript check passed. Scoped ESLint passed without source warnings
  (the sparse checkout emits an unrelated Pages-directory configuration notice).
- The dedicated CI migration contract passed on PostgreSQL 17 (job 114157565721).
  Full GitHub CI/build results must be reviewed before marking this draft ready.

## Follow-up inspection at 07:11–07:24 UTC

The readiness workflow was rerun against live Google resources (attempt 2 of
38031986044). All four complete deployment gates still failed. Public health,
Supabase, authoritative application DNS, TLS and URL-map routing again passed.
LMS 00015-fnj now reports HealthCheckContainerError; Admin 00040-d9b is retired;
Marketing h7996edf4-38032584649 failed while g2-4bc83a58-38029790057 still serves.
Store remains on the earlier healthy revision. These are fresh observations,
not deployment success. Job 114156447330 explicitly reports regional CPU quota
exhaustion during revision creation and traffic activation. Other releases are
concurrently changing Google capacity; no competing traffic changes were made.

Additional source repairs:
- Recording downloads accept only the existing Telnyx recording host/bucket,
  reject redirects, bound download size/time, and finish before marking read.
  Live metadata showed 46 recording references in that provider bucket; no
  recording audio or private signed URL was printed or copied into this report.
- Authenticated clients lose blanket UPDATE authority over voicemail/callback
  rows. Read-state/status columns remain writable; recording locations and
  recipient assignments remain server-controlled.
- Phone notification attempts have durable unique claims per task, recipient,
  message kind and channel. Acceptance, partial device acceptance, failed or
  uncertain persistence, and review requirements are explicit. No automatic
  retry occurs after an ambiguous send. Existing preferences remain enforced.
- Push requests have a deadline; SMS/push operational logs omit recipients,
  private endpoints and provider response contents.
- Browser connection setup is cancelled on navigation, and successful heartbeat
  recovery clears the previous warning.
- PBX runtime audit now requires explicit extension 0, actual mailbox count,
  loaded ARI/RTP/SRTP/WebSocket modules, and secure generated endpoint profiles.
  Public transport checks include authoritative phone DNS, trusted hostname TLS
  and a validated SIP WebSocket upgrade. These checks never claim real audio.

Local source verification: 44 affected Vitest tests, 8 provisioner Node tests,
2 Python evidence-parser tests, Admin/LMS TypeScript, scoped source ESLint,
and three migrations with RLS/column-authority assertions in isolated PGlite.
Migration lint passed (1293 files). GitHub must rerun checks on this added patch.
The previous PR head df4c692 passed required CI, all three TypeScript checks,
lint, migration checks and all three canonical container builds. Advisory
accessibility/integrity/procurement failures still need review; no gate was
removed or bypassed. No production schema or phone traffic was changed here.
