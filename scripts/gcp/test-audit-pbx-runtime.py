import importlib.util
from pathlib import Path
import unittest
from unittest.mock import Mock
spec = importlib.util.spec_from_file_location('pbx_audit', Path(__file__).with_name('audit-pbx-runtime.py'))
pbx = importlib.util.module_from_spec(spec)
spec.loader.exec_module(pbx)
class RuntimeEvidence(unittest.TestCase):
    def test_generated_operator_uses_contact_collection_before_dialing(self):
        plan = "[ Context 'elevate-pwa-extensions' ]\n '0' => 1. Set(PWA_CONTACTS=)\n 2. Set(PWA_DEVICE_CONTACTS=${PJSIP_DIAL_CONTACTS(pwa-" + 'a'*40 + ")})\n 3. Dial(${PWA_CONTACTS},25)\n 4. Return()"
        self.assertTrue(pbx.pwa_operator_configured(plan))
        self.assertFalse(pbx.operator_configured(plan))
        self.assertFalse(pbx.pwa_operator_configured("[ Context 'elevate-pwa-extensions' ]\n '_X.' => 1. Set(PWA_CONTACTS=)\nReturn()"))
        self.assertFalse(pbx.pwa_operator_configured("[ Context 'elevate-pwa-extensions' ]\n '0' => 1. Set(PWA_CONTACTS=)\nReturn()"))
        self.assertTrue(pbx.pwa_operator_configured("[ Context 'elevate-pwa-extensions' ]\n '0' => 1. Set(PWA_CONTACTS=)\nSet(DIALSTATUS=CHANUNAVAIL)\nReturn()"))
    def test_operator_generated_live_contact_resolution(self):
        endpoint = 'pwa-' + 'a' * 40
        plan = (
            "[ Context 'elevate-pwa-extensions' ]\n"
            " '0' => 1. Set(PWA_CONTACTS=)\n"
            " 2. ExecIf($[1]?Set(PWA_DEVICE_CONTACTS=${PJSIP_DIAL_CONTACTS(" + endpoint + ")}))\n"
            " 3. Dial(${PWA_CONTACTS},20)\n"
            " 4. Return()"
        )
        self.assertTrue(pbx.pwa_operator_configured(plan))
        self.assertFalse(pbx.pwa_operator_configured(plan.replace('Dial(${PWA_CONTACTS},20)', 'NoOp(no ring)')))

    def test_delegated_operator_requires_verified_destination(self):
        alias = "[ Context 'elevate-pwa-extensions' ]\n '0' => 1. Gosub(elevate-pwa-extensions,104,1)\n 2. Return()"
        target = ("[ Context 'elevate-pwa-extensions' ]\n '104' => 1. Set(PWA_CONTACTS=)\n"
                  " 2. ExecIf($[1]?Set(PWA_DEVICE_CONTACTS=${PJSIP_DIAL_CONTACTS(pwa-" + 'a'*40 + ")}))\n"
                  " 3. Dial(${PWA_CONTACTS},25)\n 4. Return()")
        self.assertTrue(pbx.delegated_operator_configured(alias, target))
        self.assertFalse(pbx.delegated_operator_configured(alias, None))
        self.assertFalse(pbx.delegated_operator_configured(alias, target.replace("'104'", "'105'")))
        self.assertFalse(pbx.delegated_operator_configured(alias.replace("104,1", "105,1"), target))
        self.assertFalse(pbx.delegated_operator_configured(alias, target.replace("Dial(${PWA_CONTACTS},25)", "NoOp(no dial)")))
        self.assertFalse(pbx.delegated_operator_configured(" '0' => 1. Gosub(elevate-pwa-extensions,104,1)", target))

    def test_runtime_audit_resolves_delegated_operator_before_lookup(self):
        # Regression: the runtime lookup previously used an over-escaped raw regex,
        # so valid delegated aliases never reached their destination audit.
        alias = "[ Context 'elevate-pwa-extensions' ]\n '0' => 1. Gosub(elevate-pwa-extensions,104,1)\n 2. Return()"
        self.assertEqual(pbx.operator_alias_extension(alias), '104')
        self.assertIsNone(pbx.operator_alias_extension(None))
        self.assertIsNone(pbx.operator_alias_extension(" '0' => 1. Gosub(internal,104,1)\n 2. Return()"))
        self.assertIsNone(pbx.operator_alias_extension(" '_X.' => 1. Gosub(elevate-pwa-extensions,104,1)\n 2. Return()"))
        self.assertIsNone(pbx.operator_alias_extension(" '0' => 1. Gosub(elevate-pwa-extensions,9,1)\n 2. Return()"))

    def test_operator_route_reason_reports_only_fixed_labels(self):
        direct = "[ Context 'elevate-pwa-extensions' ]\n '0' => 1. Set(PWA_CONTACTS=)\n Set(DIALSTATUS=CHANUNAVAIL)\n Return()"
        alias = " '0' => 1. Gosub(elevate-pwa-extensions,104,1)\n 2. Return()"
        target = ("[ Context 'elevate-pwa-extensions' ]\n '104' => 1. Set(PWA_CONTACTS=)\n"
                  " 2. Set(DIALSTATUS=CHANUNAVAIL)\n 3. Return()")
        self.assertEqual(pbx.operator_route_reason(None, None), 'operator_dialplan_unavailable')
        self.assertEqual(pbx.operator_route_reason('There is no existence of 0@elevate-pwa-extensions', None), 'generated_route_absent')
        self.assertEqual(pbx.operator_route_reason(" '0' => 1. NoOp(private)", None), 'generated_route_invalid')
        self.assertEqual(pbx.operator_route_reason(alias, None), 'delegated_target_unverified')
        self.assertEqual(pbx.operator_route_reason(alias, target), 'delegated_route_verified')
        self.assertEqual(pbx.operator_route_reason(direct, None), 'direct_route_verified')
        self.assertNotIn('104', pbx.operator_route_reason(alias, target))
        self.assertNotIn('private', pbx.operator_route_reason(" '0' => 1. NoOp(private)", None))

    def test_carrier_inventory_excludes_identity_and_credentials(self):
        report = pbx.carrier_inventory('Transport: transport-udp udp 0 0 0.0.0.0:5060\nTransport: secure tls 0 0 0.0.0.0:5061\npassword=private',
                                      ' Endpoint: twilio/123456 Not in use\n Endpoint: pwa-private Not in use\n Endpoint: telnyx Not in use')
        self.assertEqual(report['evidence']['transports'], [{'protocol': 'udp', 'bind': '0.0.0.0:5060'}, {'protocol': 'tls', 'bind': '0.0.0.0:5061'}])
        self.assertTrue(report['evidence']['twilio_endpoint_present'])
        self.assertTrue(report['evidence']['telnyx_endpoint_present'])
        self.assertNotIn('private', str(report))
        self.assertEqual(pbx.carrier_inventory(None, None)['result'], 'BLOCKED')
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
