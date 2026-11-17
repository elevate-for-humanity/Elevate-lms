#!/usr/bin/env python3
"""Reviewed expired-only recovery. Preview by default; never print private state."""
import argparse
import fcntl
import hashlib
import json
import math
import os
from pathlib import Path
import re
import stat
import subprocess
import time
import uuid

UNIT = 'elevate-pbx-provisioner.service'
SOURCE = Path('/opt/elevate-pbx/provisioner/server.mjs')
ROOT = Path('/opt/elevate-pbx/repo/infra/pbx/asterisk/elevate-webrtc')
BACKUPS = Path('/var/lib/elevate-pbx/rollback')
SOURCE_SHA = '087a160226a4aaff8057acaf0525961a1301c989076460bdb1fc92bae3d21257'
PROBE_SHA = 'd01db04c092c0b41caf79da40447475f91b30e67c8abc9579cd0bdc5178a4faf'
EXPECTED_UID = 0
ENDPOINT = re.compile(r'pwa-[a-f0-9]{40}')


class Blocked(Exception):
    pass


def require(value, code):
    if not value:
        raise Blocked(code)


def digest(data):
    return hashlib.sha256(data).hexdigest()


def run(args, timeout=25):
    result = subprocess.run(args, capture_output=True, text=True, timeout=timeout)
    require(result.returncode == 0, 'command_unverified')
    return result.stdout


def cli(operation):
    output = run(['docker', 'exec', 'pbx_asterisk_1', 'asterisk', '-rx', operation])
    require(not re.search(r'no such|unable to connect|not found', output, re.I), 'asterisk_unverified')
    return output


def private_file(path):
    info = path.lstat()
    require(stat.S_ISREG(info.st_mode) and info.st_uid == EXPECTED_UID and not info.st_mode & 0o022,
            'file_ownership_unverified')
    require(info.st_size <= 1048576, 'snapshot_size_exceeded')
    return path.read_bytes()


def trusted_directory(path):
    require(path.resolve() == path, 'directory_symlink_unverified')
    info = path.lstat()
    require(stat.S_ISDIR(info.st_mode) and info.st_uid == EXPECTED_UID and not info.st_mode & 0o022,
            'directory_ownership_unverified')


def unit_properties():
    keys = ['MainPID', 'ActiveState', 'ExecStart', 'ExecStopPost', 'Restart']
    values = {key: run(['systemctl', 'show', UNIT, '--property=' + key, '--value']).strip() for key in keys}
    require(values['ActiveState'] == 'active' and re.fullmatch(r'[1-9][0-9]*', values['MainPID']),
            'active_process_unverified')
    for key, suffix in [('ExecStart', ''), ('ExecStopPost', ' --invalidate')]:
        command = '/usr/bin/node ' + str(SOURCE) + suffix
        require(values[key].count('argv[]=') == 1 and ('argv[]=' + command + ' ;') in values[key],
                'service_contract_unverified')
    require(values['Restart'] == 'on-failure', 'service_contract_unverified')
    return values


def probe(path):
    source = path.read_bytes()
    require(len(source) <= 1048576 and digest(source) == PROBE_SHA, 'probe_source_unverified')
    result = subprocess.run(['/usr/bin/python3', '-'], input=source.decode(), capture_output=True, text=True, timeout=50)
    # A failed HTTP probe deliberately exits nonzero; inspect only its fixed report.
    report = json.loads(result.stdout)
    require(report.get('credentialsCreated') is False and report.get('carrierRoutingChanged') is False,
            'probe_contract_unverified')
    return report.get('operatorProvisioningProbe', {})


def authenticated(reports):
    return all(reports.get(side, {}).get('httpStatus') == 200 and
               reports[side].get('providerVerified') is True for side in ['private', 'public'])


def idle_inventory(ids):
    calls = cli('core show channels count')
    require(re.search(r'^0 active calls?\s*$', calls, re.M) and
            re.search(r'^0 active channels?\s*$', calls, re.M), 'active_calls_or_channels')
    endpoints = cli('pjsip show endpoints')
    require(re.search(r'Objects found:\s*\d+', endpoints), 'endpoint_inventory_unverified')
    observed = []
    for line in endpoints.splitlines():
        if re.match(r'^\s*Endpoint:\s+pwa-', line):
            match = re.match(r'^\s*Endpoint:\s+(pwa-[a-f0-9]{40})(?:[/\s]|$)', line)
            require(match is not None, 'endpoint_inventory_unverified')
            observed.append(match[1])
    require(set(observed) <= set(ids), 'unknown_pwa_endpoint')
    for endpoint in observed:
        aor = cli('pjsip show aor ' + endpoint)
        rows = re.findall(r'^\s*Aor:\s+([A-Za-z0-9_-]+)\s+(\d+)\s*$', aor, re.M)
        require(len(rows) == 1 and rows[0][0] in [endpoint, endpoint[:41]] and rows[0][1] == '1',
                'aor_unverified')
        require(all(line.split(':', 1)[1].strip().startswith('<') for line in aor.splitlines()
                    if line.strip().startswith('Contact:')), 'registered_contact_requires_review')
    return observed


def inspect(probe_path, now=None):
    now = time.time() * 1000 if now is None else now
    trusted_directory(ROOT)
    source = private_file(SOURCE)
    require(digest(source) == SOURCE_SHA, 'runtime_source_unreviewed')
    properties = unit_properties()
    environment = Path('/proc/' + properties['MainPID'] + '/environ').read_bytes()
    require(len(environment) <= 1048576, 'runtime_environment_unverified')
    values = dict(item.split(b'=', 1) for item in environment.split(b'\0') if b'=' in item)
    require(values.get(b'PBX_GENERATED_ROOT') == str(ROOT).encode() and
            values.get(b'PBX_ASTERISK_CONTAINER') == b'pbx_asterisk_1', 'runtime_environment_unverified')
    current = ROOT / 'current'
    require(current.is_symlink(), 'current_generation_unverified')
    generation = str(current.readlink())
    require(re.fullmatch(r'generation-[a-f0-9]{24}', generation), 'current_generation_unverified')
    files = {}
    generations = sorted(ROOT.glob('generation-*'))
    require(0 < len(generations) <= 64, 'generation_inventory_unverified')
    for folder in generations:
        require(re.fullmatch(r'generation-[a-f0-9]{24}', folder.name), 'generation_inventory_unverified')
        trusted_directory(folder)
        require({p.name for p in folder.iterdir()} == {'state.json', 'pjsip.conf', 'extensions.conf'},
                'generation_inventory_unverified')
        for name in ['state.json', 'pjsip.conf', 'extensions.conf']:
            files[folder.name + '/' + name] = private_file(folder / name)
    require(sum(map(len, files.values())) <= 8388608, 'snapshot_size_exceeded')
    records = json.loads(files[generation + '/state.json'])
    require(isinstance(records, list) and 0 < len(records) <= 100, 'expired_inventory_unverified')
    ids = []
    for record in records:
        require(isinstance(record, dict) and isinstance(record.get('endpointId'), str) and
                ENDPOINT.fullmatch(record['endpointId']), 'stored_record_unverified')
        expiry = record.get('expiresAt')
        require(type(expiry) in [int, float] and math.isfinite(expiry) and expiry > 0,
                'stored_expiry_unverified')
        require(expiry <= now, 'live_lease_requires_review')
        ids.append(record['endpointId'])
    require(len(set(ids)) == len(ids), 'duplicate_device_unverified')
    observed = idle_inventory(ids)
    journal = run(['journalctl', '-u', UNIT, '--since', '30 seconds ago', '-n', '1000', '--no-pager', '-o', 'cat'])
    require(any(re.fullmatch(r'PBX (expired-credential revocation stage|ownership/runtime reconciliation failed): provisioner_quarantined',
                             line) for line in journal.splitlines()), 'recent_quarantine_unverified')
    reports = probe(probe_path)
    require(all(reports.get(side, {}).get('httpStatus') == 503 and
                reports[side].get('code') == 'provisioner_unavailable' for side in ['private', 'public']),
            'authenticated_quarantine_unverified')
    manifest = {'generation': generation, 'sourceSha256': digest(source), 'unit': properties,
                'files': {name: digest(data) for name, data in files.items()}, 'endpointIds': sorted(observed)}
    fingerprint = digest(json.dumps(manifest, sort_keys=True).encode())
    return {'fingerprint': fingerprint, 'leaseCount': len(ids), 'files': files,
            'source': source, 'manifest': manifest}


def snapshot(evidence):
    BACKUPS.mkdir(mode=0o700, parents=True, exist_ok=True)
    trusted_directory(BACKUPS)
    require(not BACKUPS.stat().st_mode & 0o077, 'backup_permissions_unverified')
    folder = BACKUPS / ('expired-quarantine-' + uuid.uuid4().hex)
    folder.mkdir(mode=0o700)
    payloads = {**evidence['files'], 'server.mjs': evidence['source'],
                'manifest.json': json.dumps(evidence['manifest'], sort_keys=True).encode()}
    for name, data in payloads.items():
        path = folder / name
        path.parent.mkdir(mode=0o700, parents=True, exist_ok=True)
        descriptor = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
        with os.fdopen(descriptor, 'wb') as stream:
            stream.write(data)
            stream.flush()
            os.fsync(stream.fileno())
        require(digest(private_file(path)) == digest(data), 'snapshot_verification_failed')
    for directory in [*sorted({(folder / name).parent for name in payloads}), folder, BACKUPS]:
        descriptor = os.open(directory, os.O_RDONLY | os.O_DIRECTORY)
        try:
            os.fsync(descriptor)
        finally:
            os.close(descriptor)
    return folder.name


def verify_stopped_invalidation():
    # Only called after a successful stop, including its existing invalidate hook.
    # Never excuse a failed hook: it may have failed before dialplan reload.
    for attempt in range(12):
        require(run(['systemctl', 'show', UNIT, '--property=MainPID', '--value']).strip() == '0', 'stop_unverified')
        require(not (ROOT / 'current').exists() and not (ROOT / 'current').is_symlink(), 'invalidation_unverified')
        endpoints = cli('pjsip show endpoints')
        require(re.search(r'Objects found:\s*\d+', endpoints), 'endpoint_inventory_unverified')
        if not re.search(r'^\s*Endpoint:\s+pwa-', endpoints, re.M):
            return
        if attempt < 11:
            time.sleep(0.25)
    raise Blocked('invalidation_unverified')


def recover(probe_path, expected=None):
    evidence = inspect(probe_path)
    report = {'result': 'PREVIEW', 'stateSha256': evidence['fingerprint'],
              'expiredLeaseCount': evidence['leaseCount'], 'callsPlaced': 0,
              'sourceChanged': False, 'carrierRoutingChanged': False, 'serviceChanged': False}
    if expected is None:
        return report
    require(re.fullmatch(r'[a-f0-9]{64}', expected) and expected == evidence['fingerprint'], 'reviewed_state_changed')
    report['snapshot'] = snapshot(evidence)
    # The old process is quarantined, but calls/registrations may still change.
    require(inspect(probe_path)['fingerprint'] == expected, 'reviewed_state_changed')
    idle_inventory(evidence['manifest']['endpointIds'])
    report['serviceChanged'] = True
    try:
        run(['systemctl', 'stop', UNIT])  # Retain the existing --invalidate hook.
        verify_stopped_invalidation()
        run(['systemctl', 'start', UNIT])
        # Never stop again or restore expired credentials after start: a legitimate
        # new device may register immediately. Preserve evidence on any failure.
        for _ in range(6):
            try:
                if authenticated(probe(probe_path)) and run(['systemctl', 'is-active', UNIT]).strip() == 'active':
                    report.update(result='RECOVERED', authenticatedProvisioning=True, ringingAcceptance='PENDING')
                    return report
            except Exception:
                pass
            time.sleep(1)
    except Exception:
        pass
    report.update(result='RECOVERY_UNVERIFIED', authenticatedProvisioning=False,
                  nextAction='preserve_snapshot_and_review_runtime; no_automatic_credential_restore')
    return report


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--probe', type=Path, required=True)
    parser.add_argument('--expected-state-sha256')
    args = parser.parse_args()
    require(os.geteuid() == EXPECTED_UID, 'root_required')
    # Serialize this procedure without modifying the existing service unit.
    descriptor = os.open('/run/elevate-pbx-expired-recovery.lock', os.O_CREAT | os.O_RDWR | os.O_NOFOLLOW, 0o600)
    info = os.fstat(descriptor)
    require(stat.S_ISREG(info.st_mode) and info.st_uid == EXPECTED_UID and not info.st_mode & 0o077,
            'lock_ownership_unverified')
    with os.fdopen(descriptor, 'w') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        report = recover(args.probe, args.expected_state_sha256)
    print(json.dumps(report))
    return 0 if report['result'] in ['PREVIEW', 'RECOVERED'] else 1


if __name__ == '__main__':
    try:
        raise SystemExit(main())
    except Exception as error:
        print(json.dumps({'result': 'BLOCKED', 'code': str(error) if isinstance(error, Blocked) else 'recovery_precondition_unverified',
                          'callsPlaced': 0}))
        raise SystemExit(1)

