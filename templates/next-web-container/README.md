# New web-container defaults

Use these two files when adding an app under `apps/<name>` and set its package name. They inherit the shared build-memory preset, kernel-locked admission, available-container RAM budget and mandatory type checking after compilation. Keep the app's normal routes, styling, secrets and public assets separate from this build policy.

Register the container's Dockerfile, workload family and existing memory, saving and recovery control sources in `scripts/container-build-policy.mjs`. New apps are discovered automatically by the policy checker. Every container-building workflow must run `node scripts/check-build-memory-policy.mjs --source-only` before Docker; CI rejects missing policy coverage, incomplete workload controls, unregistered image sources, raw Next build scripts and oversized fixed builder heaps.

Keep authoritative user/course state in the database and media in durable object storage. Container files and model caches are not backups. Run a save/readback/restart test for the new workload before release. The daily Database Recovery Verification workflow checks provider recovery-point metadata; database backups do not include the stored media objects. Object retention, off-site copies and restore drills require separate verified evidence. The registry checks source coverage and does not certify live capacity, backup retention or recovery.

Linux builders require `flock` from util-linux. The active Google web Dockerfiles install it and apply the same RAM budget to dependency installation. Use the existing finite Google capacity/readback controls for runtime resources. This preset does not grant quota or change the resources of running services, and GPU/native workers use their declared workload families rather than Next-specific options.
