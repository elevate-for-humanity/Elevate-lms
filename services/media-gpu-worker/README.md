# Elevate GPU Media Worker

Dedicated CUDA inference service for self-hosted generative lesson scenes. It is intentionally isolated from Admin, LMS, and Marketing so GPU/model failures cannot take down the learner or administrative applications.

## Production API

- `GET /health` — unauthenticated process/liveness probe.
- `GET /ready` — bearer-authenticated CUDA, VRAM, runtime, FFmpeg, and model-readiness probe.
- `POST /v1/video/generate` — bearer-authenticated text/image-to-video generation.
- `GET /v1/video/{jobId}` — authenticated temporary MP4 download.
- `DELETE /v1/video/{jobId}` — authenticated temporary asset cleanup.

The GPU worker owns inference only. Admin downloads each generated MP4, persists it through the canonical course-media storage layer, writes the durable URL to `video_jobs`/lesson experience, and then deletes the worker's temporary asset.

## Runtime

Required:

- `GPU_WORKER_SECRET`
- NVIDIA CUDA-capable GPU
- persistent `/models` volume

Production defaults:

- `GPU_VIDEO_PROVIDER=wan`
- `GPU_MAX_CONCURRENCY=1`
- `GPU_JOB_TIMEOUT_SECONDS=1800`
- `WAN_REPO=/models/runtime/wan2.2`
- `WAN_VENV=/models/runtime/wan-venv`
- `WAN_PYTHON=/models/runtime/wan-venv/bin/python`
- `WAN_CHECKPOINT_DIR=/models/Wan2.2-TI2V-5B`
- `HF_HOME=/models/huggingface`

`bootstrap_models.py` idempotently installs the pinned Wan runtime and downloads the TI2V-5B weights onto the persistent model volume. `/ready` remains false until CUDA, minimum VRAM, FFmpeg, the pinned runtime, and the model marker all pass.

## Northflank deployment

`scripts/northflank/provision-gpu-worker.ts` is the single canonical infrastructure controller. It selects/creates an L4-capable GPU project without moving the existing web services, provisions a persistent 150 GB model volume, configures the GPU worker, triggers an exact-SHA build, wires the restricted worker secret into Admin, waits for model readiness, and performs a real 5-second Wan 720p MP4 acceptance render.

`.github/workflows/gpu-worker.yml` runs this contract from `main`. A deployment is not considered green merely because the container starts; the `GPU Media Acceptance` status passes only after the real generated MP4 is downloaded and validated.

## Failure behavior

The local GPU is the preferred cinematic microclip generator. If it is unavailable or a generation fails, the canonical Admin media processor falls back to the existing Remotion instructional-video pipeline. This prevents GPU availability from becoming a critical dependency for course delivery.
