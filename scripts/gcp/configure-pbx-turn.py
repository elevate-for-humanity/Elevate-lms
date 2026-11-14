#!/usr/bin/env python3
"""Install an authenticated PBX-only media relay alongside the existing PBX."""
import hashlib
import ipaddress
import json
import os
from pathlib import Path
import re
import socket
import subprocess
import sys
import time

NAME = 'elevate-pbx-turn'
CONFIG = Path('/etc/elevate-pbx/turnserver.conf')
PHASE = 'identity'

def configuration(secret, private_ip):
    if not re.fullmatch(r'[a-f0-9]{64}', secret):
        raise ValueError('invalid_relay_secret')
    address = ipaddress.ip_address(private_ip)
    if address.version != 4 or not address.is_private or address.is_loopback:
        raise ValueError('invalid_pbx_private_address')
    return f'''# Managed Elevate PBX-only TURN relay
listening-port=3478
listening-ip={address}
relay-ip={address}
external-ip=107.178.216.162/{address}
realm=phone.elevateforhumanity.org
server-name=phone.elevateforhumanity.org
fingerprint
use-auth-secret
static-auth-secret={secret}
min-port=49160
max-port=49259
user-quota=4
total-quota=128
max-bps=64000
bps-capacity=4096000
stale-nonce=600
no-cli
no-tls
no-dtls
no-tcp-relay
no-multicast-peers
no-dynamic-ip-list
denied-peer-ip=0.0.0.0-255.255.255.255
denied-peer-ip=::-ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff
allowed-peer-ip={address}
allowed-peer-ip=107.178.216.162
log-file=stdout
simple-log
pidfile=/tmp/turnserver.pid
'''

def run(args, required=True):
    result = subprocess.run(args, capture_output=True, text=True, timeout=180)
    if required and result.returncode:
        raise ValueError('relay_container_operation_failed')
    return result

def relay_diagnostics(content):
    state = run(['docker','inspect',NAME], False)
    if state.returncode:
        return
    current = json.loads(state.stdout)[0]
    result = run(['docker','logs','--tail=80',NAME], False)
    logs = result.stdout + result.stderr
    errors = [line.lower() for line in logs.splitlines() if re.search(r'error|unknown|invalid|permission|cannot|failed',line,re.I)]
    keys = [line.split('=')[0] for line in content.splitlines() if line and not line.startswith('#')]
    private_value = next(line.split('=',1)[1] for line in content.splitlines() if line.startswith('static-auth-secret='))
    safe_logs = []
    for line in logs.splitlines()[-35:]:
        if re.search(r'secret|password|credential|authorization',line,re.I):
            continue
        line = line.replace(private_value,'[redacted]')
        line = re.sub(r'\b[a-fA-F0-9]{32,}\b','[redacted]',line)
        safe_logs.append(line[:400])
    print(json.dumps({'relayDiagnostics':{'running':current['State']['Running'],'exitCode':current['State']['ExitCode'],
        'oomKilled':current['State'].get('OOMKilled',False),'startupLogs':safe_logs,
        'permissionDenied':bool(re.search('permission denied',logs,re.I)),
        'optionNamesInErrors':[key for key in keys if any(key in line for line in errors)]}}))

def main():
    global PHASE
    if os.geteuid() != 0:
        raise ValueError('root_required')
    payload = json.load(sys.stdin)
    image = payload['image']
    if not re.fullmatch(r'coturn/coturn@sha256:[a-f0-9]{64}', image):
        raise ValueError('unapproved_relay_image')
    content = configuration(payload['secret'], payload['privateIp'])
    # The upstream binary has a low-port file capability. Our relay only uses
    # high ports, so remove that metadata by a byte-verified copy in a derived
    # image. Keep cap-drop=ALL, no-new-privileges and the non-root runtime user.
    PHASE = 'least_privilege_image'
    run(['docker','pull',image])
    dockerfile = (f'FROM {image}\nUSER 0\n'
                  'RUN sha256sum /usr/bin/turnserver > /tmp/turnserver.sha256 '
                  '&& cp /usr/bin/turnserver /usr/bin/turnserver.nocap '
                  '&& mv /usr/bin/turnserver.nocap /usr/bin/turnserver '
                  '&& sha256sum -c /tmp/turnserver.sha256 && rm /tmp/turnserver.sha256\n'
                  'USER 65534:65534\n')
    built = subprocess.run(['docker','build','--network=none','--label','elevate.upstream='+image,
                            '-t','elevate-pbx-turn:4.18.0-nocaps','-'],input=dockerfile,capture_output=True,text=True,timeout=180)
    if built.returncode:
        raise ValueError('least_privilege_image_build_failed')
    server_image = json.loads(run(['docker','image','inspect','elevate-pbx-turn:4.18.0-nocaps']).stdout)[0]['Id']
    pbx = json.loads(run(['docker','inspect','pbx_asterisk_1']).stdout)[0]
    if not pbx['State']['Running']:
        raise ValueError('existing_pbx_not_running')
    existing = run(['docker','inspect',NAME], False)
    if existing.returncode == 0:
        current = json.loads(existing.stdout)[0]
        if CONFIG.is_symlink() or not CONFIG.is_file() or CONFIG.read_text() != content or current['Config']['Image'] not in [image,server_image]:
            relay_diagnostics(content)
            raise ValueError('existing_relay_requires_review_no_rotation_performed')
        if current['Config']['Image'] == image:
            logs = run(['docker','logs','--tail=80',NAME],False)
            if 'exec /usr/bin/turnserver: operation not permitted' not in logs.stdout+logs.stderr or current.get('RestartCount',0)<1:
                raise ValueError('unrecognized_existing_relay_requires_review')
            backup = Path('/var/lib/elevate-pbx/turn-startup-failure.log')
            backup.write_text(logs.stdout+logs.stderr)
            os.chmod(backup,0o600)
            run(['docker','rm','-f',NAME])
            existing = None
        elif not current['State']['Running']:
            relay_diagnostics(content)
            raise ValueError('existing_relay_requires_review_no_rotation_performed')
    else:
        existing = None
    if existing is None:
        if CONFIG.exists() and (CONFIG.is_symlink() or CONFIG.read_text() != content):
            raise ValueError('existing_relay_configuration_requires_review')
        PHASE = 'port_check'
        for kind in [socket.SOCK_STREAM, socket.SOCK_DGRAM]:
            with socket.socket(socket.AF_INET,kind) as probe:
                probe.bind((payload['privateIp'],3478))
        CONFIG.parent.mkdir(mode=0o700,parents=True,exist_ok=True)
        CONFIG.write_text(content)
        os.chown(CONFIG,0,65534)
        os.chmod(CONFIG,0o640)
        PHASE = 'start_relay_container'
        run(['docker','run','-d','--name',NAME,'--restart=unless-stopped','--network=host',
             '--user=65534:65534','--read-only','--cap-drop=ALL','--security-opt=no-new-privileges',
             '--pids-limit=64','--memory=256m','--cpus=0.5',
             '--tmpfs','/tmp:rw,noexec,nosuid,size=16m,uid=65534,gid=65534',
             '--tmpfs','/var/lib/coturn:rw,noexec,nosuid,size=8m,uid=65534,gid=65534',
             '--mount',f'type=bind,source={CONFIG},target=/etc/coturn/turnserver.conf,readonly',
             '--entrypoint','turnserver',server_image,'-c','/etc/coturn/turnserver.conf'])
    PHASE = 'verify_listener'
    for attempt in range(20):
        try:
            with socket.create_connection((payload['privateIp'],3478),timeout=1):
                break
        except OSError:
            time.sleep(1)
    else:
        relay_diagnostics(content)
        raise ValueError('relay_listener_not_ready')
    after = json.loads(run(['docker','inspect','pbx_asterisk_1']).stdout)[0]
    if after['Id'] != pbx['Id'] or after['Image'] != pbx['Image'] or not after['State']['Running']:
        raise ValueError('pbx_identity_changed_during_relay_install')
    probe = payload.get('probeName','')
    if not re.fullmatch(r'elevate-turn-probe-[0-9]+',probe):
        raise ValueError('trusted_probe_identity_required')
    # A temporary private UDP echo peer tests the same relay-to-PBX network
    # path used by calls. It is outside Asterisk's RTP range and expires even
    # if the runner disconnects. No public firewall port is opened for it.
    PHASE = 'private_media_probe'
    run(['docker','run','-d','--rm','--name',probe,'--network=host','--user=65534:65534',
         '--cap-drop=ALL','--security-opt=no-new-privileges','--read-only','--memory=32m','--pids-limit=16',
         '--entrypoint','timeout',image,'120','turnutils_peer','-L',payload['privateIp'],'-p','20001'])
    print(json.dumps({'relayInstalled':True,'pbxContainerPreserved':True,'peerAccess':'owned-pbx-only','authenticationRequired':True}))

if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        safe = str(error) if isinstance(error,ValueError) and re.fullmatch(r'[a-z_]+',str(error)) else 'protected_relay_install_failed'
        print(json.dumps({'result':'FAIL','reason':safe,'phase':PHASE}))
        sys.exit(1)
