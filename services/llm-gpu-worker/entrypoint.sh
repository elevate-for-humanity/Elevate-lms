#!/bin/bash
# Elevate LLM worker entrypoint.
#
# Starts the vLLM OpenAI-compatible server. The model id is configurable via
# LLM_MODEL; defaults to a Qwen2.5 7B instruct model that fits comfortably on
# a 24GB L4 GPU. Bearer auth is enforced by vLLM via --api-key.
set -euo pipefail

LLM_MODEL="${LLM_MODEL:-Qwen/Qwen2.5-7B-Instruct}"
PORT="${PORT:-8080}"

if [[ -z "${LLM_WORKER_SECRET:-}" ]]; then
  echo "[llm-worker] FATAL: LLM_WORKER_SECRET is required" >&2
  exit 1
fi

exec python3 -m vllm.entrypoints.openai.api_server \
  --model "${LLM_MODEL}" \
  --served-model-name elevate-local \
  --api-key "${LLM_WORKER_SECRET}" \
  --host 0.0.0.0 \
  --port "${PORT}" \
  --gpu-memory-utilization "${GPU_MEMORY_UTILIZATION:-0.90}" \
  --max-model-len "${MAX_MODEL_LEN:-8192}" \
  --download-dir "${HF_HOME:-/models/huggingface}" \
  ${VLLM_EXTRA_ARGS:-}
