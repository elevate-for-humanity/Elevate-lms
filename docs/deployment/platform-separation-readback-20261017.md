# Platform separation readback — 2026-10-17

This is an incomplete release, not a production-readiness certificate. Production application changes remain held while separation and acceptance are unfinished. No quota increase, customer pricing change, taxpayer-data migration, or new application deployment was performed by this work.

## Latest release attempt and additional repairs

### Owner-prepared Studio identity accepted at 19:09:38 UTC

The owner ran the prepared identity setup in Google Cloud Shell and received
`bindingsVerified: true`, `applicationDeployed: false`, `sessionsMoved: false`.
GitHub subsequently verified the same boundary using its existing deployment
identity: run `39061203171`, job `117479370847`, reported attachment and secret/
storage bindings verified for `elevate-studio-runtime@elegant-racer-299721.iam.gserviceaccount.com`.
This check was read-only. It did not grant project-wide service-account creation
or policy-management permissions to GitHub; those broader permissions remain
unavailable and are unnecessary to reuse the owner's prepared Studio identity.

Routine Studio release now verifies the prepared identity rather than rerunning
owner-only service-account policy mutations. Candidate-only mode retains serving
traffic and Admin configuration, requires CI on the exact commit, refreshes
Google credentials after build, checks actual registry admission, and reserves
2 CPU / 4 GiB alongside all effective regional workloads before deployment.
A candidate must prove startup/readiness, anonymous denial, authorized workspace
access and actual browser foundation operations including encrypted provider
checkpoint restoration. Its temporary tag is released after verification while
the revision is retained; minimum instances for the serving application remain 1.

Candidate source: `c6522874c028cee96b0ef67ad1fcd964f960d935`.
Acceptance run: `39061807783`, job `117481136157`, succeeded at 19:22:46 UTC.
Revision `elevate-studio-browser-00041-muw` proved readiness, authorized workspace
access and anonymous denial. All 14 live foundation checks passed, including
encrypted provider checkpoint recovery, session identity, keyboard/pointer,
frames, popups/tabs, uploads, downloads, dialogs, scrolling and history. The
actual container suite passed 95 tests with zero skips; its 16 CDP integration
tests also passed twice. Image digest:
`sha256:f0607739918d3a30d61d14b9a0a444d25303ecea1d748247d5d3352e629665bb`.
The live capacity gate reserved 17 vCPU / 36 GiB against 20 vCPU / 40 GiB. This
is configured rollout capacity, not measured instantaneous utilization. The
candidate tag was released, revision retained, and serving traffic/Admin were
not switched. Final independent metadata readback run `39062596047`, job `117483470935`,
passed at 19:28:38 UTC. It confirmed the exact candidate identity, digest and
2 CPU / 4 GiB allocation above. Actual traffic is **100% to
`elevate-studio-browser-00039-yuv`**, with no remaining candidate tag. The two
preceding metadata verifier attempts failed on projected output handling; the
verifier now reads native metadata in memory and emits only the scoped resource
and traffic summary. No secret values are emitted. These verification attempts
performed no deployments or traffic changes. The superseded run `39061612514` was cancelled: its local container
build completed, but image publication and Cloud Run deployment were skipped.
No production revision was created by that superseded run.

Fresh public checks returned HTTP 200 for ping, health, readiness and version
on Marketing, LMS, Admin and Store; all four still report application commit
`accd052e05ff0d66c6a9370da77085bf254fecd5`. Auth and database dependency checks
passed. QuickBooks health still returned HTTP 503 and is not production-accepted.
The course build remained running with a live lease at 19:19:00 UTC, phase
`finished:lesson_film_render`; this is not a completed-job assertion.

General browser-tab, terminal-process and workspace restoration remain separate
open acceptance gates. Candidate browser/provider tests must not be represented
as a generic workspace restoration certificate or full platform separation.

### Registry admission verified at 17:56:58 UTC

Manual verification run `39055933365`, job `117463784171`, passed on main
`fe9f86f03d9cb7e578f0e396aad7ec43b704f5e8`. Google accepted an empty upload
in the existing Artifact Registry repository; the exact returned upload session
was cancelled successfully. No layer, manifest, image, tag, production revision,
or billing setting was published. The earlier billing rejection must no longer
be presented as the current confirmed blocker. Opening/cancelling a session is
not proof that a full image push or production release has passed.

The preflight handles Google's repository-scoped internal upload path, rejects
cross-host/project/repository destinations, redacts opaque session identifiers,
and blocks builds if admission or cleanup fails. Fourteen focused checks pass.
Admin/Store now run it before Docker; Marketing/LMS/Course already share the
same billing preflight. Long build paths refresh credentials before upload.

Dedicated identity preparation still fails Google permissions in fresh preflight
job `117458626553`. The prepared Studio identity setup remains owner-executable;
no broader deployer role was granted and Studio remains on its existing identity.
The Google console is unavailable in this browser. This is an access limitation,
not evidence the public websites are down. The release hold remains true while
application separation and acceptance are unfinished. No production traffic was
changed in this follow-up. Latest course-job read at 17:54:40 UTC was running
with a live lease; no duplicate job was started.

### Follow-up verification at 13:32–13:43 Eastern

- Fresh Google preflight job `117458626553` still denies dedicated service
  identity preparation. Billing remains enabled at project level, but linked
  billing-account inspection is HTTP 403; the prior Artifact Registry upload
  rejection has not been proven resolved. No new production upload was attempted.
- Studio repair commit `a8d28a9e95fb0761670e1269caf28f8a9c20d82a` retains live
  provider sessions when final checkpoints fail during normal close/expiry.
  Forced shutdown/dead-browser cleanup explicitly reports checkpoint failure.
  Production min=1 and the existing serving revision remain unchanged.
- Studio validation run `39054464852` passed the actual nonroot container build,
  all **95 Chromium tests with zero skips**, 257 integration regressions, 15
  Google identity/cutover checks, and read-only practical schema verification.
  The retired-provider validation dependency was removed. CI and Pre-deploy
  Check passed for that commit. These are code/container checks, not a live
  generic workspace or terminal restoration certificate.
- Historical recovery run `39054560512` verified execution
  `elevate-course-builder-x7tbr` is already terminal. Its image is
  `sha256:8854ba2d21bdeab0b8e88fb3f42072677e3a5b82f5e890ff2f5d77ca84473016`;
  today's approved template uses
  `sha256:1c6e221e95530c20ff6b85d2aca254228501c8eb6859325e70f050ee3eeb7c9d`.
  No cancellation was requested, and checkpoints were retained. The historical
  `EXECUTION_IMAGE_MISMATCH` incident is resolved as an obsolete terminal
  execution; an active mismatched execution still fails closed.
- A separate course build was already running under its existing coordinator.
  It was not duplicated or restarted. As of 17:42 UTC its live lease was current
  and progress reported `render-frames:900`; this is not a completion assertion.
- An existing lesson artifact snapshot passed full MP4 decode: 232.122 seconds,
  H.264 1920×1080 video, AAC stereo 48 kHz audio, 17,892,097 bytes. SHA-256:
  `b749410662a09363275a8d7c27ffe47bb0db77141bbf7f637a7b3235b018e2ac`.
  Its VTT contains cue timings and its transcript is nonempty. The temporary
  inspection copy was removed. **Its URLs point to Supabase storage, not B2.**
  This does not satisfy the approved B2 destination or instructional acceptance.
- Course job deployment configuration now requires one complete Backblaze
  credential family and an unsigned HTTPS delivery base, normalizes approved
  B2 settings, and forces all new course-media uploads through the explicit B2
  backend. Missing/incompatible configuration refuses deployment rather than
  silently falling back. Existing playable objects, live job configuration,
  saved checkpoints, capacity and customer data were not changed. Thirteen
  focused deployment/execution checks and three regional-sync checks passed.

The remaining work still includes Store merchant acceptance/configuration
cutover, Legacy Firebase reconciliation and deployment, tax runtime/auth and
private-document migration, B2 publication/recovery acceptance, generic Studio
workspace/terminal restoration, and live Admin permission testing. Account-level
access blocks production actions; these engineering and acceptance tasks are
not all explained by the account blocker.

The owner authorized production release on October 17. Main commit
`cb0862c1db4cddd8861a097427d1dc58d3db5821` passed CI, Pre-deploy Check and
Compliance Gate. Store release run `39048024817`, job `117440634413`, passed
typechecking, application build and actual container identity/health tests.
At **16:18:48 UTC**, Artifact Registry rejected the tested image upload with
“This API method requires billing to be enabled.” The workflow never reached
revision creation or traffic activation. The previous healthy Store revision
was retained. Further web uploads were not started, and the coordinated release
hold was restored to avoid repeating a known blocked operation.

This is distinct from missing IAM permissions. The read-only Google preflight
at **16:09:25 UTC**, job `117440955495`, reported project billing enabled while
linked billing-account inspection remained HTTP 403. The account owner must
resolve the Artifact Registry billing rejection; this evidence does not establish
whether payment status, account activation, propagation or another billing issue
caused it. Do not repeatedly rebuild images to test account activation.

That preflight observed Admin `00193-nnw`, LMS `00171-bcd`, Marketing
`raccd052e-39044134724-1` and Store `raccd052e-39044029981-1`, each at 100%
traffic under its full `elevate-…-migration-` service prefix. The web application
release represented commit `accd052e05ff0d66c6a9370da77085bf254fecd5`.
The targeted central Course Builder and both renderer jobs had no active
executions. Regional quotas remained 20 vCPU / 40 GiB. Studio remained on
`elevate-studio-browser-00039-yuv`, min=1, with the Admin identity.

Additional engineering completed during the release attempt:

- Dedicated Supersonic database migrations now make its public status view
  enforce row policies, restrict internal trigger RPCs, fix function search
  paths, and prevent users assigning themselves privileged profile roles.
  SQL readback verifies denied role/owner changes, allowed display-name updates,
  service-role administration and the retained auth trigger. Reproducible bodies
  and target-specific instructions are in `scripts/db/supersonic/`.
- All 31 tax/SFC tables in the dedicated database were empty; primary tax tables
  contained one office configuration row. Crucially, primary private storage
  contains **three tax-document objects**. Those objects were not opened or moved.
  Empty relational tables are not proof that no taxpayer information exists.
- Exact course recovery now recognizes an already-terminal historical execution
  without cancellation. Active mismatched images still fail the integrity gate;
  no attempts, leases or checkpoints are reset. Recovery is manual, preventing
  automatic retries of the old incident after unrelated worker releases. Seven
  recovery checks pass. This is not completed rendering or checkpoint acceptance.
- Store billing dispatcher rollout now verifies its existing dedicated identity,
  refuses active executions, and checks fresh bounded regional capacity before
  changing the job. Its 18 focused billing checks pass. The billing dispatcher
  has not been switched to Store or executed by this work.

Application runtime cutover, merchant acceptance, Firebase/Legacy reconciliation,
tax-document migration, full course media acceptance and generic Studio session
restoration remain unfinished. The database hardening above is applied and
verified; the new web application repairs are not live.

## Implemented and tested changes

- Store has local sign-in, safe commerce return URLs, local verified payment callback routing, local password recovery, and a product-catalog dependency check.
- Store billing delivery can use Store endpoints without contacting Admin, Marketing, or the agentic worker. Existing Admin routes use the same shared handlers for rollback compatibility. Paid-invoice checks, job claiming, invoice idempotency, and failed-batch detection remain enabled. Switching the dispatcher requires an explicit Store deployment and successful version, readiness, database and QuickBooks checks first.
- Store-owned PayPal configuration supports the exact environment and webhook variable names consumed by the billing clients. Actual provider credentials have not been migrated or independently accepted.
- Marketing Store pages redirect to the existing Store domain; Store page canonical URLs use that domain. Existing callback and mutation URLs remain intact during transition.
- Web runtime heap sizing follows the running container's memory limit. The existing 8 GiB profile retains its 4 GiB heap ceiling; a 2 GiB test container would use a 1 GiB heap. This does not change CPU/memory allocations and does not establish checkout performance at smaller sizes.
- Studio checkpoint saves reject missing encryption and preserve the last durable state if storage fails. A prepared dedicated Studio identity and canonical-secret cutover path remain unexecuted.
- Admin's read-only application inventory includes actual serving revision resources and commits, plus recent CPU/memory distribution means and active/idle instance samples when Google Monitoring permits them. Missing metrics remain unknown. No deployment or billing action is attached to rendering this page.
- Legacy 83's imported unauthenticated administrator bootstrap endpoints are retired with HTTP 410, without Firebase initialization or account writes. Dedicated repository build validation passed on commit `825f10529741e8a6db4c25985ca7093a6a8b88c0`, run `39045443629`.

## Acceptance gates

“Tested” below applies only to the described changes, not the entire application lifecycle.

| Component | Implemented in code | Tested | Deployed | Verified live |
|---|---|---|---|---|
| Marketing | Store handoff and canonical links | Middleware/route checks and typecheck | New handoff pending | Existing version endpoint only |
| LMS | Shared recovery handler preserves existing LMS behavior | Auth checks and typecheck | New shared handler pending | Existing version endpoint only |
| Admin | Read-only inventory, versions and sampled service metrics | Metadata/redaction/metric tests and typecheck | Inventory changes pending | Existing version endpoint only |
| Store | Local authentication/recovery, health, callbacks and independent billing delivery path | Focused auth/billing checks and typecheck | Latest repairs pending | Existing storefront runtime version only; no checkout acceptance |
| Legacy 83 | Bootstrap security repair; existing independent source and database foundation retained | Dedicated repository build and bootstrap check passed | No independent Cloud Run deployment verified | No complete portal/Academy/booking/payment acceptance |
| Supersonic | Existing tax source and dedicated Starter database identified | Full separate application acceptance not run | No separate Cloud Run deployment verified | Not verified |
| Course Builder | Existing finite job and integrity safeguards retained | Checkpoint compatibility and complete lesson acceptance unresolved | Existing job remains | No new complete MP4 acceptance |
| Studio | Durable checkpoint repair and scoped identity preparation | Focused persistence/lifecycle/cutover checks | New identity and persistence cutover pending | General browser, terminal and workspace restoration not verified |

## Production observations

Read-only Google preflight run `39039703958`, latest inspect job `117431507004`, observed infrastructure at **2026-10-17T15:24:22Z**. Later releases can change these values; re-read immediately before cutover.

| Service / region | Observed serving revision | Traffic | CPU | Memory |
|---|---|---:|---:|---:|
| Admin / us-central1 | elevate-admin-migration-00192-4qj | 100% | 4 | 8 GiB |
| LMS / us-central1 | elevate-lms-migration-00170-bxj | 100% | 4 | 8 GiB |
| Marketing / us-central1 | elevate-marketing-migration-rae5983fe-39035995620-1 | 100% | 1 | 4 GiB |
| Store / us-central1 | elevate-store-migration-r23b47627-39031123126-1 | 100% | 4 | 8 GiB |
| Studio / us-central1 | elevate-studio-browser-00039-yuv | 100% | 2 | 4 GiB |
| Marketing / us-east1 | elevate-marketing-migration-00001-dwt | 100% | 2 | 4 GiB |

A separate cache-busted public version check at **15:37:37Z** returned HTTP 200 from all four web domains. Store reported `accd052e05ff0d66c6a9370da77085bf254fecd5`; Marketing, LMS and Admin reported `ae5983feb634c46a35af9cabd9e5e7a31afb20a0`. This demonstrates that an intervening Store release occurred; the earlier revision table is not a current traffic assertion. The newer separation repairs must not be claimed live based on those version responses.

Targeted job inspection found Course Builder at 4 CPU / 8 GiB and video renderer jobs at 8 CPU / 32 GiB in us-central1 and us-east1; no active executions were present in those targeted job reads. This is not a complete project job/asset inventory. Broad Cloud Asset inventory remains permission denied.

## Database boundaries

- Current Store runtime remains on Elevate's existing Supabase project `cuxzzpsyufcewtmicszk`. Dedicated Store project `ebnbeqdsuxygopetptlv` exists, but its schema/catalog/payment compatibility has not passed migration acceptance. Do not simply swap the URL.
- Dedicated Legacy project `vhulnzcfmlnsmoxixjco` exists. Read-only counts during this work: four Academy courses, zero auth users, zero client profiles, zero Academy enrollments. The recovered portal and course UI still use Firebase. That source/data boundary must be reconciled before switching users.
- Dedicated Supersonic Starter project `jlqrfwxuhpzmuivdxvvz` exists. Tax tables also remain in the primary Elevate database. No taxpayer data has been moved, copied, or deleted by this work. Backups, complete table reconciliation, RLS tests and rollback are required before migration.

## Capacity and costs

Effective Cloud Run quota remained **20 vCPU / 40 GiB** in both inspected regions. Central serving revision configurations total **15 vCPU / 32 GiB per one-instance set**; this is configured capacity, not instantaneous usage. A concurrent Store candidate at 4 CPU / 8 GiB consumes the remaining 8 GiB of that simplified configuration budget. Actual scaling, tagged revisions and active job executions must be included by the existing capacity gate before any rollout.

Store's proposed 1 CPU / 2 GiB profile is 75% lower configured allocation than 4 CPU / 8 GiB. No such resource reduction was applied. This is not a demonstrated 75% billing reduction: checkout latency, cold starts, throughput and instance duration must be measured first.

Renderer monitoring reads succeeded but returned no samples in the preflight window. Empty samples cannot establish low usage or memory safety. Billing is enabled, but linked billing account inspection returned permission denied. An absolute monthly cost comparison and credit balance cannot be verified from this evidence.

## Concrete blockers

1. GitHub deployer still lacks project-level `iam.serviceAccounts.create` and IAM policy-management permissions needed to establish new dedicated identities. Existing scoped actAs access for Admin/LMS/Marketing/Store is allowed; do not confuse this with authority to create Studio/Legacy/tax identities. The owner has now completed `scripts/gcp/prepare-studio-service-identity.mjs`, and GitHub verified the scoped Studio attachment, auth-secret and auth-bucket bindings. Routine releases verify those existing grants. New Legacy/tax identities remain a separate provisioning boundary. Do not grant Owner/Editor or fall back to Admin's runtime identity.
2. Store credential migration, scoped secret binding, provider authorization and sandbox purchase-to-order acceptance remain incomplete. Marketing bootstrap inheritance is retained until the independent configuration is verified.
3. Studio currently uses Admin's identity. Only Envato provider auth state has existing encrypted persistence; generic browser sessions, terminals and local workspace restoration have not passed restart/reconnection acceptance. Preserve min=1; do not move or scale to zero yet.
4. Legacy authentication, customer data and Academy still span recovered Firebase code and the dedicated Supabase foundation. Its own PayPal/QuickBooks merchant authorization is not verified.
5. Supersonic has no verified separate runtime or completed data-boundary migration. IRS/provider/ATS approval gates remain in force.
6. Historical execution image mismatch is resolved as an already-terminal incident (see follow-up evidence). New complete-lesson checkpoint compatibility, B2 delivery and final media acceptance remain incomplete. Do not disable integrity checks or restart all courses. A dedicated consumer must prove both video and agentic task processing before disabling Admin workers.
7. Final integrated builds, security review, application-specific production acceptance and one coordinated sequential release remain incomplete. No component should be labeled fully production-ready from a passing workflow alone.

## Studio terminal recovery implementation (pending deployment)

The terminal runtime now checkpoints bounded output, working-directory metadata,
owner and process status using AES-256-GCM under the existing Studio encryption
secret and approved auth storage directory. Filenames are keyed; request bodies
cannot choose another operator. The Admin proxy supplies the verified operator ID.
No command input is stored for automatic replay. After runtime replacement, saved
running terminals become interrupted and require an explicit new-shell action.
Navigating away from the workspace no longer stops an attached terminal.

Local verification covers a fresh Node process, real Bash output and directory
recovery, ciphertext tampering, operator boundaries, unavailable/recovered storage,
missing directories, bounded history/cache, concurrent resumes and explicit stop.
Admin component and proxy tests verify reattachment, no automatic replay/stop and
server-derived ownership. The Chromium CI suite includes these terminal tests and
the Admin reconnect regression.

Status: implemented in code and locally tested; not deployed or verified live.
This does not persist workspace files, recreate OS processes, restore shell-local
variables or migrate existing in-memory terminals. Shared workspace access retains
its existing trusted-admin boundary. Full workspace/browser restoration and a
coordinated runtime/Admin acceptance gate remain required before production
cutover or any reduction of minimum instances. Existing revision 00039-yuv remains
the last verified production traffic target; no new Google deployment was requested
for this implementation.

Terminal recovery CI evidence for `0b8e477d9a68cb8acce6da95f82153b3e6384c8e`:
Studio validation run `39063828258` passed both jobs: 106 actual nonroot
Chromium/container tests, 262 Admin/browser integration tests across 50 files,
and 17 identity/cutover contracts. Admin/Marketing TypeScript, credential scanning
and lockfile integrity passed. The broader integrity gate identified the removed
`createTerminalSession` compatibility entry point; it is restored as the actual
route entry point delegating to the durable manager. The unchanged Studio
architecture gate and all 25 integration-gate checks then passed locally.
Production remains unchanged; the follow-up commit still requires complete CI.

## Verified Studio provider configuration migration — 20:01Z

Terminal recovery implementation is on main via `0b8e477` and compatibility fix
`9bd7d42`. Actual Chromium validation run `39064035318` passed 106 container tests,
262 Admin/browser tests across 50 files and 17 identity/cutover tests. CI Required
Gate and Integrity Gate passed for the corrected runtime commit. These source
changes have not been deployed to Google.

Read-only production inspection found all three Cloudflare keys in the encrypted
canonical `platform_secrets` runtime scope, but absent from Google's Admin runtime
configuration and direct deployment bindings. Prepared migration `98fafcd` reads
only these existing keys, verifies the provider account/model without inference,
preserves unrelated configuration and rejects conflicting values or concurrent
configuration changes. Seven migration safety tests passed.

Validation run `39064688890` succeeded without writes. Apply run `39064879473`
created and exactly read back `elevate-admin-runtime-config` version **6** in
project `484736877039`; prior versions were preserved. No IAM, container, traffic,
instance settings, pricing or source secret-store changes occurred. CI Required
Gate, Integrity Gate, credential scan, lint and all three app typechecks passed
for the migration commit.

Independent read-only audit run `39064479434`, rerun job `117490488524`, passed at
**20:01:50Z** with browser health **200**, Cloudflare authorization **200** and no
reported failures. The Cloudflare values are staged in Google configuration;
they are **not directly bound to the currently deployed Admin revision**. Do not
report a new Admin deployment or live runtime independence from this migration.
Anonymous `/api/tax/returns` and `/api/tax/interview` both returned JSON **401**.
This verifies those anonymous access boundaries only, not tax filing readiness.

The trial VM remains running with its retained disk attached. Its private files
and active execution state have not been inventoried or migrated. Generic
browser/workspace restoration, merchant acceptance, Legacy and tax boundaries,
and complete B2 course-delivery acceptance remain open. Existing Studio serving
traffic and min/max instance configuration were not changed.
