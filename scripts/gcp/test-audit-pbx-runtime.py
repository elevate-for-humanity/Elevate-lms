import importlib.util
from pathlib import Path
import unittest
from unittest.mock import Mock
spec = importlib.util.spec_from_file_location('pbx_audit', Path(__file__).with_name('audit-pbx-runtime.py'))
pbx = importlib.util.module_from_spec(spec)
spec.loader.exec_module(pbx)
class RuntimeEvidence(unittest.TestCase):
    def test_context_or_wildcard_is_not_an_operator_route(self):
        self.assertFalse(pbx.operator_configured("[ Context 'internal' ]\n '_X.' => 1. Dial(PJSIP/${EXTEN},30)"))
        self.assertFalse(pbx.operator_configured("There is no existence of '0@internal'"))
        self.assertTrue(pbx.operator_configured(" '0' => 1. Gosub(elevate-operator,s,1) [extensions.conf:10]"))
    def test_zero_mailboxes_is_not_a_configured_mailbox(self):
        self.assertEqual(pbx.mailbox_count('0 voicemail users configured.'), 0)
        self.assertEqual(pbx.mailbox_count('There are no voicemail users currently defined\n'), 0)
        self.assertEqual(pbx.mailbox_count('3 voicemail users configured.'), 3)
        self.assertIsNone(pbx.mailbox_count('No such command'))
    def test_private_probe_requires_auth_rejection_and_never_sends_credentials(self):
        for status, expected in [(401, 'PASS'), (200, 'FAIL'), (404, 'FAIL'), (500, 'FAIL')]:
            connection = Mock()
            connection.getresponse.return_value.status = status
            connect = Mock(return_value=connection)
            result = pbx.private_listener(8090, '/internal/pbx/devices', connect)
            self.assertEqual(result['result'], expected)
            connect.assert_called_once_with('127.0.0.1', 8090, timeout=3)
            connection.request.assert_called_once_with('POST', '/internal/pbx/devices', body='{}',
                                                       headers={'Content-Type': 'application/json'})
            connection.getresponse.return_value.read.assert_not_called()
            connection.close.assert_called_once()
    def test_unreachable_listener_is_blocked_and_does_not_expose_error(self):
        connection = Mock()
        connection.request.side_effect = ConnectionRefusedError('private details')
        result = pbx.private_listener(8091, '/internal/paris/turn', Mock(return_value=connection))
        self.assertEqual(result, {'result': 'BLOCKED', 'evidence': {'reason': 'listener_unreachable'}})
        connection.close.assert_called_once()
    def test_metadata_reads_only_scopes_not_tokens(self):
        for body, expected in [(b'https://www.googleapis.com/auth/cloud-platform\n', 'PASS'),
                               (b'https://www.googleapis.com/auth/devstorage.read_only\n', 'FAIL')]:
            connection = Mock()
            connection.getresponse.return_value.status = 200
            connection.getresponse.return_value.read.return_value = body
            result = pbx.vm_secret_scope(Mock(return_value=connection))
            self.assertEqual(result['result'], expected)
            connection.request.assert_called_once_with('GET', '/computeMetadata/v1/instance/service-accounts/default/scopes',
                                                       headers={'Metadata-Flavor': 'Google'})
            connection.close.assert_called_once()
    def test_unavailable_scope_metadata_is_not_a_missing_scope_claim(self):
        connection = Mock()
        connection.getresponse.return_value.status = 404
        result = pbx.vm_secret_scope(Mock(return_value=connection))
        self.assertEqual(result['result'], 'BLOCKED')
        connection.getresponse.return_value.read.assert_not_called()
    def test_unit_evidence_distinguishes_missing_failed_and_running_processes(self):
        for state, expected in [('LoadState=not-found\nActiveState=inactive\nSubState=dead', 'FAIL'),
                                ('LoadState=loaded\nActiveState=failed\nSubState=failed', 'FAIL'),
                                ('LoadState=loaded\nActiveState=active\nSubState=running', 'PASS')]:
            self.assertEqual(pbx.service_state(state)['result'], expected)
        self.assertEqual(pbx.service_state(None)['result'], 'BLOCKED')
    def test_unit_diagnostics_never_emit_arbitrary_fields_or_values(self):
        report = pbx.service_state('LoadState=private-value\nEnvironment=private-value\nActiveState=active\nSubState=running')
        self.assertEqual(report['result'], 'BLOCKED')
        self.assertNotIn('private-value', str(report))
        self.assertNotIn('Environment', str(report))
    def test_runtime_file_checks_report_presence_without_reading_contents(self):
        exists = Mock(side_effect=[True, False])
        report = pbx.runtime_files({'entrypoint': '/expected/script', 'environment_file': '/expected/config'}, exists)
        self.assertEqual(report, {'result': 'FAIL', 'evidence': {'entrypoint': True, 'environment_file': False}})
        self.assertEqual(exists.call_count, 2)
if __name__ == '__main__': unittest.main()
