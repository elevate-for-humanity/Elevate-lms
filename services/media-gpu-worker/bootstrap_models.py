"""Idempotent persistent model bootstrap for the Elevate GPU worker.

The large model/runtime lives on /models, not in the Docker image. On first boot
this script checks out a pinned Wan revision, creates a persistent venv that
reuses the container CUDA/PyTorch stack, installs the remaining Wan runtime
requirements, and downloads TI2V-5B. Subsequent boots reuse the persistent
volume and verify the pinned revision before reporting readiness.
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
WAN_GIT_REF = os.getenv("WAN_GIT_REF", "42bf4cfaa384bc21833865abc2f9e6c0e67233dc")
WAN_MODEL_ID = os.getenv("WAN_MODEL_ID", "Wan-AI/Wan2.2-TI2V-5B")
STATUS = Path(os.getenv("MODEL_BOOTSTRAP_STATUS_FILE", "/models/bootstrap-status.json"))


def status(state: str, detail: str = "") -> None:
    STATUS.parent.mkdir(parents=True, exist_ok=True)
    STATUS.write_text(json.dumps({"state": state, "detail": detail}) + "\n")
    print(f"[model-bootstrap] {state}: {detail}", flush=True)


def run(cmd: list[str], cwd: Path | None = None, capture: bool = False) -> str:
    result = subprocess.run(
        cmd,
        cwd=cwd,
        check=True,
        text=True,
        stdout=subprocess.PIPE if capture else None,
        stderr=subprocess.STDOUT if capture else None,
    )
    return (result.stdout or "").strip()


def ensure_repo() -> None:
    WAN_REPO.parent.mkdir(parents=True, exist_ok=True)
    if not (WAN_REPO / ".git").exists():
        if WAN_REPO.exists():
            import shutil
            shutil.rmtree(WAN_REPO)
        run(["git", "clone", "--filter=blob:none", "--no-checkout", WAN_GIT_URL, str(WAN_REPO)])

    current = ""
    if (WAN_REPO / ".git" / "HEAD").exists():
        try:
            current = run(["git", "rev-parse", "HEAD"], cwd=WAN_REPO, capture=True)
        except subprocess.CalledProcessError:
            current = ""
    if current != WAN_GIT_REF:
        run(["git", "fetch", "--depth", "1", "origin", WAN_GIT_REF], cwd=WAN_REPO)

    # A --no-checkout clone can already report the pinned HEAD while leaving
    # the persistent worktree empty. Always materialize the pinned tree.
    run(["git", "reset", "--hard", WAN_GIT_REF], cwd=WAN_REPO)
    current = run(["git", "rev-parse", "HEAD"], cwd=WAN_REPO, capture=True)
    if current != WAN_GIT_REF:
        raise RuntimeError(f"Wan revision mismatch: expected {WAN_GIT_REF}, got {current}")
    if not (WAN_REPO / "generate.py").is_file():
        raise RuntimeError("Pinned Wan checkout is missing generate.py after worktree reset")


def ensure_venv() -> None:
    python = WAN_VENV / "bin" / "python"
    marker = WAN_VENV / ".elevate-ready"
    marker_value = f"{WAN_GIT_REF}\n"
    if python.exists() and marker.exists() and marker.read_text() == marker_value:
        return

    if WAN_VENV.exists():
        import shutil
        shutil.rmtree(WAN_VENV)
    run([sys.executable, "-m", "venv", "--system-site-packages", str(WAN_VENV)])
    pip = str(WAN_VENV / "bin" / "pip")
    run([pip, "install", "--upgrade", "pip", "setuptools", "wheel"])

    requirements = WAN_REPO / "requirements.txt"
    filtered = ROOT / "wan-requirements.txt"
    excluded = ("flash_attn", "torch>", "torch=", "torchvision", "torchaudio")
    lines = [
        line
        for line in requirements.read_text().splitlines()
        if line.strip() and not any(token in line.lower().replace(" ", "") for token in excluded)
    ]
    filtered.write_text("\n".join(lines) + "\n")
    run([pip, "install", "-r", str(filtered)])
    marker.write_text(marker_value)


def ensure_model() -> None:
    marker = WAN_MODEL / ".elevate-model-ready"
    if WAN_MODEL.exists() and marker.exists() and any(WAN_MODEL.iterdir()):
        return
    WAN_MODEL.mkdir(parents=True, exist_ok=True)
    snapshot_download(
        repo_id=WAN_MODEL_ID,
        local_dir=str(WAN_MODEL),
        token=os.getenv("HF_TOKEN") or None,
    )
    marker.write_text(f"{WAN_MODEL_ID}\n")


def main() -> None:
    if os.getenv("MODEL_BOOTSTRAP_ENABLED", "true").lower() != "true":
        status("disabled")
        return
    try:
        status("cloning-runtime", WAN_GIT_REF)
        ensure_repo()
        status("installing-runtime", WAN_GIT_REF)
        ensure_venv()
        status("downloading-model", WAN_MODEL_ID)
        ensure_model()
        status("ready", f"Wan ref={WAN_GIT_REF} model={WAN_MODEL_ID}")
    except Exception as exc:
        status("failed", str(exc)[:1000])
        raise


if __name__ == "__main__":
    main()
