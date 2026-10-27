"""Exercise the TLS repair script with isolated shell commands, without networking."""
import os
from pathlib import Path
import subprocess
import tempfile
import unittest

SCRIPT = Path(__file__).with_name('repair-existing-pbx-tls.sh')

class GatewayPreservation(unittest.TestCase):
    def run_gateway(self, running='true', tls_code='0', ws_code='0'):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            trace = root / 'commands'
            commands = {
                'id': '#!/bin/bash\necho 0\n',
                'getent': '#!/bin/bash\necho "107.178.216.162 STREAM phone.elevateforhumanity.org"\n',
                'docker': '''#!/bin/bash
printf 'docker %s\n' "$*" >> "$PBX_TEST_TRACE"
if [[ "$1" != inspect ]]; then exit 97; fi
if [[ "$*" == *--format* ]]; then
 if [[ "$2" == pbx_asterisk_1 ]]; then echo true; else echo "$PBX_TEST_RUNNING"; fi
fi
''',
                'curl': '''#!/bin/bash
printf 'curl\n' >> "$PBX_TEST_TRACE"
if [[ "$*" == *https://* ]]; then echo ok; exit "$PBX_TEST_TLS_CODE"; fi
if [[ "$*" == */ws* ]]; then printf 101; fi
''',
                'python3': '#!/bin/bash\nprintf "sip-probe\\n" >> "$PBX_TEST_TRACE"\nexit "$PBX_TEST_WS_CODE"\n',
                'install': '#!/bin/bash\nprintf "WRITE_ATTEMPT\\n" >> "$PBX_TEST_TRACE"\nexit 97\n',
                'ss': '#!/bin/bash\nexit 97\n',
            }
            for name, content in commands.items():
                target = root / name
                target.write_text(content)
                target.chmod(0o700)
            env = {**os.environ, 'PATH': directory + ':/usr/bin:/bin', 'PBX_TEST_TRACE': str(trace),
                   'PBX_TEST_RUNNING': running, 'PBX_TEST_TLS_CODE': tls_code, 'PBX_TEST_WS_CODE': ws_code}
            result = subprocess.run(['/bin/bash', str(SCRIPT)], env=env, capture_output=True, text=True, timeout=5)
            return result, trace.read_text() if trace.exists() else ''

    def test_healthy_gateway_is_verified_before_any_configuration_write(self):
        result, trace = self.run_gateway()
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn('SIP gateway verified', result.stdout)
        self.assertIn('sip-probe', trace)
        self.assertNotIn('WRITE_ATTEMPT', trace)
        self.assertNotIn('docker pull', trace)
        self.assertNotIn('docker rm', trace)

    def test_static_health_does_not_hide_failed_sip_transport(self):
        result, trace = self.run_gateway(ws_code='1')
        self.assertNotEqual(result.returncode, 0)
        self.assertNotIn('WRITE_ATTEMPT', trace)

    def test_invalid_tls_preserves_configuration(self):
        result, trace = self.run_gateway(tls_code='22')
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('configuration preserved', result.stderr)
        self.assertNotIn('WRITE_ATTEMPT', trace)

    def test_stopped_gateway_requires_reviewed_recovery(self):
        result, trace = self.run_gateway(running='false')
        self.assertEqual(result.returncode, 1)
        self.assertIn('reviewed recovery', result.stderr)
        self.assertNotIn('WRITE_ATTEMPT', trace)

if __name__ == '__main__':
    unittest.main()
