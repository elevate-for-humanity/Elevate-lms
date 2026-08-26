FROM nvidia/cuda:12.2.2-cudnn8-runtime-ubuntu22.04

ENV DEBIAN_FRONTEND=noninteractive PYTHONUNBUFFERED=1
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 python3-pip python3-venv git ffmpeg ca-certificates curl && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /srv/worker
COPY services/media-gpu-worker/requirements.txt ./requirements.txt
# Install CUDA 12.1 wheels without their bundled NVIDIA dependency packages;
# the CUDA/cuDNN runtime is already supplied by the base image. This prevents a
# duplicate CUDA stack from exhausting Northflank's 32 GB project allowance.
RUN python3 -m pip install --no-cache-dir --no-deps \
      --index-url https://download.pytorch.org/whl/cu121 \
      torch==2.4.1+cu121 torchvision==0.19.1+cu121 torchaudio==2.4.1+cu121 && \
    grep -Ev '^(torch|torchvision|torchaudio)([<>=]|$)' requirements.txt > runtime-requirements.txt && \
    python3 -m pip install --no-cache-dir \
      nvidia-cublas-cu12==12.1.3.1 \
      nvidia-cuda-cupti-cu12==12.1.105 \
      nvidia-cudnn-cu12==9.1.0.70 \
      filelock typing-extensions sympy networkx jinja2 fsspec \
      -r runtime-requirements.txt && \
    python3 -c "import torch; assert torch.__version__.startswith('2.4.1'); print(torch.__version__)"
COPY services/media-gpu-worker/worker.py ./worker.py
COPY services/media-gpu-worker/bootstrap_models.py ./bootstrap_models.py

# Model repositories, virtualenv and weights persist on the mounted /models volume.
ENV MODEL_RUNTIME_ROOT=/models/runtime \
    WAN_REPO=/models/runtime/wan2.2 \
    WAN_VENV=/models/runtime/wan-venv \
    WAN_PYTHON=/models/runtime/wan-venv/bin/python \
    WAN_CHECKPOINT_DIR=/models/Wan2.2-TI2V-5B \
    LTX_REPO=/models/runtime/ltx-video \
    GPU_OUTPUT_DIR=/data/output \
    HF_HOME=/models/huggingface \
    MODEL_BOOTSTRAP_ENABLED=true
RUN mkdir -p /data/output /models/runtime /models/huggingface

EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD python3 -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8080/health', timeout=3)"

# Start HTTP immediately so liveness is observable while first-boot model sync runs.
# /ready stays false until CUDA, runtime and model weights are all verified.
CMD ["bash", "-lc", "python3 bootstrap_models.py >/tmp/model-bootstrap.log 2>&1 & exec python3 -m uvicorn worker:app --host 0.0.0.0 --port 8080"]
