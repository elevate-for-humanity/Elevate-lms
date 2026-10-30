#!/usr/bin/env python3
"""Update only the idle, reviewed PWA provisioner. Never restart Asterisk."""
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.request

OLD = '6716190e3c4ef88dc9ca08440ba68042d75d063fda0d690033d5f8ff5c222f88'
PREVIOUS = '175c9ee20ce1f949ff651b6b2b4460fa1827b79c56f772d6447cfa66f2ad8489'
NATIVE = '57991094fce9d5992573429661eff8e0bb7e865a970f6025b38f6bd02655fade'
REVIEWED_PREVIOUS = '5632d72f704f20b476a2248187197f5738216468250fcdd08256d88e146b8c4c'
EMPTY_BOOTSTRAP_PREVIOUS = 'ba1f4f812ba025449240a51d15c5092ef626447e1b1ad0a97ccf44f661503dea'
REVIEWED_RUNTIME_LOGGING = '1301b77799d6c4f158e19391658579b6db8c57852e0e2193fae4c1e740aab058'
NEW = '087a160226a4aaff8057acaf0525961a1301c989076460bdb1fc92bae3d21257'
TARGET = Path('/opt/elevate-pbx/provisioner/server.mjs')
ROOT = Path('/opt/elevate-pbx/repo/infra/pbx/asterisk/elevate-webrtc')
UNIT = 'elevate-pbx-provisioner.service'
EXPECTED_UID = 0
STAGE = Path('/tmp')
BACKUPS = Path('/var/lib/elevate-pbx/rollback')

def run(args):
    r = subprocess.run(args, capture_output=True, text=True, timeout=25)
    if r.returncode:
        raise ValueError('provisioner_command_failed')
    return r.stdout

def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def require_idle(calls, endpoints, records):
    if not re.search(r'^0 active calls?\s*$', calls, re.M):
        raise ValueError('active_call_or_unverified_state')
    if re.search(r'^\s*Endpoint:\s+pwa-[a-f0-9]+', endpoints, re.M) or records != []:
        raise ValueError('existing_pwa_devices_require_review')

def listener():
    try:
        urllib.request.urlopen(urllib.request.Request('http://127.0.0.1:8090/internal/pbx/devices', data=b'{}', headers={'Content-Type': 'application/json'}), timeout=3)
    except urllib.error.HTTPError as e:
        return e.code == 401
    except Exception:
        return False
    return False

def healthy():
    return run(['systemctl', 'is-active', UNIT]).strip() == 'active' and listener()

def repair(source, revision):
    if not re.fullmatch('[a-f0-9]{40}', revision) or source != STAGE / ('elevate-provisioner-' + revision + '.mjs'):
        raise ValueError('provisioner_source_path_unverified')
    for path in [source, TARGET]:
        if path.is_symlink() or not path.is_file() or (path == TARGET and (path.stat().st_uid != EXPECTED_UID or path.stat().st_mode & 0o022)):
            raise ValueError('provisioner_file_ownership_unverified')
    if digest(source) != NEW or digest(TARGET) not in [OLD, PREVIOUS, NATIVE, REVIEWED_PREVIOUS, EMPTY_BOOTSTRAP_PREVIOUS, REVIEWED_RUNTIME_LOGGING, NEW]:
        print(json.dumps({'provisionerSourceReview': {'candidateSha256': digest(source),
              'currentSha256': digest(TARGET), 'expectedCandidateSha256': NEW}}), flush=True)
        raise ValueError('provisioner_source_requires_review')
    run(['/usr/bin/node', '--check', str(source)])
    records_path = ROOT / 'current' / 'state.json'
    records = json.loads(records_path.read_text()) if records_path.exists() else []
    cli = lambda command: run(['docker', 'exec', 'pbx_asterisk_1', 'asterisk', '-rx', command])
    require_idle(cli('core show channels count'), cli('pjsip show endpoints'), records)
    available = lambda output: bool(output.strip()) and not re.search(r'no such|not found', output, re.I)
    builtin = available(cli('core show help module reload'))
    print(json.dumps({'provisionerReloadPreflight': {'builtinReloadAvailable': builtin,
          'optionalPjsipAliasAvailable': available(cli('core show help pjsip reload'))}}), flush=True)
    if not builtin:
        raise ValueError('builtin_reload_unavailable')
    if digest(TARGET) == NEW:
        if not healthy():
            raise ValueError('updated_provisioner_health_requires_review')
        return {'result': 'PASS', 'changed': False, 'sourceSha256': NEW, 'carrierRoutingChanged': False}
    backup = BACKUPS / ('provisioner-' + revision)
    backup.mkdir(mode=0o700, parents=True, exist_ok=False)
    shutil.copy2(TARGET, backup / 'server.mjs')
    original = TARGET.stat()
    original_digest = digest(TARGET)
    try:
        # ExecStopPost starts a fresh Node process from this file. Stage the
        # verified replacement first so cleanup uses the built-in reload command.
        with tempfile.NamedTemporaryFile(dir=TARGET.parent, delete=False) as output:
            output.write(source.read_bytes())
            replacement = Path(output.name)
        os.chown(replacement, original.st_uid, original.st_gid)
        replacement.chmod(original.st_mode & 0o777)
        os.replace(replacement, TARGET)
        run(['systemctl', 'stop', UNIT])
        # ExecStopPost invalidates managed credentials. Wait for asynchronous
        # removal before starting a fresh lease reconciler.
        for attempt in range(12):
            if not re.search(r'^\s*Endpoint:\s+pwa-[a-f0-9]+', cli('pjsip show endpoints'), re.M):
                break
            time.sleep(.25)
        else:
            raise ValueError('stale_pwa_endpoints_remain')
        run(['systemctl', 'start', UNIT])
        for attempt in range(20):
            try:
                if healthy() and digest(TARGET) == NEW:
                    return {'result': 'PASS', 'changed': True, 'sourceSha256': NEW,
                            'service': UNIT, 'revision': revision, 'asteriskRestarted': False, 'carrierRoutingChanged': False,
                            'authenticatedAcceptance': 'PENDING'}
            except Exception:
                pass
            time.sleep(.5)
        raise ValueError('updated_provisioner_listener_unverified')
    except Exception:
        try:
            run(['systemctl', 'stop', UNIT])
        except Exception:
            if run(['systemctl', 'show', UNIT, '--property=MainPID', '--value']).strip() != '0':
                raise ValueError('provisioner_rollback_unverified')
        shutil.copy2(backup / 'server.mjs', TARGET)
        os.chown(TARGET, original.st_uid, original.st_gid)
        run(['systemctl', 'start', UNIT])
        for attempt in range(20):
            try:
                if healthy() and digest(TARGET) == original_digest:
                    raise ValueError('provisioner_upgrade_rolled_back')
            except ValueError as error:
                if str(error) == 'provisioner_upgrade_rolled_back':
                    raise
            time.sleep(.5)
        raise ValueError('provisioner_rollback_unverified')

if __name__ == '__main__':
    try:
        report = repair(Path(sys.argv[1]), sys.argv[2])
    except Exception as e:
        known = {'provisioner_source_path_unverified', 'provisioner_file_ownership_unverified',
                 'provisioner_source_requires_review', 'active_call_or_unverified_state',
                 'existing_pwa_devices_require_review', 'updated_provisioner_health_requires_review',
                 'provisioner_upgrade_rolled_back', 'provisioner_rollback_unverified', 'builtin_reload_unavailable'}
        code = str(e) if isinstance(e, ValueError) and str(e) in known else 'provisioner_repair_unavailable'
        report = {'result': 'BLOCKED', 'code': code, 'carrierRoutingChanged': False}
    print(json.dumps(report))
    raise SystemExit(0 if report['result'] == 'PASS' else 1)
