# Selected Google layout

User selected the historical Northflank operating pattern on Google, not a Northflank deployment.

| Concern | Selected behavior | Acceptance evidence still needed |
|---|---|---|
| Web | Separate Admin, LMS, Marketing and Store containers | Fresh effective resource inventory and health tests |
| Heavy processing | On-demand east1 job; default one worker, honor explicit workflow limit | Immutable image parity, quota, secret access, network/storage access and a finished saved lesson |
| Release overlap | Public releases and legacy recovery share central1 lock; legacy recovery manual only | Main workflow execution |
| Persistent state | Outside writable container filesystem; preserve browser authentication and course checkpoints | Storage bindings and restart recovery verification |
| Shared program documents/source files | Nonprofit Workspace Shared Drives, subject to activated edition and access | Admin subscription and permissions verification; no bulk move yet |
| Small app objects | Regional Standard Cloud Storage in a free-tier eligible US region, only within aggregate allowance | Existing bucket inventory, aggregate usage, operations and egress before provisioning or moving |
| Published media | Preserve B2 URLs and existing outputs | Cost and playback evidence before changing provider |

Google publishes 100 TB pooled organizational storage for nonprofit Workspace. It is Drive/email/document storage, not Cloud Run RAM or a public object-store allocation.
Cloud Storage Free Tier publishes 5 GB-months across eligible US regions per billing account; operations and transfer have separate allowances. A bucket does not enforce a hard spending cap. Do not represent a bucket or migration as automatically free.

Sources checked October 16, 2026:
- https://support.google.com/nonprofits/answer/2858465
- https://docs.cloud.google.com/free/docs/free-cloud-features

The regional continuation script previously overrode COURSE_WORKER_PARALLELISM=1 with 3. It now honors the workflow configuration and defaults to 1. This does not terminate already active executions or resize existing jobs.

No live regional move, storage provisioning, deletion, deployment, credit activation or realized dollar savings is established by this commit. Regional separation reduces contention only after verified cutover; storage changes do not increase CPU/memory quota.
