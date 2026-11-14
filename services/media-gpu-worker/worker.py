"""Elevate self-hosted GPU video inference service.

The GPU worker owns only inference and short-lived generated files. Durable
course storage remains in Admin so this service never needs Supabase or R2
credentials.
"""
from __future__ import annotations

import asyncio
import ipaddress
import json
import os
import shutil
import socket
import subprocess
import tempfile
import time
import uuid
from pathlib import Path
from urllib.parse import urlparse
from urllib.request import Request, urlopen

import torch
from fastapi import FastAPI, Header, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel, Field

app = FastAPI(title="Elevate GPU Media Worker", version="5.0.0")
OUTPUT_DIR = Path(os.getenv("GPU_OUTPUT_DIR", "/data/output"))
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
MAX_CONCURRENCY = max(1, int(os.getenv("GPU_MAX_CONCURRENCY", "1")))
ASSET_TTL_SECONDS = max(300, int(os.getenv("GPU_ASSET_TTL_SECONDS", "7200")))
MIN_WAN_VRAM_BYTES = int(float(os.getenv("WAN_MIN_VRAM_GB", "22")) * 1024**3)
WAN_FPS = max(1, int(os.getenv("WAN_FPS", "24")))
ALLOWED_OPERATIONS = {"textToVideo", "imageToVideo", "videoToVideo", "extend", "remix", "loop", "interpolate"}
_sem = asyncio.Semaphore(MAX_CONCURRENCY)


class GenerateRequest(BaseModel):
    prompt: str = Field(min_length=3, max_length=8000)
    provider: str = "wan"
    operation: str = "textToVideo"
    width: int = Field(default=1280, ge=256, le=1920)
    height: int = Field(default=704, ge=256, le=1080)
    duration_seconds: int = Field(default=5, ge=1, le=15)
    seed: int | None = None
    image_url: str | None = None
    source_video_url: str | None = None
    negative_prompt: str | None = None


def _authorize(value: str | None) -> None:
    secret = os.getenv("GPU_WORKER_SECRET")
    if not secret or value != f"Bearer {secret}":
        raise HTTPException(status_code=401, detail="Unauthorized")


def _bootstrap_state() -> dict:
    status_file = Path(os.getenv("MODEL_BOOTSTRAP_STATUS_FILE", "/models/bootstrap-status.json"))
    if not status_file.exists():
        return {"state": "pending"}
    try:
        return json.loads(status_file.read_text())
    except Exception:
        return {"state": "unknown"}


def _model_state() -> dict:
    ltx = Path(os.getenv("LTX_REPO", "/models/runtime/ltx-video"))
    wan = Path(os.getenv("WAN_REPO", "/models/runtime/wan2.2"))
    wan_ckpt = Path(os.getenv("WAN_CHECKPOINT_DIR", "/models/Wan2.2-TI2V-5B"))
    wan_python = Path(os.getenv("WAN_PYTHON", "/models/runtime/wan-venv/bin/python"))
    bootstrap = _bootstrap_state()
    cuda = torch.cuda.is_available()
    vram = torch.cuda.get_device_properties(0).total_memory if cuda else 0
    model_marker = wan_ckpt / ".elevate-model-ready"
    return {
        "cuda": cuda,
        "gpu": torch.cuda.get_device_name(0) if cuda else None,
        "vramBytes": vram,
        "ltxInstalled": (ltx / "inference.py").exists(),
        "wanInstalled": (wan / "generate.py").exists() and wan_python.exists(),
        "wanModelReady": bool(wan_ckpt.exists() and model_marker.exists() and bootstrap.get("state") == "ready"),
        "wanVramReady": bool(vram >= MIN_WAN_VRAM_BYTES),
        "ffmpeg": shutil.which("ffmpeg") is not None,
        "bootstrap": bootstrap,
        "operations": sorted(ALLOWED_OPERATIONS),
    }


def _provider_ready(state: dict, provider: str) -> bool:
    if provider == "wan":
        model_ready = state["wanInstalled"] and state["wanModelReady"] and state["wanVramReady"]
    elif provider == "ltx":
        model_ready = state["ltxInstalled"]
    else:
        return False
    return bool(state["cuda"] and state["ffmpeg"] and model_ready)


def _assert_public_http_url(value: str) -> None:
    parsed = urlparse(value)
    if parsed.scheme not in {"http", "https"} or not parsed.hostname:
        raise ValueError("conditioning media must use http(s)")
    for info in socket.getaddrinfo(parsed.hostname, parsed.port or (443 if parsed.scheme == "https" else 80)):
        ip = ipaddress.ip_address(info[4][0])
        if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved or ip.is_multicast:
            raise ValueError("conditioning media host is not public")


def _download_media(url: str | None, work: Path, kind: str) -> str | None:
    if not url:
        return None
    _assert_public_http_url(url)
    target = work / f"conditioning-{kind}"
    req = Request(url, headers={"User-Agent": "ElevateGPUWorker/5.0"})
    with urlopen(req, timeout=60) as response, target.open("wb") as out:
        content_type = response.headers.get("content-type", "").lower()
        expected = "image/" if kind == "image" else "video/"
        if not content_type.startswith(expected):
            raise ValueError(f"conditioning URL did not return {kind}")
        length = int(response.headers.get("content-length") or "0")
        max_bytes = 50 * 1024 * 1024 if kind == "image" else 250 * 1024 * 1024
        if length and length > max_bytes:
            raise ValueError(f"conditioning {kind} exceeds size limit")
        shutil.copyfileobj(response, out)
    if target.stat().st_size > max_bytes:
        target.unlink(missing_ok=True)
        raise ValueError(f"conditioning {kind} exceeds size limit")
    return str(target)


def _extract_video_frame(video: str, work: Path, operation: str) -> str:
    target = work / "video-reference.jpg"
    if operation == "extend":
        cmd = ["ffmpeg", "-y", "-sseof", "-0.15", "-i", video, "-frames:v", "1", "-q:v", "2", str(target)]
    else:
        cmd = ["ffmpeg", "-y", "-ss", "0", "-i", video, "-frames:v", "1", "-q:v", "2", str(target)]
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=60)
    if not target.exists() or target.stat().st_size == 0:
        raise RuntimeError("unable to extract video conditioning frame")
    return str(target)


def _operation_prompt(req: GenerateRequest) -> str:
    prompt = req.prompt.strip()
    prefixes = {
        "videoToVideo": "Transform the supplied video reference while preserving motion continuity and composition.",
        "extend": "Continue naturally from the final frame of the supplied video with seamless temporal continuity.",
        "remix": "Remix the supplied video reference into a new cinematic interpretation while preserving subject identity.",
        "loop": "Create a seamless perfect loop where the ending naturally returns to the opening composition and motion.",
        "interpolate": "Create a smooth cinematic transition from the supplied visual reference toward the requested scene.",
        "imageToVideo": "Animate the supplied reference image while preserving subject identity and visual details.",
        "textToVideo": "",
    }
    negative = f" Avoid: {req.negative_prompt}." if req.negative_prompt else ""
    return f"{prefixes.get(req.operation, '')} {prompt}.{negative}".strip()


def _run_ltx(req: GenerateRequest, output: Path, image: str | None) -> None:
    repo = Path(os.getenv("LTX_REPO", "/models/runtime/ltx-video"))
    python = os.getenv("LTX_PYTHON", "python3")
    config = os.getenv("LTX_PIPELINE_CONFIG", "configs/ltxv-13b-0.9.8-distilled.yaml")
    fps = int(os.getenv("LTX_FPS", "24"))
    frames = ((max(9, req.duration_seconds * fps) - 1) // 8) * 8 + 1
    cmd = [python, str(repo / "inference.py"), "--prompt", _operation_prompt(req), "--height", str(req.height), "--width", str(req.width), "--num_frames", str(frames), "--pipeline_config", config, "--output_path", str(output)]
    if req.seed is not None:
        cmd += ["--seed", str(req.seed)]
    if image:
        cmd += ["--conditioning_media_paths", image, "--conditioning_start_frames", "0"]
    subprocess.run(
        cmd,
        cwd=repo,
        check=True,
        timeout=int(os.getenv("GPU_JOB_TIMEOUT_SECONDS", "1800")),
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
    )


def _wan_frame_count(duration_seconds: int) -> int:
    target = max(5, int(round(duration_seconds * WAN_FPS)))
    n = max(1, int(round((target - 1) / 4)))
    return 4 * n + 1


def _run_wan(req: GenerateRequest, output: Path, image: str | None) -> None:
    repo = Path(os.getenv("WAN_REPO", "/models/runtime/wan2.2"))
    python = os.getenv("WAN_PYTHON", "/models/runtime/wan-venv/bin/python")
    ckpt = os.getenv("WAN_CHECKPOINT_DIR", "/models/Wan2.2-TI2V-5B")
    size = "1280*704" if req.width >= req.height else "704*1280"
    cmd = [python, str(repo / "generate.py"), "--task", "ti2v-5B", "--size", size, "--frame_num", str(_wan_frame_count(req.duration_seconds)), "--ckpt_dir", ckpt, "--prompt", _operation_prompt(req), "--save_file", str(output), "--offload_model", "True", "--convert_model_dtype", "--t5_cpu"]
    if req.seed is not None:
        cmd += ["--base_seed", str(req.seed)]
    if image:
        cmd += ["--image", image]
    subprocess.run(
        cmd,
        cwd=repo,
        check=True,
        timeout=int(os.getenv("GPU_JOB_TIMEOUT_SECONDS", "1800")),
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
    )


def _asset_path(job_id: str) -> Path:
    try:
        uuid.UUID(job_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail="Asset not found") from exc
    return OUTPUT_DIR / f"{job_id}.mp4"


def _cleanup_expired_assets() -> None:
    cutoff = time.time() - ASSET_TTL_SECONDS
    for candidate in OUTPUT_DIR.glob("*.mp4"):
        try:
            if candidate.stat().st_mtime < cutoff:
                candidate.unlink(missing_ok=True)
        except OSError:
            continue


@app.get("/health")
def health():
    return {"ok": True, "service": "elevate-media-gpu-worker", "version": "5.0.0"}


@app.get("/health/ready")
def health_ready():
    state = _model_state()
    provider = os.getenv("GPU_VIDEO_PROVIDER", "wan").lower()
    is_ready = _provider_ready(state, provider)
    return JSONResponse(status_code=200 if is_ready else 503, content={"ready": is_ready, "service": "elevate-media-gpu-worker", "provider": provider, "bootstrapState": state.get("bootstrap", {}).get("state", "unknown"), "operations": sorted(ALLOWED_OPERATIONS)}, headers={"Cache-Control": "no-store"})


@app.get("/ready")
def ready(authorization: str | None = Header(default=None)):
    _authorize(authorization)
    state = _model_state()
    provider = os.getenv("GPU_VIDEO_PROVIDER", "wan").lower()
    return {"ready": _provider_ready(state, provider), "provider": provider, **state}


@app.post("/v1/video/generate")
async def generate(req: GenerateRequest, authorization: str | None = Header(default=None)):
    _authorize(authorization)
    provider = req.provider.lower()
    if provider not in {"ltx", "wan"}:
        raise HTTPException(status_code=400, detail="provider must be ltx or wan")
    if req.operation not in ALLOWED_OPERATIONS:
        raise HTTPException(status_code=400, detail="unsupported video operation")
    if req.operation == "imageToVideo" and not req.image_url:
        raise HTTPException(status_code=400, detail="imageToVideo requires image_url")
    if req.operation in {"videoToVideo", "extend", "remix"} and not req.source_video_url:
        raise HTTPException(status_code=400, detail=f"{req.operation} requires source_video_url")

    state = _model_state()
    if not _provider_ready(state, provider):
        raise HTTPException(status_code=503, detail=f"{provider} runtime/model/GPU is not ready")

    _cleanup_expired_assets()
    job_id = str(uuid.uuid4())
    output = OUTPUT_DIR / f"{job_id}.mp4"
    try:
        with tempfile.TemporaryDirectory(prefix=f"elevate-gpu-{job_id}-") as temp:
            work = Path(temp)
            image = await asyncio.to_thread(_download_media, req.image_url, work, "image")
            source_video = await asyncio.to_thread(_download_media, req.source_video_url, work, "video")
            if source_video and req.operation in {"videoToVideo", "extend", "remix", "interpolate"}:
                image = await asyncio.to_thread(_extract_video_frame, source_video, work, req.operation)
            async with _sem:
                runner = _run_ltx if provider == "ltx" else _run_wan
                await asyncio.to_thread(runner, req, output, image)
        if not output.exists() or output.stat().st_size == 0:
            raise RuntimeError("Generator produced no video")
    except subprocess.TimeoutExpired as exc:
        output.unlink(missing_ok=True)
        raise HTTPException(status_code=504, detail="GPU generation timed out") from exc
    except subprocess.CalledProcessError as exc:
        output.unlink(missing_ok=True)
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        diagnostic = (exc.stdout or str(exc))[-2000:].replace("\\n", " ").replace("\\r", " ")
        raise HTTPException(status_code=502, detail=f"{provider} inference failed: {diagnostic}") from exc
    except Exception as exc:
        output.unlink(missing_ok=True)
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        raise HTTPException(status_code=502, detail=str(exc)[:500]) from exc

    return {"ok": True, "jobId": job_id, "provider": provider, "operation": req.operation, "assetPath": f"/v1/video/{job_id}", "bytes": output.stat().st_size, "durationSeconds": req.duration_seconds}


@app.get("/v1/video/{job_id}")
def get_asset(job_id: str, authorization: str | None = Header(default=None)):
    _authorize(authorization)
    path = _asset_path(job_id)
    if not path.exists() or path.stat().st_size == 0:
        raise HTTPException(status_code=404, detail="Asset not found")
    return FileResponse(path, media_type="video/mp4", filename=f"{job_id}.mp4")


@app.delete("/v1/video/{job_id}")
def delete_asset(job_id: str, authorization: str | None = Header(default=None)):
    _authorize(authorization)
    path = _asset_path(job_id)
    path.unlink(missing_ok=True)
    return {"ok": True}
