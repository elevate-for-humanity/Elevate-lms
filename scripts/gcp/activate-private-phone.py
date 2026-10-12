#!/usr/bin/env python3
"""Start existing private phone services without modifying carrier routing or configuration."""
import http.client
import json
import re
import subprocess
import time
import os
from pathlib import Path

UNITS = ['elevate-paris-turn.service', 'elevate-pbx-provisioner.service', 'elevate-paris-gateway.service']

def command(args):
    result = subprocess.run(args, capture_output=True, text=True, timeout=30)
    if result.returncode:
        raise ValueError('private_service_command_failed')
    return result.stdout

def state(unit, run=command):
    raw = run(['systemctl','show',unit,'--property=LoadState,ActiveState,SubState'])
    values = dict(line.split('=',1) for line in raw.splitlines() if '=' in line)
    return tuple(values.get(key) for key in ['LoadState','ActiveState','SubState'])

def unused(output):
    match = re.search(r'^(\d+) active calls?\s*$', output, re.M)
    return bool(match and match[1] == '0')

def private_listener(port, route):
    connection = http.client.HTTPConnection('127.0.0.1',port,timeout=3)
    try:
        connection.request('POST',route,body='{}',headers={'Content-Type':'application/json'})
        return connection.getresponse().status == 401
    except (OSError,http.client.HTTPException):
        return False
    finally:
        connection.close()


def prepare_storage(run=command):
    values = {}
    for line in Path('/etc/elevate-pbx/provisioner.conf').read_text().splitlines():
        match = re.fullmatch(r'([A-Z_0-9]+)=(.*)',line.strip())
        if match: values[match[1]] = match[2].strip().strip('"').strip("'")
    expected = '/opt/elevate-pbx/repo/infra/pbx/asterisk/elevate-webrtc'
    if values.get('PBX_GENERATED_ROOT') != expected or values.get('PBX_ASTERISK_CONTAINER') != 'pbx_asterisk_1':
        raise ValueError('generated_storage_configuration_requires_review')
    gid_text = run(['docker','exec','pbx_asterisk_1','id','-g','asterisk']).strip()
    if not gid_text.isdigit() or values.get('PBX_ASTERISK_GID') != gid_text:
        raise ValueError('asterisk_storage_group_unverified')
    root = Path(expected)
    for parent in [root,*root.parents]:
        if parent.is_symlink() or (parent.exists() and (not parent.is_dir() or parent.stat().st_uid != 0 or parent.stat().st_mode & 0o022)):
            raise ValueError('generated_storage_ownership_requires_review')
    if not root.parent.is_dir():
        raise ValueError('asterisk_configuration_mount_missing')
    mounts = json.loads(run(['docker','inspect','pbx_asterisk_1','--format','{{json .Mounts}}']))
    if not any(mount.get('Type')=='bind' and mount.get('Source')==str(root.parent) and mount.get('Destination')=='/etc/asterisk' for mount in mounts):
        raise ValueError('asterisk_configuration_mount_unverified')
    dropin = Path('/etc/systemd/system/elevate-pbx-provisioner.service.d/runtime-storage.conf')
    body = '[Service]\nReadWritePaths='+expected+'\n'
    if dropin.is_symlink() or (dropin.exists() and dropin.read_text()!=body):
        raise ValueError('existing_storage_dropin_requires_review')
    root.mkdir(mode=0o750,exist_ok=True)
    os.chown(root,0,int(gid_text))
    dropin.parent.mkdir(mode=0o755,exist_ok=True)
    if not dropin.exists():
        with dropin.open('x') as output: output.write(body)
        dropin.chmod(0o644)
    run(['systemctl','daemon-reload'])

class ActivationFailure(ValueError):
    def __init__(self, diagnostic):
        super().__init__('private_services_not_healthy')
        self.diagnostic = diagnostic

def activate(run=command, probe=private_listener, wait=time.sleep):
    running = run(['docker','inspect','pbx_asterisk_1','--format','{{.State.Running}}']).strip()
    if running != 'true':
        raise ValueError('existing_asterisk_not_running')
    calls = run(['docker','exec','pbx_asterisk_1','asterisk','-rx','core show channels count'])
    if not unused(calls):
        raise ValueError('active_call_or_unverified_state')
    before = {unit:state(unit,run) for unit in UNITS}
    if any(value not in [('loaded','inactive','dead'),('loaded','active','running')] for value in before.values()):
        raise ValueError('existing_service_state_requires_review')
    if before['elevate-pbx-provisioner.service'] == ('loaded','inactive','dead'):
        prepare_storage(run)
    started = []
    try:
        for unit in UNITS:
            if before[unit] == ('loaded','inactive','dead'):
                run(['systemctl','start',unit])
                started.append(unit)
        for attempt in range(15):
            if all(state(unit,run) == ('loaded','active','running') for unit in UNITS) and probe(8090,'/internal/pbx/devices') and probe(8091,'/internal/paris/turn'):
                return {'result':'PASS','scope':'existing_private_services_only','startedServices':started,'carrierRoutingChanged':False,'callAcceptance':'NOT TESTED'}
            wait(1)
        diagnostics = {unit: {'state': list(state(unit,run))} for unit in UNITS}
        for unit in UNITS:
            log = run(['journalctl','-u',unit,'--since','-2 minutes','--no-pager','--output=cat'])
            diagnostics[unit]['knownStartupMarkers'] = [marker for marker in [
                'PARIS_RUNTIME_STARTUP_FAILED','PBX provisioner startup failed','EACCES','EROFS','ENOENT',
                'ERR_MODULE_NOT_FOUND','ECONNREFUSED','status=203/EXEC','status=217/USER'
            ] if marker in log]
        diagnostics['listeners'] = {'provisioner':probe(8090,'/internal/pbx/devices'),'parisTurn':probe(8091,'/internal/paris/turn')}
        raise ActivationFailure(diagnostics)
    except Exception:
        # Restore only units started by this invocation; preserve previously active services.
        for unit in reversed(started):
            run(['systemctl','stop',unit])
        raise

if __name__ == '__main__':
    try:
        report = activate()
    except Exception as error:
        report = {'result':'BLOCKED','code':str(error) if isinstance(error,ValueError) and re.fullmatch('[a-z_]+',str(error)) else 'private_activation_unavailable','carrierRoutingChanged':False}
        if isinstance(error,ActivationFailure): report['diagnostic']=error.diagnostic
    print(json.dumps(report))
    raise SystemExit(0 if report['result']=='PASS' else 1)
