#!/usr/bin/env python3
"""Validate a Twilio TLS/SRTP endpoint in an isolated container before installation.

Uses the running image and copied configuration. Never restarts the live PBX,
changes its files, attaches numbers, provisions users, or makes telephone calls.
"""
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import tempfile
import time

CONTAINER = 'pbx_asterisk_1'
ROOT = Path('/opt/elevate-pbx/repo/infra/pbx/asterisk')
NAME = 'elevate-twilio-validation'
CONFIG = '''; Managed Elevate Twilio carrier endpoint
[elevate-twilio-tls]
type=transport
protocol=tls
bind=0.0.0.0:5061
method=tlsv1_2
verify_server=yes
verify_client=no
ca_list_file=/etc/ssl/certs/ca-certificates.crt
external_signaling_address=107.178.216.162
external_media_address=107.178.216.162
local_net=127.0.0.0/8

[twilio-aor]
type=aor
contact=sip:elevate-standalone.pstn.twilio.com:5061;transport=tls

[twilio]
type=endpoint
transport=elevate-twilio-tls
aors=twilio-aor
context=elevate-twilio-in
disallow=all
allow=ulaw,alaw
media_encryption=sdes
direct_media=no
dtmf_mode=rfc4733
from_user=+14632401404
callerid=Elevate <+14632401404>
send_pai=yes
rtp_symmetric=yes
force_rport=yes
rewrite_contact=yes
'''


def run(args, required=True):
    result = subprocess.run(args, capture_output=True, text=True, timeout=30)
    if required and result.returncode:
        raise ValueError('isolated_trunk_command_failed')
    return result


def validate():
    if os.geteuid() != 0:
        raise ValueError('root_required_for_private_staging')
    live = json.loads(run(['docker', 'inspect', CONTAINER]).stdout)[0]
    mounts = [m for m in live['Mounts'] if m['Destination'] == '/etc/asterisk']
    if not live['State']['Running'] or len(mounts) != 1 or mounts[0]['Source'] != str(ROOT) or mounts[0]['Type'] != 'bind':
        raise ValueError('live_configuration_mount_requires_review')
    ca = run(['docker', 'exec', CONTAINER, 'test', '-s', '/etc/ssl/certs/ca-certificates.crt'], False)
    if ca.returncode:
        raise ValueError('trusted_carrier_ca_bundle_missing')
    if run(['docker', 'inspect', NAME], False).returncode == 0:
        raise ValueError('prior_isolated_validation_container_requires_review')
    live_cli = lambda cmd: run(['docker', 'exec', CONTAINER, 'asterisk', '-rx', cmd]).stdout
    previous = live_cli('core show channels count')
    if not re.search(r'^0 active calls?$', previous, re.M):
        raise ValueError('active_calls_require_deferred_validation')
    with tempfile.TemporaryDirectory(prefix='elevate-twilio-', dir='/var/tmp') as directory:
        staging = Path(directory) / 'asterisk'
        shutil.copytree(ROOT, staging, symlinks=False)
        os.chmod(directory, 0o700)
        pjsip = staging / 'pjsip.conf'
        original = pjsip.read_text()
        if re.search(r'^\[(twilio|twilio-aor|elevate-twilio-tls)\]', original, re.M):
            raise ValueError('existing_twilio_objects_require_review')
        (staging / 'elevate-twilio.conf').write_text(CONFIG)
        pjsip.write_text(original + '\n#include elevate-twilio.conf\n')
        created = False
        try:
            run(['docker', 'run', '-d', '--name', NAME, '--network=none', '--restart=no',
                 '-v', str(staging) + ':/etc/asterisk:ro', '--entrypoint', 'asterisk',
                 live['Image'], '-f', '-C', '/etc/asterisk/asterisk.conf'])
            created = True
            endpoint = transport = ''
            for attempt in range(15):
                endpoint = run(['docker', 'exec', NAME, 'asterisk', '-rx', 'pjsip show endpoint twilio'], False).stdout
                transport = run(['docker', 'exec', NAME, 'asterisk', '-rx', 'pjsip show transport elevate-twilio-tls'], False).stdout
                if re.search(r'media_encryption\s*:\s*sdes\b', endpoint) and re.search(r'protocol\s*:\s*tls\b', transport):
                    break
                time.sleep(1)
            else:
                raise ValueError('isolated_tls_srtp_endpoint_not_loaded')
            if not re.search(r'verify_server\s*:\s*(?:true|yes)\b', transport):
                raise ValueError('isolated_server_certificate_verification_not_enabled')
        finally:
            if created:
                run(['docker', 'rm', '-f', NAME])
    if not live_cli('core show version'):
        raise ValueError('live_pbx_readback_failed')
    return {'result': 'PASS', 'isolatedTlsSrtpEndpoint': True, 'liveConfigurationChanged': False,
            'carrierCallsMade': False, 'liveCallAcceptance': 'NOT TESTED'}


if __name__ == '__main__':
    try:
        result = validate()
    except Exception as error:
        result = {'result': 'BLOCKED', 'code': str(error) if isinstance(error, ValueError) and re.fullmatch('[a-z_]+', str(error)) else 'isolated_trunk_validation_unavailable'}
    print(json.dumps(result))
    raise SystemExit(0 if result['result'] == 'PASS' else 1)
