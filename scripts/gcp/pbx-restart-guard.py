#!/usr/bin/env python3
"""Private VM restart guard. Emit hashes/counts only; preserve root-only rollback data."""
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import tarfile

NAMES = ['pbx_asterisk_1', 'elevate-pbx-wss-proxy']
BACKUP = Path('/var/lib/elevate-pbx/scope-repair-rollback')


def run(*args):
    result = subprocess.run(args, capture_output=True, text=True, timeout=30, check=False)
    if result.returncode:
        raise ValueError('runtime_readback_failed')
    return result.stdout


def endpoint_count(output):
    if re.search(r'^\s*No objects found\.?\s*$', output, re.M):
        return 0
    match = re.search(r'^\s*Objects found:\s*(\d+)\s*$', output, re.M)
    return int(match[1]) if match else None


def require_idle(channels, endpoints, legacy):
    calls = re.search(r'^(\d+) active calls?\s*$', channels, re.M)
    active = re.search(r'^(\d+) active channels?\s*$', channels, re.M)
    if not calls or not active or int(calls[1]) or int(active[1]):
        raise ValueError('active_calls_or_channels_not_zero')
    if endpoint_count(endpoints) != 0:
        raise ValueError('configured_endpoints_require_maintenance_review')
    if not re.search(r'^0 modules loaded\s*$', legacy, re.M):
        raise ValueError('legacy_sip_state_requires_review')


def configuration_digest(roots):
    digest = hashlib.sha256()
    for root in sorted(roots):
        p = Path(root)
        paths = [p] if p.is_file() else sorted(p.rglob('*'))
        for entry in paths:
            if entry.is_symlink():
                digest.update(str(entry).encode() + os.readlink(entry).encode())
            elif entry.is_file():
                digest.update(str(entry).encode() + entry.read_bytes())
    return digest.hexdigest()


def inspect():
    containers = json.loads(run('docker', 'inspect', *NAMES))
    roots = []
    evidence = []
    for c in containers:
        if c['Name'].lstrip('/') not in NAMES or not c['State']['Running']:
            raise ValueError('expected_container_not_running')
        if c['HostConfig']['RestartPolicy']['Name'] not in ['always', 'unless-stopped']:
            raise ValueError('container_restart_policy_requires_review')
        destination = '/etc/asterisk' if c['Name'] == '/pbx_asterisk_1' else '/etc/caddy/Caddyfile'
        mounts = [m for m in c['Mounts'] if m['Destination'] == destination and m['Type'] == 'bind']
        if len(mounts) != 1 or not mounts[0]['Source'].startswith('/opt/elevate-pbx/'):
            raise ValueError('configuration_mount_requires_review')
        roots.append(mounts[0]['Source'])
        evidence.append({'name': c['Name'], 'id': c['Id'], 'image': c['Image']})
    if len(evidence) != 2:
        raise ValueError('container_set_requires_review')
    cli = lambda cmd: run('docker', 'exec', NAMES[0], 'asterisk', '-rx', cmd)
    require_idle(cli('core show channels count'), cli('pjsip show endpoints'), cli('module show like chan_sip.so'))
    return {'containers': sorted(evidence, key=lambda c: c['name']),
            'configurationSha256': configuration_digest(roots), 'activeCalls': 0, 'endpoints': 0}, roots


def main():
    if os.geteuid() != 0 or sys.argv[1:] not in [['before'], ['after']]:
        raise ValueError('invalid_guard_invocation')
    current, roots = inspect()
    if sys.argv[1] == 'before':
        # Do not overwrite a prior rollback copy on repeat attempts.
        BACKUP.mkdir(mode=0o700, parents=True, exist_ok=True)
        archive_path = BACKUP / ('configuration-' + current['configurationSha256'] + '.tar.gz')
        if not archive_path.exists():
            with tarfile.open(archive_path, 'x:gz') as archive:
                for root in roots:
                    archive.add(root, arcname=root.lstrip('/'))
            os.chmod(archive_path, 0o600)
        (BACKUP / 'before.json').write_text(json.dumps(current))
        os.chmod(BACKUP / 'before.json', 0o600)
    else:
        previous = json.loads((BACKUP / 'before.json').read_text())
        if current != previous:
            raise ValueError('post_restart_configuration_or_container_changed')
    print('PBX_RESTART_GUARD ' + json.dumps({'result': 'PASS', **current}))


if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        code = str(error) if isinstance(error, ValueError) and re.fullmatch('[a-z_]+', str(error)) else 'restart_guard_unavailable'
        print('PBX_RESTART_GUARD ' + json.dumps({'result': 'BLOCKED', 'code': code}))
        raise SystemExit(1)
