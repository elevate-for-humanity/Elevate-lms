import importlib.util
from pathlib import Path
import tempfile
import unittest

spec = importlib.util.spec_from_file_location('diagnostic', Path(__file__).with_name('diagnose-pbx-provisioner.py'))
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)

class DiagnosticTests(unittest.TestCase):
    def test_exports_only_allowlisted_whole_log_events(self):
        journal = '\n'.join(['password=private', 'PBX ownership/runtime reconciliation failed: asterisk_aor_unverified', 'PBX expired-credential revocation stage: provisioner_quarantined', 'PBX expired-credential revocation stage: private', 'PBX ownership/runtime reconciliation failed: unknown token=private'])
        report = m.failure_stages(journal)
        self.assertEqual(report['recentStages'], [{'stage': 'reconciliation', 'code': 'asterisk_aor_unverified'}, {'stage': 'revocation', 'code': 'provisioner_quarantined'}])
        self.assertTrue(report['quarantineObserved'])
        self.assertNotIn('private', str(report))

    def test_carrier_configuration_is_not_live_caller_acceptance(self):
        output = ' Endpoint: twilio/fixture Not in use\n callerid : Business <+14632401404>\n trust_id_inbound : false\n password : private\n'
        report = m.carrier_identity(output)
        self.assertTrue(report['endpointObserved'])
        self.assertTrue(report['fixedCallerNumberPresent'])
        self.assertFalse(report['trustInboundIdentity'])
        self.assertNotIn('14632401404', str(report))
        self.assertNotIn('private', str(report))
        self.assertTrue(m.carrier_identity(output.replace('false', 'true'))['trustInboundIdentity'])
        self.assertFalse(m.carrier_identity('')['trustInboundIdentity'])

    def test_private_lease_data_is_reduced_to_expiry_counts(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            generation = root / ('generation-' + 'a' * 24)
            generation.mkdir()
            (root / 'current').symlink_to(generation.name)
            (generation / 'state.json').write_text('[{"expiresAt":10,"password":"private"},{"expiresAt":30,"profileId":"private"}]')
            report = m.generation_summary(root, now=20)
            self.assertEqual(report['leaseCount'], 2)
            self.assertEqual(report['expiredLeaseCount'], 1)
            self.assertNotIn('private', str(report))
            (root / 'current').unlink()
            (root / 'current').symlink_to('/etc')
            self.assertEqual(m.generation_summary(root)['state'], 'invalid_generation')

if __name__ == '__main__':
    unittest.main()
