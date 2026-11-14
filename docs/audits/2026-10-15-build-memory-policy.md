# Automatic build-memory audit

The observed exit-137 failures occurred during application compilation, tracing or type checking in the 8 GiB workspace. Overlapping heavy processes exhausted RAM. A separate 3 GiB heap experiment exhausted V8 during Admin type checking. These failures do not establish a leak in the running LMS or show that one learner course consumes the whole LMS memory limit.

## Coverage and corrections

| Surface | Finding | Implemented policy |
| --- | --- | --- |
| LMS Next config | Missing the Admin/Marketing memory options | Shared preset: one CPU worker, isolated webpack compilation, memory optimizations, no parallel server compilation/tracing |
| Admin and root Next configs | Independent settings; type errors could be ignored by direct builds | Shared preset; direct builds check types, canonical builds must pass a separate generated-route typecheck after compilation |
| Marketing / Store | Partial memory options; Store shares Marketing | Same complete shared preset and build entry point |
| All four Next configs | Defaults could drift between apps | Runtime configuration verification plus automatic discovery of new Next apps |
| Web Docker builders and historical aliases | Fixed heaps ranged from 3 to 16 GiB | Removed fixed builder heaps; derive heap from actual cgroup/Node/physical limits, reserve headroom and cap the heap |
| Standard builds, typechecks and lint | Independent invocations could overlap | One kernel-locked memory-intensive slot, shared across app folders and checkouts on the builder |
| Dependency installation in active web images | Could run outside the shared budget | Bounded install entry point; util-linux supplied by active web builders |
| Container workflows | Policy was not enforced uniformly | All 13 Docker-building workflows run admission; CI checks future workflows for coverage and registered image sources |
| New web containers | No shared template enforcement | Checked config/package template; new apps without the shared preset or build entry point fail preflight |
| Every registered container | Memory, saving and recovery concerns were not declared together | Each profile must reference existing memory, saving and recovery control sources; unknown workload families or missing controls fail admission |
| Native course worker | Separate CPU narration/rendering workload | Preserve finite tasks, retry/lease controls, render concurrency and regional capacity admission; no Next flags applied to native inference |
| Studio Chromium | Separate browser workload | Existing session-capacity and lifecycle guards; Next build settings do not replace Chromium runtime capacity checks |
| LLM and media GPU images | GPU/VRAM workload | Explicit workload registration; preserve model/context and media-concurrency controls; no untested runtime scaling |

Nine image profiles cover Marketing, Store, Admin, LMS, native course worker, Studio browser, the two LLM build variants and the media GPU worker. Their Google resource settings are not increased by this change. Existing Google quota still requires independent approval before higher parallel course throughput can be promised.

## Validation

- All four evaluated Next configs pass the shared policy. All nine registered image profiles and 13 container-building workflows pass source admission.
- Sixty-five memory/admission/course-capacity/recovery checks pass, including actual simultaneous command serialization, release of the slot after failure, legacy heap clamping, new-app discovery and failure propagation from the post-build typecheck.
- Marketing, Admin and LMS production compilation and their separate generated-route typechecks all pass through the shared entry point. The independent three-app typecheck and final repository lint also pass.
- The temporary process-tree RSS sampler was invalid under the execution namespace and is not accepted as peak-memory evidence. No percentage memory reduction is claimed.
- Docker is unavailable in this workspace. Actual image builds and live load tests remain CI/Google acceptance items; source/config checks do not establish runtime memory usage or absence of leaks.

Backups protect saved content; they do not increase RAM available to compilation or inference. Build RAM, web-service RAM, native/GPU worker capacity, durable storage and backup retention are separate operational requirements.

No main merge, source deployment, quota increase or production restart was performed by this audit.

## Saving and recovery evidence

Read-only production queries on October 15 found the Supabase project `ACTIVE_HEALTHY`, database size 3,321 MB, and 225 saved artifact versions for the target cosmetology course build. The `course-videos` bucket contains 9,411 objects with approximately 16.06 GB recorded in object metadata. These are persistence observations, not a remaining-quota measurement or proof of an independent backup.

| Workload | Saving contract / limitation |
| --- | --- |
| Marketing, Store, Admin, LMS | Database-backed application state; uploaded assets live in object storage. A container filesystem is not the authoritative saved copy. |
| Course worker | Versioned artifacts and fenced checkpoints survive worker restarts. The current course remains blocked at selective repair; saved evidence is present. Completed films have a streaming file-upload path. |
| Studio browser / development workspace | Provider-session store and repository synchronization exist. Unsynced workspace files and browser downloads must not be treated as durable backups; a restart/save/readback acceptance check remains required. |
| LLM workers | Model cache/baked weights are reproducible assets. Conversations and application state belong to the calling application's database, not model cache. |
| Media GPU worker | Temporary inference output is downloaded and persisted through the canonical media storage boundary before cleanup. Local generated output/model caches are not independent backups. |

The legacy `db-backup.yml` workflow only checked whether secrets existed and returned success without creating a backup. It is replaced with **Database Recovery Verification**: daily and manual, read-only provider metadata, a 36-hour freshness requirement, and failure for missing credentials, denied access, stale or missing recovery points. It never initiates restoration or exports sensitive records. Six regression checks cover recent daily/physical backups and missing/failed/stale evidence. Live execution requires the existing GitHub backup-read token; it has not been dispatched from this branch.

The application `backups` table is empty, which does **not** establish absence of Supabase-managed backups. Provider backup metadata remains unverified in this session. Official Supabase documentation states database backups do not contain Storage objects. Independent object backup/retention and a restore drill remain separate release evidence. The legacy Admin JSON backup utility also has incomplete persistence/error handling and must not be accepted as a verified backup system; no completed backup was fabricated through that endpoint.

Registry checks certify source coverage only. Actual Google runtime RAM, GPU VRAM, disk availability, backup retention and load/restart acceptance are not certified by a file reference or passing Next build.

## Course restart release follow-up

The owner explicitly authorized deployment to restore course progress on October 15, superseding the earlier release hold for this repair. A further dispatcher defect was corrected before release: capacity admission previously counted one new task even when a batch could launch multiple workers. It now budgets the complete batch, reduces the requested count until it fits approved quota, and caps immediate claims at existing job parallelism. Existing resources and quota are preserved. Forty-one queue/monitor/region-recovery checks pass. The deployment dispatcher explicitly uses concurrency one.
