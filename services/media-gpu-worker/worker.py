"""Elevate self-hosted GPU video inference service."""
from __future__ import annotations

import asyncio
import os
import shutil
import subprocess
import tempfile
import uuid
from pathlib import Path
from urllib.request import Request, urlopen

import boto3
import torch
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel, Field

app = FastAPI(title="Elevate GPU Media Worker", version="2.0.0")
OUTPUT_DIR = Path(os.getenv("GPU_OUTPUT_DIR", "/tmp/elevate-gpu-output"))
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
MAX_CONCURRENCY = max(1, int(os.getenv("GPU_MAX_CONCURRENCY", "1")))
_sem = asyncio.Semaphore(MAX_CONCURRENCY)

class GenerateRequest(BaseModel):
    prompt: str = Field(min_length=3, max_length=8000)
    provider: str = "wan"
    width: int = Field(default=1280, ge=256, le=1920)
    height: int = Field(default=704, ge=256, le=1080)
    duration_seconds: int = Field(default=5, ge=1, le=15)
    seed: int | None = None
    image_url: str | None = None

def _authorize(value: str | None) -> None:
    secret = os.getenv("GPU_WORKER_SECRET")
    if not secret or value != f"Bearer {secret}":
        raise HTTPException(status_code=401, detail="Unauthorized")

def _model_state() -> dict:
    ltx = Path(os.getenv("LTX_REPO", "/opt/ltx-video"))
    wan = Path(os.getenv("WAN_REPO", "/opt/wan2.2"))
    wan_ckpt = Path(os.getenv("WAN_CHECKPOINT_DIR", "/models/Wan2.2-TI2V-5B"))
    return {
        "cuda": torch.cuda.is_available(),
        "gpu": torch.cuda.get_device_name(0) if torch.cuda.is_available() else None,
        "vramBytes": torch.cuda.get_device_properties(0).total_memory if torch.cuda.is_available() else 0,
        "ltxInstalled": (ltx / "inference.py").exists(),
        "wanInstalled": (wan / "generate.py").exists(),
        "wanModelReady": wan_ckpt.exists() and any(wan_ckpt.iterdir()) if wan_ckpt.exists() else False,
        "ffmpeg": shutil.which("ffmpeg") is not None,
    }

def _download_image(url: str | None, work: Path) -> str | None:
    if not url: return None
    target = work / "conditioning-image"
    req = Request(url, headers={"User-Agent": "ElevateGPUWorker/2.0"})
    with urlopen(req, timeout=30) as response, target.open("wb") as out:
        shutil.copyfileobj(response, out)
    return str(target)

def _run_ltx(req: GenerateRequest, output: Path, image: str | None) -> None:
    repo = Path(os.getenv("LTX_REPO", "/opt/ltx-video"))
    config = os.getenv("LTX_PIPELINE_CONFIG", "configs/ltxv-13b-0.9.8-distilled.yaml")
    fps = int(os.getenv("LTX_FPS", "24")); frames = ((max(9, req.duration_seconds * fps) - 1) // 8) * 8 + 1
    cmd = ["python", str(repo / "inference.py"), "--prompt", req.prompt, "--height", str(req.height), "--width", str(req.width), "--num_frames", str(frames), "--pipeline_config", config, "--output_path", str(output)]
    if req.seed is not None: cmd += ["--seed", str(req.seed)]
    if image: cmd += ["--conditioning_media_paths", image, "--conditioning_start_frames", "0"]
    subprocess.run(cmd, cwd=repo, check=True, timeout=int(os.getenv("GPU_JOB_TIMEOUT_SECONDS", "1800")))

def _run_wan(req: GenerateRequest, output: Path, image: str | None) -> None:
    repo = Path(os.getenv("WAN_REPO", "/opt/wan2.2")); ckpt = os.getenv("WAN_CHECKPOINT_DIR", "/models/Wan2.2-TI2V-5B")
    # Wan TI2V-5B officially supports 1280x704 / 704x1280 for 720p.
    landscape = req.width >= req.height; size = "1280*704" if landscape else "704*1280"
    cmd = ["python", str(repo / "generate.py"), "--task", "ti2v-5B", "--size", size, "--ckpt_dir", ckpt, "--prompt", req.prompt, "--save_file", str(output), "--offload_model", "True", "--convert_model_dtype", "--t5_cpu"]
    if req.seed is not None: cmd += ["--seed", str(req.seed)]
    if image: cmd += ["--image", image]
    subprocess.run(cmd, cwd=repo, check=True, timeout=int(os.getenv("GPU_JOB_TIMEOUT_SECONDS", "1800")))

def _upload(path: Path, job_id: str) -> str:
    endpoint = os.getenv("R2_ENDPOINT"); bucket = os.getenv("R2_BUCKET"); access = os.getenv("R2_ACCESS_KEY_ID"); secret = os.getenv("R2_SECRET_ACCESS_KEY"); public = os.getenv("R2_PUBLIC_BASE_URL", "").rstrip("/")
    if not all([endpoint, bucket, access, secret, public]):
        raise RuntimeError("Durable R2 storage is not configured")
    key = f"generated-scenes/{job_id}.mp4"
    client = boto3.client("s3", endpoint_url=endpoint, aws_access_key_id=access, aws_secret_access_key=secret, region_name="auto")
    client.upload_file(str(path), bucket, key, ExtraArgs={"ContentType": "video/mp4", "CacheControl": "public,max-age=31536000,immutable"})
    return f"{public}/{key}"

@app.get("/health")
def health(): return {"ok": True, **_model_state(), "maxConcurrency": MAX_CONCURRENCY}

@app.get("/ready")
def ready():
    state = _model_state(); provider = os.getenv("GPU_VIDEO_PROVIDER", "wan")
    model_ready = state["wanInstalled"] and state["wanModelReady"] if provider == "wan" else state["ltxInstalled"]
    return {"ready": bool(state["cuda"] and state["ffmpeg"] and model_ready), "provider": provider, **state}

@app.post("/v1/video/generate")
async def generate(req: GenerateRequest, authorization: str | None = Header(default=None)):
    _authorize(authorization); provider = req.provider.lower()
    if provider not in {"ltx", "wan"}: raise HTTPException(status_code=400, detail="provider must be ltx or wan")
    if not torch.cuda.is_available(): raise HTTPException(status_code=503, detail="CUDA GPU unavailable")
    job_id = str(uuid.uuid4())
    with tempfile.TemporaryDirectory(prefix=f"elevate-gpu-{job_id}-") as temp:
        work = Path(temp); output = work / "output.mp4"
        try:
            image = await asyncio.to_thread(_download_image, req.image_url, work)
            async with _sem:
                runner = _run_ltx if provider == "ltx" else _run_wan
                await asyncio.to_thread(runner, req, output, image)
            if not output.exists() or output.stat().st_size == 0: raise RuntimeError("Generator produced no video")
            video_url = await asyncio.to_thread(_upload, output, job_id)
        except subprocess.TimeoutExpired as exc: raise HTTPException(status_code=504, detail="GPU generation timed out") from exc
        except subprocess.CalledProcessError as exc:
            if torch.cuda.is_available(): torch.cuda.empty_cache()
            raise HTTPException(status_code=502, detail=f"{provider} inference failed") from exc
        except Exception as exc:
            if torch.cuda.is_available(): torch.cuda.empty_cache()
            raise HTTPException(status_code=502, detail=str(exc)[:500]) from exc
    return {"ok": True, "jobId": job_id, "provider": provider, "videoUrl": video_url, "durationSeconds": req.duration_seconds}
