#!/usr/bin/env python3
"""Read-only source drift evidence; redact literals before emitting differences."""
import difflib
import hashlib
import json
from pathlib import Path
import re
import sys

revision = sys.argv[1]
if not re.fullmatch('[a-f0-9]{40}', revision):
    raise SystemExit('invalid_revision')
for relative, current in [
    ('provisioner/server.mjs', '/opt/elevate-pbx/provisioner/server.mjs'),
    ('paris/turn-adapter.mjs', '/opt/elevate-pbx/paris/turn-adapter.mjs'),
    ('paris/launch.mjs', '/opt/elevate-pbx/paris/launch.mjs'),
]:
    baseline = Path('/tmp/elevate-source-review-' + revision + '-' + relative.replace('/', '-')).read_text()
    actual = Path(current).read_text()
    def sanitize(line):
        # Source can contain local-only constants. Emit their fingerprints, never
        # their literal values; variable names and control flow remain reviewable.
        def literal(match):
            value = match.group(2)
            if len(value) >= 24 or re.search(r'password|token|secret|api.?key', line, re.I):
                return match.group(1) + '[literal-sha256:' + hashlib.sha256(value.encode()).hexdigest()[:16] + ']' + match.group(1)
            return match.group(0)
        return re.sub(r"(['\"`])([^'\"`]*?)\1", literal, line)
    diff = list(difflib.unified_diff(baseline.splitlines(), actual.splitlines(), fromfile='reviewed/' + relative, tofile='running/' + relative, n=3))
    print(json.dumps({'runtimeSourceReview': {'file': relative,
          'baselineSha256': hashlib.sha256(baseline.encode()).hexdigest(),
          'runningSha256': hashlib.sha256(actual.encode()).hexdigest(), 'diffLines': len(diff),
          'diff': [sanitize(line) for line in diff[:350]], 'complete': len(diff) <= 350}}))
