FROM nvidia/cuda:12.2.2-cudnn8-runtime-ubuntu22.04

ENV DEBIAN_FRONTEND=noninteractive PYTHONUNBUFFERED=1
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 python3-pip python3-venv git ffmpeg ca-certificates && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /srv/worker
COPY services/media-gpu-worker/requirements.txt ./requirements.txt
RUN python3 -m pip install --no-cache-dir -r requirements.txt
COPY services/media-gpu-worker/worker.py ./worker.py

# Model repositories/weights are mounted or baked by the GPU deployment image.
# Keeping them outside this base service avoids multi-GB model blobs in Git.
ENV LTX_REPO=/opt/ltx-video WAN_REPO=/opt/wan2.2 GPU_OUTPUT_DIR=/data/output
RUN mkdir -p /data/output /models

EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD python3 -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8080/health', timeout=3)"
CMD ["python3", "-m", "uvicorn", "worker:app", "--host", "0.0.0.0", "--port", "8080"]
