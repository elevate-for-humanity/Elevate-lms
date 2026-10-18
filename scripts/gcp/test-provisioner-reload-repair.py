import hashlib
import importlib.util
from pathlib import Path
import tempfile
import unittest

spec = importlib.util.spec_from_file_location('repair', Path(__file__).with_name('repair-pbx-provisioner-reload.py'))
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)

class RepairTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.base = Path(self.directory.name)
        self.old = b'// previous reviewed provisioner\n'
        self.new = b'// new reviewed provisioner\n'
        m.EXPECTED_UID = m.os.getuid()
        m.STAGE = self.base
        m.BACKUPS = self.base / 'rollback'
        m.ROOT = self.base / 'generated'
        m.TARGET = self.base / 'server.mjs'
        m.TARGET.write_bytes(self.old)
        m.TARGET.chmod(0o644)
        m.OLD = hashlib.sha256(self.old).hexdigest()
        m.NEW = hashlib.sha256(self.new).hexdigest()
        self.revision = 'a' * 40
        self.source = self.base / ('elevate-provisioner-' + self.revision + '.mjs')
        self.source.write_bytes(self.new)
        self.commands = []
        self.calls = '0 active calls\n'
        self.start_failure = False
        self.active = True
        def run(args):
            self.commands.append(args)
            if 'core show channels count' in args:
                return self.calls
            if args[:2] == ['systemctl', 'stop']:
                self.active = False
            if args[:2] == ['systemctl', 'start']:
                if self.start_failure:
                    self.start_failure = False
                    raise ValueError('provisioner_command_failed')
                self.active = True
            if args[:2] == ['systemctl', 'is-active']:
                return 'active' if self.active else 'inactive'
            return ''
        m.run = run
        m.listener = lambda: True
        m.time.sleep = lambda _: None

    def test_success_changes_only_provisioner_and_keeps_exact_backup(self):
        report = m.repair(self.source, self.revision)
        self.assertEqual(report['result'], 'PASS')
        self.assertFalse(report['asteriskRestarted'])
        self.assertEqual(m.TARGET.read_bytes(), self.new)
        self.assertEqual((m.BACKUPS / ('provisioner-' + self.revision) / 'server.mjs').read_bytes(), self.old)
        self.assertFalse(any('restart' in command for command in self.commands))

    def test_failed_start_restores_previous_source_and_listener(self):
        self.start_failure = True
        with self.assertRaisesRegex(ValueError, 'upgrade_rolled_back'):
            m.repair(self.source, self.revision)
        self.assertEqual(m.TARGET.read_bytes(), self.old)
        self.assertTrue(self.active)

    def test_active_calls_and_existing_devices_block(self):
        self.calls = '1 active call\n'
        with self.assertRaisesRegex(ValueError, 'active_call'):
            m.repair(self.source, self.revision)
        self.assertEqual(m.TARGET.read_bytes(), self.old)
        self.assertFalse(any('stop' in command for command in self.commands))
        with self.assertRaisesRegex(ValueError, 'existing_pwa_devices'):
            m.require_idle('0 active calls\n', 'Endpoint: pwa-' + 'a' * 40, [])
        with self.assertRaisesRegex(ValueError, 'existing_pwa_devices'):
            m.require_idle('0 active calls\n', '', [{'device': 'existing'}])

    def test_unreviewed_source_blocks_before_service_mutation(self):
        self.source.write_bytes(b'unreviewed')
        with self.assertRaisesRegex(ValueError, 'source_requires_review'):
            m.repair(self.source, self.revision)
        self.assertEqual(self.commands, [])

if __name__ == '__main__':
    unittest.main()
