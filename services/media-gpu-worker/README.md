# Elevate GPU Media Worker

Dedicated CUDA inference service for generative lesson scenes. It is intentionally isolated from Admin, LMS, and Marketing.

## API

- `GET /health` — worker/model readiness.
- `POST /v1/video/generate` — bearer-authenticated text/image-to-video generation.

Required environment:

- `GPU_WORKER_SECRET`
- `GPU_MAX_CONCURRENCY` (default `1`)
- `GPU_JOB_TIMEOUT_SECONDS` (default `1800`)

LTX configuration:

- `LTX_REPO=/opt/ltx-video`
- `LTX_PIPELINE_CONFIG`
- `LTX_FPS`

Wan configuration:

- `WAN_REPO=/opt/wan2.2`
- `WAN_CHECKPOINT_DIR=/models/Wan2.2-TI2V-5B`

The deployment must provide NVIDIA/CUDA GPU capacity and mount/download model weights outside Git. LTX local generation should be provisioned with at least 16 GB VRAM; larger models/settings require more. Wan TI2V-5B is the preferred initial Wan profile for 720p T2V/I2V.

The worker returns an output path to the orchestrator. Production integration should copy the generated MP4 to the platform's durable media storage and persist provider/model/provenance in the media job record.

Do not run this container inside the Admin or LMS service. Deploy it as an isolated GPU service and connect it through the Media Director/provider adapter.
