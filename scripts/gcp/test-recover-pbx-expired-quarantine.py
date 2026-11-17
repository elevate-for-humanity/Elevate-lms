#!/usr/bin/env python3
import importlib.util
import json
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

SPEC = importlib.util.spec_from_file_location('recovery', Path(__file__).with_name('recover-pbx-expired-quarantine.py'))
m = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(m)
ID = 'pwa-' + 'a' * 40
GEN = 'generation-' + 'b' * 24
HEALTHY = {side: {'httpStatus': 200, 'providerVerified': True} for side in ['private', 'public']}
FAILED = {side: {'httpStatus': 503, 'code': 'provisioner_unavailable'} for side in ['private', 'public']}


class RecoveryTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        root = Path(self.temp.name)
        self.root = root / 'generated'
        self.root.mkdir()
        folder = self.root / GEN
        folder.mkdir()
        (self.root / 'current').symlink_to(GEN)
        self.records = [{'endpointId': ID, 'expiresAt': 1, 'password': 'DO-NOT-PRINT'}]
        for name, data in [('state.json', json.dumps(self.records)), ('pjsip.conf', 'PRIVATE'), ('extensions.conf', 'PRIVATE')]:
            (folder / name).write_text(data)
        self.source = root / 'server.mjs'
        self.source.write_bytes(b'reviewed fixture')
        self.properties = {'MainPID': '123', 'ActiveState': 'active'}
        self.output = {'core show channels count': '0 active channels\n0 active calls\n',
                       'pjsip show endpoints': ' Endpoint: ' + ID + '/x\nObjects found: 1\n',
                       'pjsip show aor ' + ID: ' Aor: ' + ID[:41] + ' 1\n Contact: <Aor/ContactUri> <Hash>\n'}
        self.patches = [patch.object(m, 'ROOT', self.root), patch.object(m, 'SOURCE', self.source),
                        patch.object(m, 'SOURCE_SHA', m.digest(self.source.read_bytes())),
                        patch.object(m, 'EXPECTED_UID', os.getuid()), patch.object(m, 'BACKUPS', root / 'backups'),
                        patch.object(m, 'unit_properties', return_value=self.properties),
                        patch.object(m, 'probe', return_value=FAILED),
                        patch.object(m, 'cli', side_effect=lambda cmd: self.output[cmd]),
                        patch.object(m, 'run', return_value='PBX expired-credential revocation stage: provisioner_quarantined\n')]
        for item in self.patches:
            item.start()
            self.addCleanup(item.stop)
        original_read = Path.read_bytes
        def read(path):
            if str(path) == '/proc/123/environ':
                return b'PBX_GENERATED_ROOT=' + str(self.root).encode() + b'\0PBX_ASTERISK_CONTAINER=pbx_asterisk_1\0'
            return original_read(path)
        p = patch.object(Path, 'read_bytes', read)
        p.start()
        self.addCleanup(p.stop)

    def inspect(self):
        return m.inspect(Path('/unused'), now=1000)

    def test_preview_is_read_only_and_redacted(self):
        report = m.recover(Path('/unused'))
        self.assertEqual(report['result'], 'PREVIEW')
        self.assertFalse(m.BACKUPS.exists())
        self.assertNotIn('PRIVATE', json.dumps(report))
        self.assertNotIn('DO-NOT-PRINT', json.dumps(report))
        self.assertFalse(any(call.args[0][0] == 'systemctl' for call in m.run.call_args_list))

    def test_live_lease_blocks(self):
        self.records[0]['expiresAt'] = 2000
        (self.root / GEN / 'state.json').write_text(json.dumps(self.records))
        with self.assertRaisesRegex(m.Blocked, 'live_lease'):
            self.inspect()

    def test_activity_and_unknown_inventory_block(self):
        for command, value, reason in [
            ('core show channels count', '1 active channel\n0 active calls', 'active_calls'),
            ('pjsip show endpoints', '', 'endpoint_inventory'),
            ('pjsip show endpoints', 'Endpoint: pwa-' + 'c' * 40 + '\nObjects found: 1', 'unknown_pwa'),
            ('pjsip show aor ' + ID, 'Aor: wrong 1', 'aor_unverified'),
            ('pjsip show aor ' + ID, 'Aor: ' + ID[:41] + ' 1\nContact: ' + ID + '/sip:x Unavail', 'registered_contact'),
        ]:
            with self.subTest(reason=reason):
                prior = self.output[command]
                self.output[command] = value
                with self.assertRaisesRegex(m.Blocked, reason):
                    self.inspect()
                self.output[command] = prior

    def test_source_and_authentication_must_match(self):
        with patch.object(m, 'SOURCE_SHA', '0' * 64), self.assertRaisesRegex(m.Blocked, 'runtime_source'):
            self.inspect()
        with patch.object(m, 'probe', return_value=HEALTHY), self.assertRaisesRegex(m.Blocked, 'authenticated_quarantine'):
            self.inspect()

    def test_snapshot_is_private_verified_and_complete(self):
        evidence = self.inspect()
        folder = m.BACKUPS / m.snapshot(evidence)
        self.assertEqual(folder.stat().st_mode & 0o777, 0o700)
        for name, expected in evidence['files'].items():
            self.assertEqual((folder / name).read_bytes(), expected)
            self.assertEqual((folder / name).stat().st_mode & 0o777, 0o600)
        self.assertEqual((folder / 'server.mjs').read_bytes(), evidence['source'])

    def test_mismatched_review_never_snapshots_or_stops(self):
        with self.assertRaisesRegex(m.Blocked, 'reviewed_state_changed'):
            m.recover(Path('/unused'), '0' * 64)
        self.assertFalse(m.BACKUPS.exists())

    def test_changed_state_after_snapshot_never_stops(self):
        evidence = self.inspect()
        changed = {**evidence, 'fingerprint': '0' * 64}
        with patch.object(m, 'inspect', side_effect=[evidence, changed]), self.assertRaisesRegex(m.Blocked, 'reviewed_state_changed'):
            m.recover(Path('/unused'), evidence['fingerprint'])
        self.assertFalse(any(call.args[0][0] == 'systemctl' for call in m.run.call_args_list))

    def transition(self, healthy=True, invalidate=True):
        evidence = self.inspect()
        commands = []
        def command(args, **kwargs):
            commands.append(args)
            if args[:2] == ['systemctl', 'stop']:
                if invalidate:
                    (self.root / 'current').unlink()
                return ''
            if '--property=MainPID' in args:
                return '0'
            return 'active'
        with patch.object(m, 'inspect', return_value=evidence), patch.object(m, 'idle_inventory', return_value=[ID]), \
             patch.object(m, 'run', side_effect=command), patch.object(m, 'cli', return_value='Objects found: 0'), \
             patch.object(m, 'probe', return_value=HEALTHY if healthy else FAILED), patch.object(m.time, 'sleep'):
            report = m.recover(Path('/unused'), evidence['fingerprint'])
        return report, commands

    def test_recovery_requires_authenticated_health_and_preserves_snapshot(self):
        report, commands = self.transition()
        self.assertEqual(report['result'], 'RECOVERED')
        self.assertEqual(report['ringingAcceptance'], 'PENDING')
        self.assertTrue((m.BACKUPS / report['snapshot'] / GEN / 'state.json').exists())
        self.assertEqual(sum(c[:2] == ['systemctl', 'stop'] for c in commands), 1)
        self.assertEqual(sum(c[:2] == ['systemctl', 'start'] for c in commands), 1)

    def test_failed_health_never_restarts_again_or_restores_expired_auth(self):
        report, commands = self.transition(healthy=False)
        self.assertEqual(report['result'], 'RECOVERY_UNVERIFIED')
        self.assertEqual(sum(c[:2] == ['systemctl', 'stop'] for c in commands), 1)
        self.assertFalse((self.root / 'current').exists())

    def test_failed_invalidation_never_starts(self):
        report, commands = self.transition(invalidate=False)
        self.assertEqual(report['result'], 'RECOVERY_UNVERIFIED')
        self.assertFalse(any(c[:2] == ['systemctl', 'start'] for c in commands))

    def test_post_stop_invalidation_waits_for_bounded_endpoint_settling(self):
        (self.root / 'current').unlink()
        with patch.object(m, 'run', return_value='0'), \
             patch.object(m, 'cli', side_effect=[self.output['pjsip show endpoints'], 'Objects found: 0']) as inventory, \
             patch.object(m.time, 'sleep') as sleep:
            m.verify_stopped_invalidation()
        self.assertEqual(inventory.call_count, 2)
        sleep.assert_called_once_with(0.25)

    def test_persistent_endpoint_never_passes_stop_verification(self):
        (self.root / 'current').unlink()
        with patch.object(m, 'run', return_value='0'), \
             patch.object(m, 'cli', return_value=self.output['pjsip show endpoints']) as inventory, \
             patch.object(m.time, 'sleep') as sleep, \
             self.assertRaisesRegex(m.Blocked, 'invalidation_unverified'):
            m.verify_stopped_invalidation()
        self.assertEqual(inventory.call_count, 12)
        self.assertEqual(sleep.call_count, 11)

    def test_reappearing_process_or_unknown_inventory_blocks_settling(self):
        (self.root / 'current').unlink()
        with patch.object(m, 'run', side_effect=['0', '123']), \
             patch.object(m, 'cli', return_value=self.output['pjsip show endpoints']), \
             patch.object(m.time, 'sleep'), self.assertRaisesRegex(m.Blocked, 'stop_unverified'):
            m.verify_stopped_invalidation()
        with patch.object(m, 'run', return_value='0'), patch.object(m, 'cli', return_value=''), \
             self.assertRaisesRegex(m.Blocked, 'endpoint_inventory_unverified'):
            m.verify_stopped_invalidation()

    def test_failed_stop_never_polls_or_starts_even_if_invalidation_looks_complete(self):
        evidence = self.inspect()
        def fail_stop(args):
            self.assertEqual(args[:2], ['systemctl', 'stop'])
            (self.root / 'current').unlink()
            raise m.Blocked('command_unverified')
        with patch.object(m, 'inspect', return_value=evidence), \
             patch.object(m, 'idle_inventory', return_value=[ID]), \
             patch.object(m, 'run', side_effect=fail_stop) as command, \
             patch.object(m, 'verify_stopped_invalidation') as verify:
            report = m.recover(Path('/unused'), evidence['fingerprint'])
        self.assertEqual(report['result'], 'RECOVERY_UNVERIFIED')
        self.assertEqual(command.call_count, 1)
        verify.assert_not_called()

    def test_probe_executes_only_verified_bytes(self):
        # Undo fixture mock to exercise the actual subprocess boundary.
        real_probe = SPEC.loader.get_code('recovery')
        namespace = {'__name__': 'test_module'}
        exec(real_probe, namespace)
        probe_file = Path(self.temp.name) / 'probe.py'
        probe_file.write_bytes(b'print("fixture")')
        namespace['PROBE_SHA'] = m.digest(probe_file.read_bytes())
        report = {'credentialsCreated': False, 'carrierRoutingChanged': False,
                  'operatorProvisioningProbe': HEALTHY}
        from types import SimpleNamespace
        with patch.object(namespace['subprocess'], 'run', return_value=SimpleNamespace(stdout=json.dumps(report))) as called:
            self.assertEqual(namespace['probe'](probe_file), HEALTHY)
            self.assertEqual(called.call_args.args[0], ['/usr/bin/python3', '-'])
            self.assertEqual(called.call_args.kwargs['input'], 'print("fixture")')
            self.assertEqual(called.call_args.kwargs['timeout'], 50)
        probe_file.write_bytes(b'changed')
        with self.assertRaisesRegex(namespace['Blocked'], 'probe_source_unverified'):
            namespace['probe'](probe_file)

    def test_retained_generation_symlink_blocks_snapshot(self):
        (self.root / GEN / 'pjsip.conf').unlink()
        (self.root / GEN / 'pjsip.conf').symlink_to(self.source)
        with self.assertRaisesRegex(m.Blocked, 'file_ownership'):
            self.inspect()

    def test_activity_at_final_check_never_stops(self):
        evidence = self.inspect()
        with patch.object(m, 'inspect', return_value=evidence), \
             patch.object(m, 'idle_inventory', side_effect=m.Blocked('registered_contact_requires_review')), \
             self.assertRaisesRegex(m.Blocked, 'registered_contact'):
            m.recover(Path('/unused'), evidence['fingerprint'])
        self.assertFalse(any(c.args[0][:2] == ['systemctl', 'stop'] for c in m.run.call_args_list))


if __name__ == '__main__':
    unittest.main()

