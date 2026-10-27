# Elevate LLM GPU Worker

Self-hosted OpenAI-compatible LLM inference for the Elevate platform, running
on an explicitly provisioned GPU with vLLM. No deployment is implied by this source.

## Purpose

Gives Elevate a fully self-controlled inference path so Course Builder, Dev
Studio agents, and the AI router do not depend on any commercial provider.
Cloudflare Workers AI and Groq remain the free-first cloud fallbacks; this
service is the fully-owned path.

## Contract

- OpenAI-compatible endpoints under `/v1` (`/v1/chat/completions`, `/v1/models`,
  `/v1/embeddings`, `/v1/completions`)
- Bearer auth via `LLM_WORKER_SECRET` (shared with the platform through the
  canonical secret stores)
- Served model name is always `elevate-local` regardless of the underlying
  checkpoint, so callers never hard-code a specific model

## Configuration

| Variable | Default | Purpose |
|----------|---------|---------|
| `LLM_MODEL` | `Qwen/Qwen2.5-7B-Instruct` | Hugging Face model id to serve |
| `LLM_WORKER_SECRET` | (required) | Bearer token required on every request |
| `PORT` | `8080` | HTTP listen port |
| `GPU_MEMORY_UTILIZATION` | `0.90` | vLLM VRAM fraction |
| `MAX_MODEL_LEN` | `8192` | Maximum context length |
| `HF_HOME` | `/models/huggingface` | Weight cache (mounted volume) |
| `VLLM_EXTRA_ARGS` | empty | Extra vLLM server flags |

## Deployment

Use a reviewed immutable worker image containing this entrypoint. For the
Runpod pilot, expose only the authenticated model server through the HTTPS proxy;
do not enable Jupyter or an unauthenticated model endpoint. Configure the model
cache on the persistent volume and verify the model fits before sending traffic.

PARIS web configuration (server-side only):

- `ELEVATE_LLM_GPU_URL`: root HTTPS Runpod proxy URL, without `/v1`.
- `ELEVATE_LLM_GPU_SECRET`: same secret as `LLM_WORKER_SECRET`.
- `ELEVATE_LLM_GPU_GOOGLE_IAM=false`: the Runpod GPU uses application authentication.
- `PARIS_GPU_ENABLED=true` and `PARIS_INFERENCE_TIER=gpu`: select GPU only after acceptance.

The existing `ELEVATE_LLM_GOOGLE_IAM` setting remains authoritative for the Google
CPU connection. Do not disable CPU IAM to enable an external GPU. Authenticate
`/v1/models` and verify `elevate-local`, then test a streamed conversation before
activating web traffic. Redirects are rejected by both health and inference.

For the PBX turn adapter, separately configure `PARIS_PHONE_INFERENCE_PROVIDER=owned`,
`PARIS_PHONE_LLM_URL` (root HTTPS Runpod proxy) and `PARIS_PHONE_LLM_SECRET_REF`
(a Google Secret Manager version resource). The turn launcher resolves that
reference into `PARIS_PHONE_LLM_SECRET`; the ARI gateway never receives it.
This changes the conversational model only; Google speech recognition/synthesis
and the existing carrier, SIP, ARI and RTP transport remain in place. Keep secrets
in the existing protected runtime configuration. No browser may receive them.
Phone inference has an eight-second timeout, no retry or automatic model fallback.
The existing gateway owns call fallback and operator handoff.

Use a dedicated voice inference worker or measure contention before sharing a
GPU with batch course rendering. Validate greeting, multi-turn speech, two-way
audio, operator 0, voicemail and model outage behavior on an authorized test call
before routing public calls. Retain the current configuration for rollback.

These changes do not create a Runpod resource, activate public phone routing,
implement the Runpod course-job dispatcher, or establish live acceptance.
