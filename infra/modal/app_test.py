"""Local SDK configuration validation. No workspace or billed compute used."""
import os
import json
import runpy
import signal
import subprocess
import unittest
from unittest.mock import patch


class ModalConfigurationTest(unittest.TestCase):
    def load_app(self):
        with patch.dict(os.environ, {"MODAL_COURSE_IMAGE": "registry.example/worker@sha256:" + "a" * 64}):
            return runpy.run_path("infra/modal/app.py")
    def test_mutable_or_missing_image_is_rejected(self):
        for image in ("", "registry.example/worker:latest"):
            with self.subTest(image=image), patch.dict(os.environ, {"MODAL_COURSE_IMAGE": image}):
                with self.assertRaisesRegex(ValueError, "IMMUTABLE_DIGEST_REQUIRED"):
                    runpy.run_path("infra/modal/app.py")

    def test_pinned_sdk_accepts_worker_configuration_without_deploying(self):
        module = self.load_app()
        self.assertEqual(module["app"].name, "elevate-external-compute")
        self.assertIn("course_render", module)
        self.assertIn("broker", module)

    def test_only_terminal_process_group_can_settle(self):
        module = self.load_app()
        attempt = "11111111-1111-4111-8111-111111111111"
        class Process:
            pid = 12345
            def __init__(self, args, **kwargs):
                with open(kwargs["env"]["EXTERNAL_COURSE_RESULT_PATH"], "w", encoding="utf-8") as stream:
                    json.dump({"attemptId": attempt, "workerId": "worker", "usage": {}}, stream)
            def wait(self, **kwargs):
                return 0
        with patch("subprocess.Popen", Process), patch("os.killpg", side_effect=ProcessLookupError), patch("subprocess.run") as settle:
            result = module["course_render"].local(attempt)
            self.assertEqual(settle.call_count, 1)
            self.assertFalse(result["playbackAccepted"])

    def test_timeout_kills_process_group_without_settling(self):
        module = self.load_app()
        class Process:
            pid = 12345
            def __init__(self, *args, **kwargs):
                self.first = True
            def wait(self, **kwargs):
                if self.first:
                    self.first = False
                    raise subprocess.TimeoutExpired("node", 1740)
                return -9
        with patch("subprocess.Popen", Process), patch("os.killpg") as kill, patch("subprocess.run") as settle:
            with self.assertRaisesRegex(RuntimeError, "TIMEOUT_RECONCILIATION"):
                module["course_render"].local("11111111-1111-4111-8111-111111111111")
            kill.assert_called_once_with(12345, signal.SIGKILL)
            settle.assert_not_called()

    def test_surviving_renderer_child_prevents_settlement(self):
        module = self.load_app()
        class Process:
            pid = 12345
            def __init__(self, *args, **kwargs):
                pass
            def wait(self, **kwargs):
                return 0
        with patch("subprocess.Popen", Process), patch("os.killpg"), patch("subprocess.run") as settle:
            with self.assertRaisesRegex(RuntimeError, "PROCESS_GROUP_RECONCILIATION"):
                module["course_render"].local("11111111-1111-4111-8111-111111111111")
            settle.assert_not_called()


if __name__ == "__main__":
    unittest.main()
