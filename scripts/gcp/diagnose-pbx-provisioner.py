#!/usr/bin/env python3
"""Read-only PBX failure-stage evidence. Never emit journal lines or device secrets."""
import json
from pathlib import Path
import re
import subprocess
import time

CODES = frozenset('asterisk_command_failed asterisk_endpoint_unverified asterisk_aor_unverified asterisk_dialplan_unverified asterisk_revocation_unverified asterisk_reload_failed asterisk_configuration_rejected asterisk_rollback_failed provisioner_quarantined ownership_unavailable device_authorization_unavailable phone_system_configuration_invalid invalid_stored_record invalid_generation invalid_stored_state unknown'.split())
STAGES = {'ownership/runtime reconciliation failed': 'reconciliation', 'expired-credential revocation stage': 'revocation'}
ROOT = Path('/opt/elevate-pbx/repo/infra/pbx/asterisk/elevate-webrtc')

def command(args):
    result = subprocess.run(args, capture_output=True, text=True, timeout=20)
    return result.returncode, result.stdout

def failure_stages(journal):
    events = []
    for line in journal.splitlines():
        match = re.fullmatch(r'PBX (ownership/runtime reconciliation failed|expired-credential revocation stage): ([a-z_]+)', line)
        if match and match[2] in CODES:
            event = {'stage': STAGES[match[1]], 'code': match[2]}
            if not events or events[-1] != event:
                events.append(event)
    return {'recentStages': events[-20:],
            'quarantineObserved': any(e['code'] == 'provisioner_quarantined' for e in events),
            'startupFailureObserved': 'PBX provisioner startup failed. No credentials were logged.' in journal.splitlines()}

def carrier_identity(output):
    def field(key):
        matches = re.findall(r'^\s*' + re.escape(key) + r'\s*:\s*(.*?)\s*$', output, re.M)
        return matches[0] if len(matches) == 1 else None
    caller = field('callerid')
    return {'trustInboundIdentity': field('trust_id_inbound') == 'true' or field('trust_id_inbound') == 'yes',
            'fixedCallerNumberPresent': bool(caller and re.search(r'<\+?[0-9]+>', caller)),
            'endpointObserved': bool(re.search(r'^\s*Endpoint:\s+twilio(?:[/\s]|$)', output, re.M)),
            'scope': 'configuration_only; distinct_external_caller_acceptance_required'}

def generation_summary(root=ROOT, now=None):
    now = time.time() * 1000 if now is None else now
    try:
        current = root / 'current'
        target = current.readlink()
        if not re.fullmatch(r'generation-[a-f0-9]{24}', str(target)):
            return {'state': 'invalid_generation'}
        records = json.loads((current / 'state.json').read_text())
        if not isinstance(records, list) or any(not isinstance(r, dict) or not isinstance(r.get('expiresAt'), (int, float)) for r in records):
            return {'state': 'invalid_stored_state'}
        return {'state': 'observed', 'leaseCount': len(records),
                'expiredLeaseCount': sum(r['expiresAt'] <= now for r in records),
                'pjsipIncludePresent': (current / 'pjsip.conf').is_file(),
                'dialplanIncludePresent': (current / 'extensions.conf').is_file()}
    except FileNotFoundError:
        return {'state': 'absent'}
    except Exception:
        return {'state': 'unavailable'}

def main():
    status, journal = command(['journalctl', '-u', 'elevate-pbx-provisioner.service', '--since', '2 hours ago', '-n', '500', '--no-pager', '-o', 'cat'])
    report = {'journalRead': status == 0, **failure_stages(journal if status == 0 else ''),
              'generation': generation_summary(), 'readOnly': True, 'callsPlaced': 0, 'configurationChanged': False}
    status, output = command(['docker', 'exec', 'pbx_asterisk_1', 'asterisk', '-rx', 'pjsip show endpoint twilio'])
    report['carrierIdentity'] = carrier_identity(output if status == 0 else '')
    print(json.dumps({'provisionerFailureDiagnostics': report}))
    return 0 if report['journalRead'] and report['generation']['state'] == 'observed' and report['carrierIdentity']['endpointObserved'] else 1

if __name__ == '__main__':
    try:
        raise SystemExit(main())
    except Exception:
        print(json.dumps({'provisionerFailureDiagnostics': {'error': 'diagnostic_unavailable', 'readOnly': True, 'callsPlaced': 0}}))
        raise SystemExit(1)
