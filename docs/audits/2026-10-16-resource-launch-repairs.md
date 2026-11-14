# Resource launch and cost controls

## Changes prepared in PR 1911

- Direct course execution now reads the deployed task resource requirements and approved regional capacity before starting a task. Missing quota evidence or insufficient CPU/RAM prevents launch. Pending/running executions are checked again after the capacity read. Exactly one task is launched; no resizing, checkpoint reset or queue rewrite is performed.
- The scheduled queue dispatcher and recovery coordinator now use the same existing `google-course-runtime-operations` lane as direct course execution and worker deployment. This closes two mismatched GitHub concurrency groups. It is not a cross-platform distributed reservation or a claim that every manual launch path is covered. HTTP services remain available concurrently.
- The existing read-only regional audit now inventories supported project assets, VMs, disks, addresses, snapshots, forwarding rules, routers/NAT counts and buckets. It prints selected infrastructure metadata, never VM environment/metadata or raw CLI errors. Unreadable sections fail explicitly rather than appearing empty. Unattached disks, reserved addresses and browser resources on multiple platforms are review candidates, not automatically deleted resources or proven waste.

## Credit and account evidence

The user confirms being a new Google Cloud customer and already approved for Google for Nonprofits. The August 24, 2025 email confirms an existing SELFISH INC nonprofit account and approved administrator access. Neither this email nor a resource inventory establishes a $300 balance. Google's $300 new-customer trial is separate from nonprofit approval. The billing balance/expiration remains unverified because browser access to console.cloud.google.com was denied. No alternate route was used to bypass that denial, no credit was claimed and no billing account was changed.

## Limits

No deployments, paid benchmark jobs, new services, region moves, IAM changes, resizing or destructive cleanup were initiated. No dollar savings have been measured. Store application packaging, authenticated checkout, full phone-provider cutover, deployment headroom and the active Studio browser destination still need production acceptance. The previous PR head had 28 successful checks and two skipped checks; this does not establish production rollout.

## Verification

Focused launch/dispatch/continuation/regional tests and cost-inventory redaction tests are run before publishing these changes. Fail-closed launch behavior covers denied quota reads, insufficient allocation and a competing execution appearing during the capacity inventory. Workflow syntax and final diff are checked separately.
