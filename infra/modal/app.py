"""Opt-in external Course Builder, reusing the immutable approved Node worker.

Deploy only after workspace, registry access, secrets and budget authorization.
No deployment or paid invocation occurs by importing this module.
"""
import os
import json
import re
import signal
import subprocess
import tempfile
import time
import uuid

import modal

IMAGE = os.environ.get("MODAL_COURSE_IMAGE", "")
if not re.fullmatch(r"[a-z0-9./_-]+@sha256:[a-f0-9]{64}", IMAGE):
    raise ValueError("MODAL_COURSE_IMAGE_IMMUTABLE_DIGEST_REQUIRED")

app = modal.App("elevate-external-compute")
runtime = modal.Secret.from_name("elevate-course-runtime")
image = modal.Image.from_registry(
    IMAGE, secret=modal.Secret.from_name("elevate-worker-registry"), add_python="3.12"
)
# The selected immutable image must include this release's claim adapter and
# canonical renderer. The deployment runbook requires matching source evidence.


@app.function(image=image, secrets=[runtime], cpu=(2, 2), memory=(4096, 4096),
              ephemeral_disk=32768, timeout=1800, retries=0,
              max_containers=2, min_containers=0, buffer_containers=0,
              scaledown_window=2, cloud="aws", single_use_containers=True)
def course_render(attempt_id: str):
    attempt_id = str(uuid.UUID(attempt_id))
    env = {**os.environ, "EXTERNAL_COURSE_ATTEMPT_ID": attempt_id,
           "ULTIMATE_WORKER_ONCE": "true"}
    # One input per container; existing SQL leases and fences own the work.
    # No arbitrary commands or scripts are accepted from an HTTP request.
    with tempfile.TemporaryDirectory(prefix="elevate-external-") as directory:
        report = directory + "/result.json"
        env["EXTERNAL_COURSE_RESULT_PATH"] = report
        started = time.monotonic()
        process = subprocess.Popen(
            ["node", "--import=tsx", "/app/workers/external-course-worker.mjs"],
            cwd="/app", env=env, start_new_session=True,
        )
        try:
            returncode = process.wait(timeout=1740)
        except subprocess.TimeoutExpired:
            os.killpg(process.pid, signal.SIGKILL)
            process.wait()
            raise RuntimeError("EXTERNAL_TIMEOUT_RECONCILIATION_REQUIRED")
        # A returned Node promise is not proof its subprocesses stopped.
        try:
            os.killpg(process.pid, 0)
        except ProcessLookupError:
            pass
        else:
            os.killpg(process.pid, signal.SIGKILL)
            raise RuntimeError("RENDER_PROCESS_GROUP_RECONCILIATION_REQUIRED")
        if not os.path.isfile(report):
            raise RuntimeError("EXTERNAL_RECEIPT_RECONCILIATION_REQUIRED")
        with open(report, encoding="utf-8") as stream:
            receipt = json.load(stream)
        receipt["usage"]["wall_seconds"] = time.monotonic() - started
        with open(report, "w", encoding="utf-8") as stream:
            json.dump(receipt, stream)
        subprocess.run(
            ["node", "/app/workers/settle-external-course-worker.mjs"],
            cwd="/app", env=env, timeout=30, check=True,
        )
    if returncode != 0:
        raise RuntimeError("EXTERNAL_COURSE_TASK_FAILED_RECONCILE_RECEIPT")
    return {"attemptId": attempt_id, "taskExited": True,
            "playbackAccepted": False}


@app.function(image=modal.Image.debian_slim(python_version="3.12").pip_install("fastapi==0.115.12"),
              cpu=0.25, memory=256, timeout=30,
              min_containers=0, max_containers=1, scaledown_window=2)
@modal.fastapi_endpoint(method="POST", requires_proxy_auth=True)
def broker(body: dict):
    from fastapi import HTTPException
    action = body.get("action")
    if action == "health":
        return {"ready": True, "worker": "course_render", "maxContainers": 2,
                "minContainers": 0, "productionAccepted": False}
    if action == "submit":
        try:
            attempt_id = str(uuid.UUID(body.get("attemptId", "")))
        except (ValueError, TypeError, AttributeError):
            raise HTTPException(400, "VALID_ATTEMPT_REQUIRED")
        call = course_render.spawn(attempt_id)
        return {"executionId": call.object_id}
    execution_id = body.get("executionId", "")
    if not isinstance(execution_id, str) or not re.fullmatch(r"fc-[A-Za-z0-9]+", execution_id):
        raise HTTPException(400, "VALID_EXECUTION_REQUIRED")
    call = modal.FunctionCall.from_id(execution_id)
    if action == "cancel":
        call.cancel(terminate_containers=True)
        return {"cancelRequested": True, "terminalVerified": False}
    if action == "status":
        try:
            return {"status": "exited", "result": call.get(timeout=0)}
        except TimeoutError:
            return {"status": "pending"}
        except Exception:
            # Preserve ambiguous outcomes for operator reconciliation. Do not
            # refund or reassign a database job based on a generic SDK error.
            return {"status": "unverified", "reconciliationRequired": True}
    raise HTTPException(400, "UNSUPPORTED_ACTION")
