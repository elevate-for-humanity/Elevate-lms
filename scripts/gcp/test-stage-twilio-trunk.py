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
        trunk.require_idle_endpoint_restart('0 active calls\n0 active channels', 'No objects found.')
        for channels, endpoints in [('1 active call\n2 active channels', 'Endpoint: twilio\nObjects found: 1'),
                                    ('0 active calls\n0 active channels', 'Endpoint: twilio\nEndpoint: pwa-existing\nObjects found: 2'),
                                    ('0 active calls\n0 active channels', 'Endpoint inventory unavailable')]:
            with self.assertRaises(ValueError):
                trunk.require_idle_endpoint_restart(channels, endpoints)
    def test_inbound_identity_is_not_replaced_for_any_extension(self):
        self.assertIn('trust_id_inbound=yes', trunk.CONFIG)
        self.assertNotIn('\ncallerid=', trunk.CONFIG)
        # Outbound carrier identity remains explicit and separate from inbound identity.
        self.assertIn('from_user=+14632401404', trunk.CONFIG)
        self.assertIn('send_pai=yes', trunk.CONFIG)
        self.assertIn('identify_by=ip', trunk.CONFIG)
        self.assertIn('verify_server=yes', trunk.CONFIG)

    def test_exact_legacy_configuration_can_be_upgraded(self):
        with tempfile.TemporaryDirectory() as directory:
            root, backup = self.fixture(directory)
            fragment = root / 'elevate-twilio.conf'
            fragment.write_text(trunk.LEGACY_CONFIG)
            trunk.install_endpoint(root, backup, self.command([]))
            self.assertEqual(fragment.read_text(), trunk.CONFIG)

    def test_failed_upgrade_restores_existing_carrier_fragment(self):
        with tempfile.TemporaryDirectory() as directory:
            root, backup = self.fixture(directory)
            fragment = root / 'elevate-twilio.conf'
            fragment.write_text(trunk.LEGACY_CONFIG)
            with self.assertRaisesRegex(ValueError, 'live_tls_endpoint_reload_not_confirmed'):
                trunk.install_endpoint(root, backup, self.command([], endpoint='Unable to find object'))
            self.assertEqual(fragment.read_text(), trunk.LEGACY_CONFIG)

    def test_unknown_existing_carrier_configuration_is_preserved(self):
        with tempfile.TemporaryDirectory() as directory:
            root, backup = self.fixture(directory)
            fragment = root / 'elevate-twilio.conf'
            original = trunk.LEGACY_CONFIG + '; operator-managed change\n'
            fragment.write_text(original)
            calls = []
            with self.assertRaisesRegex(ValueError, 'existing_carrier_configuration_requires_review'):
                trunk.install_endpoint(root, backup, self.command(calls))
            self.assertEqual(fragment.read_text(), original)
            self.assertEqual(calls, [])

    def fixture(self, directory):
        root = Path(directory) / 'asterisk'
        root.mkdir()
        (root / 'pjsip.conf').write_text('; Preserve existing endpoints\n')
        (root / 'extensions.conf').write_text('; Preserve user routing\n')
        return root, Path(directory) / 'rollback'

    def command(self, calls, endpoint='media_encryption : sdes\ntrust_id_inbound : true', transport='protocol : tls\nverify_server : true'):
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

    def test_identity_readback_failure_rolls_back_legacy_fragment(self):
        with tempfile.TemporaryDirectory() as directory:
            root, backup = self.fixture(directory)
            fragment = root / 'elevate-twilio.conf'
            fragment.write_text(trunk.LEGACY_CONFIG)
            with self.assertRaisesRegex(ValueError, 'live_inbound_caller_identity_not_confirmed'):
                trunk.install_endpoint(root, backup, self.command([], endpoint='media_encryption : sdes\ntrust_id_inbound : false'))
            self.assertEqual(fragment.read_text(), trunk.LEGACY_CONFIG)

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

