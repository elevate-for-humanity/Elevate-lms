# Elevate LLM GPU Worker

Self-hosted OpenAI-compatible LLM inference for the Elevate platform, running
on a Northflank managed GPU with vLLM.

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

Provisioned by `scripts/northflank/provision-llm-worker.ts` into the
`elevate-media-gpu` project (an L4-24GB GPU fits 7B-class models at fp16 and
32B-class models at AWQ/GPTQ quantization). The provisioner wires the public
URL and shared secret into the `elevate-platform` project as:

- `ELEVATE_LLM_URL`
- `ELEVATE_LLM_SECRET`

The AI router (`lib/ai/providers/elevate.ts`) reads those variables (hydrated
from `platform_secrets`) and treats `elevate` as a first-class provider.
