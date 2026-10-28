import os
import subprocess
import tempfile
import unittest
from pathlib import Path


class StoreAdmissionTest(unittest.TestCase):
    def run_admission(self, expected_digest):
        workflow = (Path(__file__).resolve().parents[2] / '.github/workflows/deploy-google-store-runtime.yml').read_text()
        section = workflow.split('      - name: Deploy Store with HTTP probes and idle scale-to-zero')[1].split('      - name: Collect exact failed Store revision logs')[0]
        script = '\n'.join(line[10:] if line.startswith('          ') else line for line in section.split('        run: |')[1].splitlines())
        with tempfile.TemporaryDirectory() as directory:
            folder = Path(directory)
            output, calls = folder / 'outputs', folder / 'calls'
            output.write_text('')
            stubs = {
                'node': '#!/bin/sh\nprintf "%s\\n" "$*" >> "$CALLS"\ncase "$*" in *preflight-web-rollout*) exit 23;; esac\nexit 0\n',
                'gcloud': '#!/bin/sh\nprintf "%s\\n" "$*" >> "$CALLS"\nprintf "sha256:%064d\\n" 0\n',
            }
            for name, body in stubs.items():
                target = folder / name
                target.write_text(body)
                target.chmod(0o755)
            env = {
                **os.environ,
                'PATH': str(folder) + ':' + os.environ['PATH'],
                'GITHUB_OUTPUT': str(output), 'CALLS': str(calls),
                'GITHUB_SHA': 'a' * 40, 'GITHUB_RUN_ID': '1', 'GITHUB_RUN_ATTEMPT': '1',
                'IMAGE_DIGEST': expected_digest,
            }
            result = subprocess.run(['bash', '-c', script], env=env, capture_output=True, text=True)
            return result, output.read_text(), calls.read_text()

    def test_capacity_rejection_has_no_candidate_or_update(self):
        result, output, calls = self.run_admission('sha256:' + '0' * 64)
        self.assertEqual(result.returncode, 23, result.stderr)
        self.assertEqual(output, '', 'rejected preflight must not announce an undeployed revision')
        self.assertNotIn('run services update', calls)

    def test_registry_digest_mismatch_has_no_candidate_or_update(self):
        result, output, calls = self.run_admission('sha256:' + '1' * 64)
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(output, '')
        self.assertNotIn('preflight-web-rollout', calls)
        self.assertNotIn('run services update', calls)


if __name__ == '__main__':
    unittest.main()
