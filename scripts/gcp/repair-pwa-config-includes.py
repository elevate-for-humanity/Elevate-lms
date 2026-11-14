#!/usr/bin/env python3
"""Load the owned generated PWA configuration without changing carrier contexts."""
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tempfile

BASE = Path('/opt/elevate-pbx/repo/infra/pbx/asterisk')
EXPECTED_UID = 0
BACKUPS = Path('/var/lib/elevate-pbx/rollback')
TARGETS = {'pjsip.conf': 'elevate-webrtc/current/pjsip.conf', 'extensions.conf': 'elevate-webrtc/current/extensions.conf'}
ERRORS = re.compile(r'no such (?:command|module)|unable to reload|failed to reload|reported a reload failure|does not support reloads|not properly initialized', re.I)

def run(args):
    result = subprocess.run(args, capture_output=True, text=True, timeout=25)
    if result.returncode:
        raise ValueError('pwa_include_command_failed')
    return result.stdout

def referenced(base, entry, target):
    """Follow only static includes inside the existing Asterisk config mount."""
    visited = set()
    def walk(filename):
        relative = filename.relative_to(base)
        if '..' in relative.parts or filename.is_symlink():
            raise ValueError('configuration_include_scope_requires_review')
        if relative.as_posix() == target:
            return True
        if filename in visited:
            return False
        visited.add(filename)
        if len(visited) > 128:
            raise ValueError('configuration_include_scope_requires_review')
        if not filename.is_file():
            return False
        for line in filename.read_text().splitlines():
            if re.match(r'^\s*#exec\b', line):
                raise ValueError('dynamic_configuration_requires_review')
            match = re.match(r'^\s*#(?:try)?include\s+(?:"([^"\n]+)"|([^\s;]+))\s*(?:;.*)?$', line)
            if not match:
                if re.match(r'^\s*#(?:try)?include\b', line):
                    raise ValueError('configuration_include_scope_requires_review')
                continue
            name = match[1] or match[2]
            if name.startswith('/etc/asterisk/'):
                name = name[len('/etc/asterisk/'):]
            if name.startswith('/') or '..' in Path(name).parts or not re.fullmatch(r'[A-Za-z0-9_./*?\[\]-]+', name):
                raise ValueError('configuration_include_scope_requires_review')
            if name == target:
                return True
            for nested in sorted(base.glob(name)):
                if walk(nested):
                    return True
        return False
    return walk(base / entry)

def atomic_write(filename, data, original):
    with tempfile.NamedTemporaryFile(dir=filename.parent, delete=False) as output:
        output.write(data)
        replacement = Path(output.name)
    os.chown(replacement, original.st_uid, original.st_gid)
    replacement.chmod(original.st_mode & 0o777)
    os.replace(replacement, filename)

def repair(revision):
    if not re.fullmatch('[a-f0-9]{40}', revision):
        raise ValueError('source_revision_unverified')
    cli = lambda command: run(['docker', 'exec', 'pbx_asterisk_1', 'asterisk', '-rx', command])
    calls, endpoints = cli('core show channels count'), cli('pjsip show endpoints')
    if ERRORS.search(calls) or ERRORS.search(endpoints):
        raise ValueError('asterisk_command_unverified')
    if not re.search(r'^0 active calls?\s*$', calls, re.M):
        raise ValueError('active_call_or_unverified_state')
    if re.search(r'^\s*Endpoint:\s+pwa-[a-f0-9]+', endpoints, re.M):
        raise ValueError('existing_pwa_endpoints_require_review')
    state = BASE / 'elevate-webrtc/current/state.json'
    if state.exists() and json.loads(state.read_text()) != []:
        raise ValueError('existing_pwa_devices_require_review')
    mounts = json.loads(run(['docker', 'inspect', 'pbx_asterisk_1', '--format', '{{json .Mounts}}']))
    if not any(m.get('Type') == 'bind' and m.get('Source') == str(BASE) and m.get('Destination') == '/etc/asterisk' for m in mounts):
        raise ValueError('asterisk_mount_unverified')
    for name in TARGETS:
        filename = BASE / name
        if filename.is_symlink() or not filename.is_file() or filename.stat().st_uid != EXPECTED_UID or filename.stat().st_mode & 0o022:
            raise ValueError('configuration_file_ownership_unverified')
    before = {name: referenced(BASE, name, target) for name, target in TARGETS.items()}
    print(json.dumps({'generatedPwaIncludesBefore': before}), flush=True)
    missing = [name for name, present in before.items() if not present]
    if not missing:
        return {'result': 'PASS', 'changed': False, 'generatedIncludesVerified': True, 'carrierRoutingChanged': False}
    backup = BACKUPS / ('pwa-includes-' + revision)
    backup.mkdir(parents=True, mode=0o700, exist_ok=False)
    originals = {name: ((BASE / name).read_bytes(), (BASE / name).stat()) for name in missing}
    for name in missing:
        shutil.copy2(BASE / name, backup / name)
    def reload():
        for command in ['module reload res_pjsip.so', 'dialplan reload']:
            if ERRORS.search(cli(command)):
                raise ValueError('configuration_reload_failed')
    try:
        for name, (data, original) in originals.items():
            suffix = ('\n; Owned authenticated PWA devices; carrier contexts are preserved.\n#tryinclude "' + TARGETS[name] + '"\n').encode()
            atomic_write(BASE / name, data + suffix, original)
        reload()
        if not all(referenced(BASE, name, target) for name, target in TARGETS.items()):
            raise ValueError('generated_includes_unverified')
        return {'result': 'PASS', 'changed': True, 'generatedIncludesVerified': True,
                'asteriskRestarted': False, 'carrierRoutingChanged': False, 'deviceAcceptance': 'PENDING'}
    except Exception:
        for name, (data, original) in originals.items():
            atomic_write(BASE / name, data, original)
        try:
            reload()
        except Exception:
            raise ValueError('pwa_include_rollback_unverified')
        raise ValueError('pwa_includes_rolled_back')

if __name__ == '__main__':
    try:
        report = repair(sys.argv[1])
    except Exception as error:
        known = {'source_revision_unverified', 'active_call_or_unverified_state', 'existing_pwa_endpoints_require_review',
                 'existing_pwa_devices_require_review', 'asterisk_mount_unverified', 'configuration_file_ownership_unverified',
                 'configuration_include_scope_requires_review', 'dynamic_configuration_requires_review', 'pwa_includes_rolled_back',
                 'pwa_include_rollback_unverified', 'asterisk_command_unverified'}
        code = str(error) if isinstance(error, ValueError) and str(error) in known else 'pwa_include_repair_unavailable'
        report = {'result': 'BLOCKED', 'code': code, 'carrierRoutingChanged': False}
    print(json.dumps(report))
    raise SystemExit(0 if report['result'] == 'PASS' else 1)
