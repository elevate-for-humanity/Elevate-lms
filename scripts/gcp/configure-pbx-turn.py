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

def main():
    if os.geteuid() != 0:
        raise ValueError('root_required')
    payload = json.load(sys.stdin)
    image = payload['image']
    if not re.fullmatch(r'coturn/coturn@sha256:[a-f0-9]{64}', image):
        raise ValueError('unapproved_relay_image')
    content = configuration(payload['secret'], payload['privateIp'])
    pbx = json.loads(run(['docker','inspect','pbx_asterisk_1']).stdout)[0]
    if not pbx['State']['Running']:
        raise ValueError('existing_pbx_not_running')
    existing = run(['docker','inspect',NAME], False)
    if existing.returncode == 0:
        current = json.loads(existing.stdout)[0]
        if CONFIG.is_symlink() or not CONFIG.is_file() or CONFIG.read_text() != content or current['Config']['Image'] != image or not current['State']['Running']:
            raise ValueError('existing_relay_requires_review_no_rotation_performed')
    else:
        if CONFIG.exists() and (CONFIG.is_symlink() or CONFIG.read_text() != content):
            raise ValueError('existing_relay_configuration_requires_review')
        for kind in [socket.SOCK_STREAM, socket.SOCK_DGRAM]:
            with socket.socket(socket.AF_INET,kind) as probe:
                probe.bind((payload['privateIp'],3478))
        run(['docker','pull',image])
        CONFIG.parent.mkdir(mode=0o700,parents=True,exist_ok=True)
        CONFIG.write_text(content)
        os.chown(CONFIG,0,65534)
        os.chmod(CONFIG,0o640)
        run(['docker','run','-d','--name',NAME,'--restart=unless-stopped','--network=host',
             '--user=65534:65534','--read-only','--cap-drop=ALL','--security-opt=no-new-privileges',
             '--pids-limit=64','--memory=256m','--cpus=0.5',
             '--tmpfs','/tmp:rw,noexec,nosuid,size=16m,uid=65534,gid=65534',
             '--tmpfs','/var/lib/coturn:rw,noexec,nosuid,size=8m,uid=65534,gid=65534',
             '--mount',f'type=bind,source={CONFIG},target=/etc/coturn/turnserver.conf,readonly',
             '--entrypoint','turnserver',image,'-c','/etc/coturn/turnserver.conf'])
    for attempt in range(20):
        try:
            with socket.create_connection((payload['privateIp'],3478),timeout=1):
                break
        except OSError:
            time.sleep(1)
    else:
        raise ValueError('relay_listener_not_ready')
    after = json.loads(run(['docker','inspect','pbx_asterisk_1']).stdout)[0]
    if after['Id'] != pbx['Id'] or after['Image'] != pbx['Image'] or not after['State']['Running']:
        raise ValueError('pbx_identity_changed_during_relay_install')
    print(json.dumps({'relayInstalled':True,'pbxContainerPreserved':True,'peerAccess':'owned-pbx-only','authenticationRequired':True}))

if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        safe = str(error) if isinstance(error,ValueError) and re.fullmatch(r'[a-z_]+',str(error)) else 'protected_relay_install_failed'
        print(json.dumps({'result':'FAIL','reason':safe}))
        sys.exit(1)
