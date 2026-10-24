import os
import subprocess
import tempfile
import unittest
from pathlib import Path

class StoreAdmissionTest(unittest.TestCase):
 def test_capacity_rejection_has_no_candidate_or_update(self):
  workflow=(Path(__file__).resolve().parents[2]/'.github/workflows/deploy-google-store-runtime.yml').read_text()
  section=workflow.split('      - name: Deploy Store with HTTP probes and idle scale-to-zero')[1].split('      - name: Collect exact failed Store revision logs')[0]
  script='\n'.join(line[10:] if line.startswith('          ') else line for line in section.split('        run: |')[1].splitlines())
  with tempfile.TemporaryDirectory() as directory:
   d=Path(directory);output=d/'outputs';calls=d/'calls';output.write_text('')
   for name,body in {'node':'#!/bin/sh\ncase "$*" in *preflight-web-rollout*) exit 23;; esac\nexit 0\n','gcloud':'#!/bin/sh\nprintf "%s\\n" "$*" >> "$CALLS"\nprintf "sha256:%064d\\n" 0\n'}.items():
    target=d/name;target.write_text(body);target.chmod(0o755)
   env={**os.environ,'PATH':str(d)+':'+os.environ['PATH'],'GITHUB_OUTPUT':str(output),'CALLS':str(calls),'GITHUB_SHA':'a'*40,'GITHUB_RUN_ID':'1','GITHUB_RUN_ATTEMPT':'1'}
   result=subprocess.run(['bash','-c',script],env=env,capture_output=True,text=True)
   self.assertEqual(result.returncode,23,result.stderr)
   self.assertEqual(output.read_text(),'','rejected preflight must not announce an undeployed revision')
   self.assertNotIn('run services update',calls.read_text())
if __name__=='__main__':unittest.main()
