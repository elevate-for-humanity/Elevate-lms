import importlib.util
from pathlib import Path
import unittest
from types import SimpleNamespace

spec = importlib.util.spec_from_file_location('probe', Path(__file__).with_name('probe-operator-provisioning.py'))
probe = importlib.util.module_from_spec(spec)
spec.loader.exec_module(probe)


class ExerciseTests(unittest.TestCase):
    def exercise(self, responses, active='0 active calls'):
        self.calls = []
        def send(url, headers, body):
            self.calls.append(url)
            response = responses.pop(0)
            if isinstance(response, Exception):
                raise response
            return response
        return probe.exercise({'deviceId': 'asterisk_probe_fixture'}, 'fixture', send,
            lambda *args, **kwargs: SimpleNamespace(returncode=0, stdout=active))

    def test_credentials_never_appear_and_cleanup_runs(self):
        result = self.exercise([(200, {'provider': 'asterisk', 'sipPassword': 'DO_NOT_PRINT'}),
                                (200, {'revoked': True})])
        self.assertNotIn('DO_NOT_PRINT', str(result))
        self.assertTrue(result['cleanup']['revoked'])
        self.assertTrue(self.calls[-1].endswith('/revoke'))

    def test_cleanup_after_timeout_and_failed_creation(self):
        result = self.exercise([TimeoutError('DO_NOT_PRINT'), (200, {'revoked': True})])
        self.assertEqual(result['create']['code'], 'transport_unavailable')
        self.assertNotIn('DO_NOT_PRINT', str(result))
        self.assertTrue(self.calls[-1].endswith('/revoke'))
        result = self.exercise([(503, {'error': 'asterisk_configuration_rejected'}), (200, {'revoked': True})])
        self.assertEqual(result['create']['code'], 'asterisk_configuration_rejected')

    def test_cleanup_failure_blocks_acceptance(self):
        result = self.exercise([(503, {'error': 'asterisk_rollback_failed'}), (503, {'error': 'provisioner_unavailable'})])
        self.assertEqual(result['create']['code'], 'asterisk_rollback_failed')
        self.assertEqual(result['cleanup']['code'], 'provisioner_unavailable')
        self.assertFalse(result['cleanup']['revoked'])

    def test_active_calls_block_before_creation(self):
        with self.assertRaisesRegex(ValueError, 'active_call'):
            self.exercise([], active='1 active call')
        self.assertEqual(self.calls, [])

    def test_unknown_error_is_never_reflected(self):
        self.assertEqual(probe.summarize(503, {'error': 'secret-value'})['code'], 'unclassified_response')


class OperatorExtensionTests(unittest.TestCase):
    def resolve(self, responses):
        self.urls = []
        def send(url, headers, body=None):
            self.urls.append(url)
            return responses.pop(0)
        return probe.operator_extension(send, 'https://db.example', 'system-id', {})

    def test_resolves_configured_admin_extension(self):
        self.assertEqual(self.resolve([(200, [{'admin_extension': '100'}])]), '100')
        self.assertIn('phone_systems?select=admin_extension&id=eq.system-id', self.urls[0])

    def test_legacy_zero_still_resolves(self):
        self.assertEqual(self.resolve([(200, [{'admin_extension': '0'}])]), '0')

    def test_unverified_system_record_is_rejected(self):
        for response in [(503, {}), (200, []), (200, [{'admin_extension': '100'}, {'admin_extension': '101'}]),
                         (200, [{'admin_extension': '00'}]), (200, [{'admin_extension': '1234'}]),
                         (200, [{'admin_extension': None}]), (200, [{}])]:
            with self.assertRaisesRegex(ValueError, 'operator_assignment_unverified'):
                self.resolve([response])


if __name__ == '__main__':
    unittest.main()
