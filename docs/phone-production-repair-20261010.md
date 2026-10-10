# Production phone repair evidence — 10 October 2026

This repair is incomplete. The follow-up change is a **draft**, not a completed
telephone replacement or authority to switch carrier traffic. No Telnyx number,
trunk, authoritative DNS record or recording was changed. No direct production
SQL write or DDL was performed. A later authenticated browser check used the
application's normal device connection/disconnection path, as documented below. Local test fixtures are isolated and are not production evidence.

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
| phone.elevateforhumanity.org | PASS | 07:38 UTC audit: all three authoritative nameservers and public resolution return 107.178.216.162; trusted TLS and SIP WebSocket upgrade verified. Calls remain untested. |

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

1. Review the four new migrations and current live schema; retain the default
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

Rollback keeps all four migrations and all records: restore the old app revisions,
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
| Asterisk dialplan | FAIL | 07:38 UTC runtime audit: Asterisk 20.15.2 runs with PJSIP/WebRTC/SRTP/ARI/RTP modules; explicit operator 0 is absent and zero generated secure PWA endpoints were found. |
| WebRTC registration | NOT TESTED | Local protocol/boundary tests pass; no live authorized PWA SIP registration has been completed. |
| PWA incoming/two-way audio | BLOCKED | Requires permitted test accounts/devices and a live acceptance participant; no actual two-way call has been made. |
| Independent PARIS | FAIL | Authenticated duplex ARI media consumer and action integration are not implemented or deployed. Existing Telnyx PARIS is retained. |
| Operator 0 | FAIL | Actual internal and generated contexts do not contain an explicit operator-0 route. No operator call was placed. |
| Independent voicemail | FAIL | Running mailbox assignments, recording ingest/storage, recipient inbox and notification integration remain incomplete. |
| Notification delivery | NOT TESTED | Claim/error handling is locally tested; production migration, revised worker deployment and authorized delivery verification remain outstanding. |
| Website phone entry | PASS | Live homepage telephone link matches the active primary carrier number; public PARIS opens and answered an enrollment/funding question with /apply and no funding guarantee. This does not verify PWA sign-in or voice calling. |
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

## Authorization and deployment follow-up

All five LMS phone endpoints now preserve signed-out/forbidden responses as
401/403; unexpected authorization failures return a generic, non-cacheable 503.
This repairs an unhandled-error path without bypassing the existing actor,
extension ownership or preview checks. The updated local suite passed 48 tests
across 11 files; LMS TypeScript and scoped source lint also passed.

The read-only runtime audit is separately reviewable in
[PR 1695](https://github.com/elevate-for-humanity/Elevate-lms/pull/1695) so actual
PBX capabilities can be established before any provisioning service activation.
It changes no live configuration and sends no SIP call.

Google Marketing activation run 38034588592 failed at 07:29 UTC because
`us-central1` CPU quota prevented tagged-revision activation. Regional publish
run 38034405331 verified its authenticated regional runtime, then stopped because
public invoker access requires the owner to grant the intended permission.
Neither run proves a completed public deployment. No IAM or traffic changes were
made to work around these failures.

The audit prerequisite PR 1695 merged at
`e0cfc9a089c43bceeed1f15b0ca293e662187c2a` after the required gate and its parser
contract passed. The live audit still must finish before runtime findings can
be classified. Browser inspection confirmed that the public homepage has main
telephone links matching the active primary Telnyx number in Supabase (aggregate
query; no customer data). This verifies link configuration, not an actual call.

Handler-level authorization tests additionally exposed and corrected error
propagation through both phone settings handlers. All five endpoint files now
have signed-out handler coverage, with 401/403/503 checks on the GET/PATCH
context consumers. The targeted authorization/Host Shop rerun passed 16 tests;
LMS TypeScript was rerun without incremental cache and passed.

## Live PBX audit and activation blockers at 07:38–07:44 UTC

[Audit run 38035045806](https://github.com/elevate-for-humanity/Elevate-lms/actions/runs/38035045806)
ran the merged prerequisite through the authorized Google identity. It failed
accurately and preserved separate sanitized transport/runtime artifacts:

- **PASS** — VM identity/IP; all authoritative phone DNS records; trusted Let's
  Encrypt certificate (8 October 2026–6 January 2027); gateway HTTP 200; actual
  SIP subprotocol WebSocket upgrade.
- **PASS** — Asterisk 20.15.2 CLI and loaded PJSIP, WebSocket, SRTP, ARI, RTP and
  voicemail modules. Zero active calls were observed at that instant.
- **FAIL** — Explicit operator 0 in the inspected internal/generated contexts;
  secure generated PWA endpoints (count zero); voicemail configuration could
  not be verified (the CLI did not yield a recognized positive mailbox count).
- **NOT TESTED** — Authenticated registration, two-way audio, operator calling,
  independent PARIS conversation, recording delivery and mobile behavior.

The existing inventory was also rerun at 06:53 UTC and shows the PBX using the
Compute default service identity with default scopes, **without cloud-platform**.
Google requires that scope for this VM's REST access to Secret Manager:
https://docs.cloud.google.com/secret-manager/docs/access-secret-version .

The fresh read-only access verification at 07:44 UTC (run 37966361137, job
114164713231) confirms the deploy identity can inspect secret metadata but lacks
secret creation, version addition/access and secret/project IAM write permission.
The owned-model check also did not verify a Google model endpoint; this must be
resolved before selecting it for independent PARIS. No secret value was logged.

**BLOCKED — Independent PBX activation:** an authorized Google administrator must
prepare the provisioning token and existing Supabase credential binding in GSM,
grant the runtime identity access to only those specific secrets, and correct the
VM scope through a controlled maintenance operation. Review the existing startup
metadata before any reboot: the old bootstrap resets the repository and may
recreate Asterisk. The staged bootstrap guard preserves an existing container and
refuses unreviewed recovery. Updating this repository alone does not replace the
VM's already-installed startup metadata. Do not restart it from these instructions.

**BLOCKED — Application release:** central-region revision activation still fails
CPU quota, and the alternative regional publication requires owner-controlled
public invoker access. No capacity, IAM, public route or DNS change was made.

Additional source protection: TLS repair verifies an established gateway's TLS
and SIP transport before any Caddyfile write or image pull, preserving its reviewed
routes. Stopped or unhealthy existing gateways require reviewed recovery instead
of being removed. Phone/provider exception logs now omit raw database/SDK error
objects that could contain caller information. All changes remain staged in PR
1692; they are not live PBX configuration changes.

Verification added eight isolated shell-boundary regression tests for bootstrap
and TLS preservation. These exercise actual scripts with fake command boundaries;
they are not production call evidence. The phone suite passed 55 Vitest tests,
and eight provisioner Node/two audit-parser Python checks remain in the CI
contract. No voicemail, history, callback or device record was deleted.

## Durable carrier event repair and latest verification

The Telnyx webhook no longer deletes its event receipt after a handler failure.
The fourth migration adds service-role-only atomic processing claims to the
existing event table. Known handler failures can retry with the same event-derived
Telnyx command IDs and durable notification claims. Concurrent duplicates wait;
interrupted workers with unknown outcomes require reconciliation. Historical
receipts remain `legacy_received`, not fabricated completed events. No historical
payload or record is removed or rewritten.

Call initialization now requires successful persistence before answering and does
not reset an existing answered/completed call to ringing on retry. Number/context
lookup outages return 503 rather than a false unknown-number acknowledgment.
Critical PARIS transcript/intake and call outcome writes require a persisted row
before advancing or returning success. Final event completion must also persist.
Raw provider or database exception content is excluded from operational logs.

Apply the fourth migration before releasing the new Admin webhook. During rollback,
keep all event rows/columns and reconcile `processing`, `failed` and `review_required`
events against provider evidence; do not bulk-replay them. Restoring the old Admin
also restores its legacy delete-on-failure behavior, so prefer a forward repair
of the event handler when carrier continuity permits. No production DDL was run.

Verification: **71 Vitest tests across 13 files**, eight provisioner Node tests,
ten Python audit/preservation tests, fresh Admin/LMS TypeScript checks, scoped
source ESLint and shell syntax checks. All four migrations and permission,
deduplication, retry, unknown-outcome, backlog and record-preservation assertions
executed in isolated PGlite. Current-head PostgreSQL 17 and build CI must also
finish before release. Test fixtures are never production call evidence.

Readiness attempt 3 of run 38031986044, observed **07:54–07:55 UTC**, still reports
all four complete deployments **FAIL**. The selected revisions are:

| App | Selected revision | Served public commit | Result |
| --- | --- | --- | --- |
| Marketing | `elevate-marketing-migration-h7996edf4-38032584649` | `4bc83a5833306f63145f97066c55ceb25c4c5eb1` | FAIL |
| LMS | `elevate-lms-migration-00015-fnj` | `abe1318ac5891b51fe1fb4a447a60e0c9b3a71bd` | FAIL |
| Admin | `elevate-admin-migration-00041-rhw` | `4bc83a5833306f63145f97066c55ceb25c4c5eb1` | FAIL |
| Store | `elevate-store-migration-ra59826c2-38011873208-1` | `56837635ab749aa4a1637abdf97c80ebbde5f811` | FAIL |

All selected revisions have `HealthCheckContainerError`, zero selected traffic,
and image provenance differing from the healthy public revision. Admin's latest
created/ready names match, but its actual revision health fails; the separate
revision check correctly rejects it. DNS/TLS, public health and Supabase checks
remain separate from this deployment failure.

**PASS — Public speech synthesis response only:** live workflow 37952743996,
job 114166091094 at 07:52:14 UTC returned HTTP 200, `audio/mpeg`, 18,240 bytes for
a generic greeting. Public PARIS text chat also answered the application/funding
question accurately. Neither result proves caller input audio, playback, SIP
registration, independent multi-turn voice conversation or two-way phone audio.

Supabase aggregate recheck at **08:05:01 UTC** found 14 provisioned active devices,
zero heartbeats within three minutes, zero missing/disabled extensions, zero owner
mismatches and zero availability-disabled devices. Nine associated extension
presence values still said available despite stale device evidence; three devices'
only stored heartbeat was within five seconds of creation. This confirms unreliable
presence bookkeeping and rules out those ownership/availability configuration
failures for this observed set. It does not establish whether an absent browser
failed authentication, disconnected, slept or lost microphone permission.
No device status was rewritten by this audit. Last-24-hour aggregate carrier event
counts included answer, recording and PARIS-history receipts, but receipt presence
is not proof of a successful live acceptance conversation or recipient delivery.


## Authenticated desktop phone check and lifecycle repair

The existing signed-in browser session successfully loaded the production LMS
phone dashboard and its assigned extension. The current carrier client connected,
and an aggregate Supabase check at **08:25:41 UTC** showed one newly created real
browser-device record and one recent heartbeat (15 total records, compared with
14 before opening the page). This was the application's normal live registration
path, not a fabricated database fixture or an Asterisk acceptance test. The test
browser was explicitly disconnected and closed; existing phone histories,
callbacks, voicemail and other device records were preserved. No outbound call
was placed and no callback or notification was submitted.

**PASS — Authenticated dashboard access and current carrier connection UI.**
**NOT TESTED — Actual incoming ringing or two-way audio.** Independent registration
still requires the staged Asterisk provisioner, scoped GSM bindings and permitted
live call participants. An existing authenticated browser is available; credentials
are not the blocker for this specific dashboard-access check.

**FAIL — Deployed disconnect status:** after disconnect, the live page displayed
both “Connect phone” and “Phone is online and ready for calls.” The follow-up
source now clears that stale success message, distinguishes local disconnect
from failed server presence acknowledgment and fences heartbeat responses to the
current registration epoch. A late heartbeat cannot promote a disconnected or
closed provider connection back online. Three actual React lifecycle tests pass;
LMS TypeScript and scoped ESLint pass. These source fixes are not deployed.

PBX startup preservation was isolated into merged PRs **1698** and **1699**.
Live run **38037901924** verified unchanged PBX and TLS gateway container IDs,
running state and start times. Startup metadata replacement stopped with
`unrecognized_startup_script_preserved`; no metadata was changed by that run.
PR **1700** pins the separately reviewed original repository bootstrap as another
exact recognized source. Unknown/custom scripts remain blocked. The original
source's Git blob is `3b34247ddef19178e3bcdc1c94cdc5d46ac2f06f`; no runtime
script contents, credentials or caller details were copied to this report.
