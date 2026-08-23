# Elevate self-hosted LLM inference worker (vLLM, OpenAI-compatible API).
#
# Model weights persist on the mounted /models volume so restarts do not
# re-download from Hugging Face.
FROM vllm/vllm-openai:v0.10.1.1

ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONUNBUFFERED=1 \
    HF_HOME=/models/huggingface \
    VLLM_LOGGING_LEVEL=INFO

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=600s --retries=3 \
  CMD curl -fsS http://127.0.0.1:8080/health || exit 1

COPY services/llm-gpu-worker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
