"""Idempotent persistent model bootstrap for the Elevate GPU worker.

The large model/runtime lives on /models, not in the Docker image. On first boot
this script clones the pinned Wan runtime, creates a persistent venv, installs
its dependencies, and downloads the TI2V-5B checkpoint. Subsequent boots reuse
that volume and only verify the marker files.
"""
from __future__ import annotations

import json
import os
import subprocess
import sys
from pathlib import Path

from huggingface_hub import snapshot_download

ROOT = Path(os.getenv("MODEL_RUNTIME_ROOT", "/models/runtime"))
WAN_REPO = Path(os.getenv("WAN_REPO", str(ROOT / "wan2.2")))
WAN_VENV = Path(os.getenv("WAN_VENV", str(ROOT / "wan-venv")))
WAN_MODEL = Path(os.getenv("WAN_CHECKPOINT_DIR", "/models/Wan2.2-TI2V-5B"))
WAN_GIT_URL = os.getenv("WAN_GIT_URL", "https://github.com/Wan-Video/Wan2.2.git")
WAN_GIT_REF = os.getenv("WAN_GIT_REF", "main")
WAN_MODEL_ID = os.getenv("WAN_MODEL_ID", "Wan-AI/Wan2.2-TI2V-5B")
STATUS = Path(os.getenv("MODEL_BOOTSTRAP_STATUS_FILE", "/models/bootstrap-status.json"))


def status(state: str, detail: str = "") -> None:
    STATUS.parent.mkdir(parents=True, exist_ok=True)
    STATUS.write_text(json.dumps({"state": state, "detail": detail}) + "\n")
    print(f"[model-bootstrap] {state}: {detail}", flush=True)


def run(cmd: list[str], cwd: Path | None = None) -> None:
    subprocess.run(cmd, cwd=cwd, check=True)


def ensure_repo() -> None:
    if (WAN_REPO / "generate.py").exists():
        return
    WAN_REPO.parent.mkdir(parents=True, exist_ok=True)
    run(["git", "clone", "--depth", "1", "--branch", WAN_GIT_REF, WAN_GIT_URL, str(WAN_REPO)])


def ensure_venv() -> None:
    python = WAN_VENV / "bin" / "python"
    marker = WAN_VENV / ".elevate-ready"
    if python.exists() and marker.exists():
        return
    run([sys.executable, "-m", "venv", str(WAN_VENV)])
    pip = str(WAN_VENV / "bin" / "pip")
    run([pip, "install", "--upgrade", "pip", "setuptools", "wheel"])
    requirements = WAN_REPO / "requirements.txt"
    filtered = ROOT / "wan-requirements.txt"
    lines = [line for line in requirements.read_text().splitlines() if "flash_attn" not in line.lower()]
    filtered.write_text("\n".join(lines) + "\n")
    run([pip, "install", "-r", str(filtered)])
    # Wan can operate without flash-attn; avoid compiling it on every environment.
    marker.write_text("ready\n")


def ensure_model() -> None:
    if WAN_MODEL.exists() and any(WAN_MODEL.iterdir()):
        return
    WAN_MODEL.mkdir(parents=True, exist_ok=True)
    snapshot_download(
        repo_id=WAN_MODEL_ID,
        local_dir=str(WAN_MODEL),
        token=os.getenv("HF_TOKEN") or None,
        resume_download=True,
    )


def main() -> None:
    if os.getenv("MODEL_BOOTSTRAP_ENABLED", "true").lower() != "true":
        status("disabled")
        return
    try:
        status("cloning-runtime")
        ensure_repo()
        status("installing-runtime")
        ensure_venv()
        status("downloading-model")
        ensure_model()
        status("ready", f"Wan runtime={WAN_REPO} model={WAN_MODEL}")
    except Exception as exc:
        status("failed", str(exc)[:1000])
        raise


if __name__ == "__main__":
    main()
