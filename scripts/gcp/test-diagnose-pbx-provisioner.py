import importlib.util
import contextlib
import io
import json
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('diagnostic', Path(__file__).with_name('diagnose-pbx-provisioner.py'))
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)

class DiagnosticTests(unittest.TestCase):
    def capture_report(self, entries, journal_status=0):
        # Simulate journalctl's time filter and latest-N tail before parsing.
        # Entry ages are seconds before capture; no live journal/host is accessed.
        def run(args, **kwargs):
            self.assertEqual(kwargs, {'capture_output': True, 'text': True, 'timeout': 20})
            if args[0] == 'journalctl':
                self.assertEqual(args, ['journalctl', '-u', 'elevate-pbx-provisioner.service',
                                       '--since', '24 hours ago', '-n', '50000',
                                       '--no-pager', '-o', 'cat'])
                hours = int(args[args.index('--since') + 1].split()[0])
                limit = int(args[args.index('-n') + 1])
                lines = [line for age, line in entries if age <= hours * 3600]
                return subprocess.CompletedProcess(args, journal_status, '\n'.join(lines[-limit:]))
            self.assertEqual(args, ['docker', 'exec', 'pbx_asterisk_1', 'asterisk', '-rx',
                                   'pjsip show endpoint twilio'])
            return subprocess.CompletedProcess(args, 0, ' Endpoint: twilio/fixture Not in use\n')

        output = io.StringIO()
        with patch.object(m.subprocess, 'run', side_effect=run) as runner, \
                patch.object(m, 'generation_summary', return_value={'state': 'observed'}), \
                contextlib.redirect_stdout(output):
            self.assertEqual(m.main(), 0 if journal_status == 0 else 1)
        self.assertEqual(runner.call_count, 2)
        self.assertNotIn('private', output.getvalue())
        self.assertNotIn('PBX ', output.getvalue())
        report = json.loads(output.getvalue())['provisionerFailureDiagnostics']
        self.assertEqual(report['journalWindowHours'], 24)
        self.assertEqual(report['journalLineLimit'], 50000)
        self.assertTrue(report['readOnly'])
        self.assertEqual(report['callsPlaced'], 0)
        self.assertFalse(report['configurationChanged'])
        return report

    def test_structured_events_survive_noise_and_quarantine(self):
        prefix = 'PBX failure v1 2026-11-19T03:49:00.000Z '
        entries = [(100, prefix + 'expiry apply asterisk_reload_failed'),
                   (99, prefix + 'expiry rollback asterisk_dialplan_unverified')]
        entries.extend([(0, prefix + 'expiry timer provisioner_quarantined')] * 45000)
        entries.extend([(0, prefix + 'expiry apply unknown password=private'),
                        (0, prefix + 'expiry apply secret'),
                        (0, prefix + 'device_private apply unknown')])
        report = self.capture_report(entries)
        self.assertEqual([e['code'] for e in report['initialFailureStages']],
                         ['asterisk_reload_failed', 'asterisk_dialplan_unverified'])
        self.assertTrue(report['quarantineObserved'])
        self.assertEqual(report['initialFailureStages'][0]['phase'], 'apply')
        truncated = self.capture_report(entries[:2] + [(0, prefix + 'expiry timer provisioner_quarantined')] * 50000)
        self.assertFalse(truncated['initialFailureObserved'])

    def test_capture_retains_initiating_failure_at_daily_baseline_with_margin(self):
        cause = 'PBX expired-credential revocation stage: asterisk_rollback_failed'
        entries = [(86399, cause)]
        for elapsed in range(5, 86401, 5):
            entries.extend([(86400 - elapsed, 'PBX expired-credential revocation stage: provisioner_quarantined'),
                            (86400 - elapsed, 'PBX expired-credential revocation failed; investigate immediately.')])
            if elapsed % 60 == 0:
                entries.append((86400 - elapsed, 'PBX ownership/runtime reconciliation failed: provisioner_quarantined'))
        self.assertEqual(len(entries), 36001)
        # Demonstrate why the old tail loses the cause, then add 25% noise margin.
        self.assertNotIn(cause, [line for _, line in entries[-20000:]])
        entries.extend([(0, 'PBX ownership/runtime reconciliation failed: unknown password=private')] * 9000)
        report = self.capture_report(entries)
        self.assertTrue(report['initialFailureObserved'])
        self.assertEqual(report['initialFailureStages'], [{'stage': 'revocation', 'code': 'asterisk_rollback_failed'}])
        self.assertTrue(report['quarantineObserved'])
        self.assertEqual(len(report['recentStages']), 20)

    def test_capture_over_limit_explicitly_reports_absent_initial_evidence(self):
        entries = [(100, 'PBX expired-credential revocation stage: asterisk_rollback_failed')]
        entries.extend([(0, 'PBX expired-credential revocation stage: provisioner_quarantined')] * 50000)
        report = self.capture_report(entries)
        self.assertTrue(report['journalRead'])
        self.assertTrue(report['quarantineObserved'])
        self.assertFalse(report['initialFailureObserved'])
        self.assertEqual(report['initialFailureStages'], [])

    def test_capture_excludes_failures_outside_time_window(self):
        report = self.capture_report([(86401, 'PBX expired-credential revocation stage: asterisk_rollback_failed'),
                                      (0, 'PBX expired-credential revocation stage: provisioner_quarantined')])
        self.assertFalse(report['initialFailureObserved'])
        self.assertEqual(report['initialFailureStages'], [])

    def test_failed_capture_does_not_treat_partial_stdout_as_evidence(self):
        report = self.capture_report([(0, 'PBX expired-credential revocation stage: asterisk_rollback_failed')], journal_status=1)
        self.assertFalse(report['journalRead'])
        self.assertFalse(report['initialFailureObserved'])
        self.assertEqual(report['initialFailureStages'], [])
        self.assertEqual(report['recentStages'], [])

    def test_initial_failure_survives_repeated_quarantine_events(self):
        journal = '\n'.join(['PBX expired-credential revocation stage: asterisk_rollback_failed'] +
                            ['PBX expired-credential revocation stage: provisioner_quarantined',
                             'PBX ownership/runtime reconciliation failed: provisioner_quarantined'] * 600)
        report = m.failure_stages(journal)
        self.assertEqual(report['initialFailureStages'], [{'stage': 'revocation', 'code': 'asterisk_rollback_failed'}])
        self.assertTrue(report['initialFailureObserved'])
        self.assertEqual(len(report['recentStages']), 20)

    def test_no_initiating_failure_is_explicit_not_invented(self):
        report = m.failure_stages('PBX expired-credential revocation stage: provisioner_quarantined')
        self.assertFalse(report['initialFailureObserved'])
        self.assertEqual(report['initialFailureStages'], [])

    def test_initial_failures_are_deduplicated_and_redacted(self):
        journal = '\n'.join(['PBX expired-credential revocation stage: asterisk_rollback_failed'] * 500 +
                            ['PBX ownership/runtime reconciliation failed: unknown password=private'])
        report = m.failure_stages(journal)
        self.assertEqual(len(report['initialFailureStages']), 1)
        self.assertNotIn('private', str(report))

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

