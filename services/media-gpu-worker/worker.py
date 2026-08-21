"""Elevate self-hosted GPU video worker.

HTTP inference service used by the Media Director. The worker deliberately keeps
model execution outside Admin/LMS. LTX and Wan are invoked as local subprocesses
so their CUDA environments/model weights remain isolated from the web apps.
"""
from __future__ import annotations

import asyncio
import os
import shutil
import subprocess
import tempfile
import uuid
from pathlib import Path

from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel, Field

app = FastAPI(title="Elevate GPU Media Worker", version="1.0.0")

OUTPUT_DIR = Path(os.getenv("GPU_OUTPUT_DIR", "/tmp/elevate-gpu-output"))
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
MAX_CONCURRENCY = max(1, int(os.getenv("GPU_MAX_CONCURRENCY", "1")))
_sem = asyncio.Semaphore(MAX_CONCURRENCY)


class GenerateRequest(BaseModel):
    prompt: str = Field(min_length=3, max_length=8000)
    provider: str = "ltx"
    width: int = Field(default=1280, ge=256, le=1920)
    height: int = Field(default=720, ge=256, le=1080)
    duration_seconds: int = Field(default=5, ge=1, le=15)
    seed: int | None = None
    image_path: str | None = None


def _authorize(authorization: str | None) -> None:
    secret = os.getenv("GPU_WORKER_SECRET")
    if not secret or authorization != f"Bearer {secret}":
        raise HTTPException(status_code=401, detail="Unauthorized")


def _run_ltx(req: GenerateRequest, output: Path) -> None:
    repo = Path(os.getenv("LTX_REPO", "/opt/ltx-video"))
    config = os.getenv("LTX_PIPELINE_CONFIG", "configs/ltxv-13b-0.9.8-distilled.yaml")
    fps = int(os.getenv("LTX_FPS", "24"))
    frames = max(9, req.duration_seconds * fps)
    frames = ((frames - 1) // 8) * 8 + 1
    cmd = [
        "python", str(repo / "inference.py"), "--prompt", req.prompt,
        "--height", str(req.height), "--width", str(req.width),
        "--num_frames", str(frames), "--pipeline_config", config,
        "--output_path", str(output),
    ]
    if req.seed is not None:
        cmd += ["--seed", str(req.seed)]
    if req.image_path:
        cmd += ["--conditioning_media_paths", req.image_path, "--conditioning_start_frames", "0"]
    subprocess.run(cmd, cwd=repo, check=True, timeout=int(os.getenv("GPU_JOB_TIMEOUT_SECONDS", "1800")))


def _run_wan(req: GenerateRequest, output: Path) -> None:
    repo = Path(os.getenv("WAN_REPO", "/opt/wan2.2"))
    ckpt = os.getenv("WAN_CHECKPOINT_DIR", "/models/Wan2.2-TI2V-5B")
    size = f"{req.width}*{req.height}"
    cmd = [
        "python", str(repo / "generate.py"), "--task", "ti2v-5B",
        "--size", size, "--ckpt_dir", ckpt, "--prompt", req.prompt,
        "--save_file", str(output),
    ]
    if req.seed is not None:
        cmd += ["--seed", str(req.seed)]
    if req.image_path:
        cmd += ["--image", req.image_path]
    subprocess.run(cmd, cwd=repo, check=True, timeout=int(os.getenv("GPU_JOB_TIMEOUT_SECONDS", "1800")))


@app.get("/health")
def health():
    return {
        "ok": True,
        "cudaVisibleDevices": os.getenv("CUDA_VISIBLE_DEVICES", "auto"),
        "ltxInstalled": Path(os.getenv("LTX_REPO", "/opt/ltx-video")).exists(),
        "wanInstalled": Path(os.getenv("WAN_REPO", "/opt/wan2.2")).exists(),
        "ffmpeg": shutil.which("ffmpeg") is not None,
        "maxConcurrency": MAX_CONCURRENCY,
    }


@app.post("/v1/video/generate")
async def generate(req: GenerateRequest, authorization: str | None = Header(default=None)):
    _authorize(authorization)
    provider = req.provider.lower()
    if provider not in {"ltx", "wan"}:
        raise HTTPException(status_code=400, detail="provider must be ltx or wan")

    job_id = str(uuid.uuid4())
    output = OUTPUT_DIR / f"{job_id}.mp4"
    async with _sem:
        try:
            runner = _run_ltx if provider == "ltx" else _run_wan
            await asyncio.to_thread(runner, req, output)
        except subprocess.TimeoutExpired as exc:
            raise HTTPException(status_code=504, detail="GPU generation timed out") from exc
        except subprocess.CalledProcessError as exc:
            raise HTTPException(status_code=502, detail=f"{provider} inference failed") from exc

    if not output.exists() or output.stat().st_size == 0:
        raise HTTPException(status_code=502, detail="Generator produced no video")

    return {"ok": True, "jobId": job_id, "provider": provider, "outputPath": str(output)}
