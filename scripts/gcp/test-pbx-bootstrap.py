"""Run the real bootstrap with isolated command boundaries; never touch a VM."""
import os
from pathlib import Path
import subprocess
import tempfile
import unittest

SCRIPT = Path(__file__).parents[2] / 'infra/pbx/google-startup.sh'

class BootstrapPreservation(unittest.TestCase):
    def run_bootstrap(self, running='true', cli_code='0', docker_info_code='0'):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            trace = root / 'commands'
            commands = {
                'docker': """#!/bin/bash
printf '%s\n' "$*" >> "$PBX_TEST_TRACE"
case "$1" in
 info) exit "$PBX_TEST_INFO_CODE" ;;
 inspect) if [[ "$*" == *--format* ]]; then echo "$PBX_TEST_RUNNING"; fi ;;
 exec) exit "$PBX_TEST_CLI_CODE" ;;
 *) exit 97 ;;
esac
""",
                'apt-get': '#!/bin/bash\nexit 97\n',
                'git': '#!/bin/bash\nexit 97\n',
                'systemctl': '#!/bin/bash\nexit 97\n',
            }
            for name, content in commands.items():
                target = root / name
                target.write_text(content)
                target.chmod(0o700)
            env = {**os.environ, 'PATH': directory + ':/usr/bin:/bin', 'PBX_TEST_TRACE': str(trace),
                   'PBX_TEST_RUNNING': running, 'PBX_TEST_CLI_CODE': cli_code,
                   'PBX_TEST_INFO_CODE': docker_info_code}
            result = subprocess.run(['/bin/bash', str(SCRIPT)], env=env, capture_output=True, text=True, timeout=5)
            return result, trace.read_text() if trace.exists() else ''

    def test_running_pbx_is_not_reset_pulled_or_recreated(self):
        result, trace = self.run_bootstrap()
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn('Existing PBX preserved', result.stdout)
        self.assertEqual(trace.splitlines(), ['info', 'inspect pbx_asterisk_1',
            "inspect pbx_asterisk_1 --format {{.State.Running}}", 'exec pbx_asterisk_1 asterisk -rx core show uptime'])

    def test_stopped_existing_pbx_requires_recovery(self):
        result, trace = self.run_bootstrap(running='false')
        self.assertEqual(result.returncode, 1)
        self.assertIn('explicit recovery', result.stderr)
        self.assertNotIn('exec ', trace)

    def test_unresponsive_pbx_is_preserved(self):
        result, _ = self.run_bootstrap(cli_code='1')
        self.assertEqual(result.returncode, 1)
        self.assertIn('preserving', result.stderr)

    def test_unknown_docker_state_blocks_bootstrap(self):
        result, trace = self.run_bootstrap(docker_info_code='1')
        self.assertEqual(result.returncode, 1)
        self.assertEqual(trace, 'info\n')

if __name__ == '__main__':
    unittest.main()
