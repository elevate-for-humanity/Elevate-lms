#!/bin/bash
set -euo pipefail
LLM_WORKER_SECRET="${LLM_WORKER_SECRET:-}"
if [[ ${#LLM_WORKER_SECRET} -lt 24 || ${#LLM_WORKER_SECRET} -gt 256 || "$LLM_WORKER_SECRET" =~ [[:space:]] ]]; then
  echo 'MODEL_AUTHENTICATION_CONFIGURATION_REQUIRED' >&2; exit 1
fi
memory_limit=''
if [[ -r /sys/fs/cgroup/memory.max ]]; then memory_limit="$(cat /sys/fs/cgroup/memory.max)";
elif [[ -r /sys/fs/cgroup/memory/memory.limit_in_bytes ]]; then memory_limit="$(cat /sys/fs/cgroup/memory/memory.limit_in_bytes)"; fi
if [[ ! "$memory_limit" =~ ^[0-9]+$ ]] || (( memory_limit != 8589934592 )); then
  echo 'MODEL_BOUNDED_EIGHT_GIB_MEMORY_REQUIRED' >&2; exit 1
fi
cd /models/elevate
sha256sum --check --status model.sha256 || { echo 'MODEL_CHECKSUM_FAILED' >&2; exit 1; }
umask 077
printf '%s\n' "$LLM_WORKER_SECRET" > /tmp/model-api-key
unset LLM_WORKER_SECRET
exec /opt/llama/llama-server --model /models/elevate/model-q4_k_m.gguf \
  --alias elevate-local --host 0.0.0.0 --port "${PORT:-8080}" \
  --api-key-file /tmp/model-api-key --ctx-size 8192 --parallel 1 \
  --threads 4 --threads-batch 4 --batch-size 256 --ubatch-size 128 \
  --n-gpu-layers 0 --jinja --no-webui --no-slots
