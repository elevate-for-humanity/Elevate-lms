import importlib.util
from pathlib import Path
from types import SimpleNamespace
import tempfile
import unittest

spec = importlib.util.spec_from_file_location('trunk', Path(__file__).with_name('stage-twilio-trunk.py'))
trunk = importlib.util.module_from_spec(spec)
spec.loader.exec_module(trunk)


class CarrierInstallation(unittest.TestCase):
    def test_restart_requires_idle_channels_and_only_new_carrier_endpoint(self):
        trunk.require_idle_endpoint_restart('0 active calls\n0 active channels', 'Endpoint: twilio/+14632401404\nObjects found: 1')
        for channels, endpoints in [('1 active call\n2 active channels', 'Endpoint: twilio\nObjects found: 1'),
                                    ('0 active calls\n0 active channels', 'Endpoint: twilio\nEndpoint: pwa-existing\nObjects found: 2'),
                                    ('0 active calls\n0 active channels', 'No objects found.')]:
            with self.assertRaises(ValueError):
                trunk.require_idle_endpoint_restart(channels, endpoints)
    def fixture(self, directory):
        root = Path(directory) / 'asterisk'
        root.mkdir()
        (root / 'pjsip.conf').write_text('; Preserve existing endpoints\n')
        (root / 'extensions.conf').write_text('; Preserve user routing\n')
        return root, Path(directory) / 'rollback'

    def command(self, calls, endpoint='media_encryption : sdes', transport='protocol : tls\nverify_server : true'):
        def execute(args):
            calls.append(args[-1])
            outputs = {'core show channels count': '0 active calls\n0 active channels',
                       'pjsip show endpoint twilio': endpoint,
                       'pjsip show transport elevate-twilio-tls': transport}
            return SimpleNamespace(stdout=outputs.get(args[-1], ''))
        return execute

    def test_failed_readback_restores_original_and_keeps_private_rollback(self):
        with tempfile.TemporaryDirectory() as directory:
            root, backup = self.fixture(directory)
            original = (root / 'pjsip.conf').read_bytes()
            calls = []
            with self.assertRaisesRegex(ValueError, 'live_tls_endpoint_reload_not_confirmed'):
                trunk.install_endpoint(root, backup, self.command(calls, endpoint='Unable to find object'))
            self.assertEqual((root / 'pjsip.conf').read_bytes(), original)
            self.assertFalse((root / 'elevate-twilio.conf').exists())
            self.assertEqual((backup / 'pjsip.conf').read_bytes(), original)
            self.assertEqual((backup / 'pjsip.conf').stat().st_mode & 0o777, 0o600)
            self.assertEqual(calls.count('pjsip reload'), 2)

    def test_active_calls_prevent_configuration_writes(self):
        with tempfile.TemporaryDirectory() as directory:
            root, backup = self.fixture(directory)
            original = (root / 'pjsip.conf').read_bytes()
            with self.assertRaisesRegex(ValueError, 'active_calls_or_channels'):
                trunk.install_endpoint(root, backup, lambda _: SimpleNamespace(stdout='1 active call\n2 active channels'))
            self.assertEqual((root / 'pjsip.conf').read_bytes(), original)
            self.assertFalse(backup.exists())

    def test_install_preserves_routing_and_does_not_duplicate_include(self):
        with tempfile.TemporaryDirectory() as directory:
            root, backup = self.fixture(directory)
            calls = []
            for _ in range(2):
                report = trunk.install_endpoint(root, backup, self.command(calls))
                self.assertEqual(report['result'], 'PASS')
                self.assertFalse(report['publicNumberRoutingChanged'])
            self.assertEqual((root / 'pjsip.conf').read_text().count('#include elevate-twilio.conf'), 1)
            self.assertEqual((root / 'extensions.conf').read_text(), '; Preserve user routing\n')
            self.assertNotIn('dialplan reload', calls)


if __name__ == '__main__':
    unittest.main()
