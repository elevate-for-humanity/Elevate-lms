# Private CPU inference candidate

This candidate derives Q4_K_M GGUF weights from the same approved
`Qwen/Qwen2.5-7B-Instruct` checkpoint at
`a09a35458c702b33eeacc393d103063234e8bc28`. The existing downloader verifies
all four original shard hashes before conversion. The CPU artifact records
those hashes, the pinned llama.cpp source revision, the quantized artifact
hash, and both licenses. Startup verifies the quantized checksum again.

The container requires exactly 8 GiB, uses four CPU threads and one 8192-token
slot, and has no GPU backend or runtime model downloads. It runs as a nonroot
user, disables the Web UI and server subprocess support, and requires the
model application secret. Its build workflow runs real authentication,
inference, structured tool-call, and streaming tests with Docker restricted
to 4 vCPU / 8 GiB. That is candidate evidence, not production acceptance.

## Release boundary

The verification workflow builds and tests only. It does not create Google
services, credentials, identities, permissions, or change Admin configuration.

A production release must:

1. Verify fresh regional quota with the existing regional-capacity checker.
   Prefer the already approved secondary region `us-east1` to preserve primary
   web rollout headroom. Reserve 4 vCPU / 8 GiB alongside active course jobs.
2. Use an immutable image digest, maximum one instance, concurrency one, and
   minimum zero. Keep the service private with Cloud Run IAM; do not add
   `allUsers` or disable application authentication.
3. Verify the existing model runtime identity and existing secret-reader
   binding. Missing credentials or grants are an explicit blocker, not
   permission to create them automatically.
4. Verify that the actual Admin runtime identity can invoke this exact private
   service. Any missing `roles/run.invoker` grant requires explicit review.
5. Run `accept-owned-cpu-model.mjs` against the exact service URL with both the
   model token and a valid Google invocation identity. Require every test.
6. Release the Google-IAM transport adapter to Admin before setting
   `ELEVATE_LLM_GOOGLE_IAM=true` and its CPU URL. Keep the existing application
   secret. Preserve the prior endpoint/configuration for rollback.
7. Prove live PARIS chat, audited authorized commands, and internal engineering
   readiness. Do not substitute external providers or declare acceptance from
   an HTTP health response alone.

If any acceptance test fails, preserve the current Admin configuration and
serving revision. The model image contains no course assets or checkpoints;
rebuilding it never resets or restarts an active course execution.
