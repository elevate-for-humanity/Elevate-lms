#!/usr/bin/env python3
"""Start existing private phone services without modifying carrier routing or configuration."""
import http.client
import json
import re
import subprocess
import time

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
        raise ValueError('private_services_not_healthy')
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
    print(json.dumps(report))
    raise SystemExit(0 if report['result']=='PASS' else 1)
