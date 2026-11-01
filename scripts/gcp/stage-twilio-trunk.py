#!/usr/bin/env python3
"""Validate a Twilio TLS/SRTP endpoint in an isolated container before installation.

Uses the running image and copied configuration. Optional --install-endpoint
installs only the validated endpoint after an idle check, with rollback. A required
transport restart preserves the same container and configuration and is allowed
only with zero calls/channels and no existing user endpoints. Never attaches
numbers, provisions users, or makes telephone calls.
"""
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import tempfile
import time
import sys
import hashlib
import tarfile

CONTAINER = 'pbx_asterisk_1'
ROOT = Path('/opt/elevate-pbx/repo/infra/pbx/asterisk')
NAME = 'elevate-twilio-validation'
NETWORK = NAME + '-internal'
CONFIG = r'''; Managed Elevate Twilio carrier endpoint
[elevate-twilio-tls]
type=transport
protocol=tls
bind=0.0.0.0:5061
method=tlsv1_2
verify_server=yes
allow_wildcard_certs=yes
verify_client=no
ca_list_file=/etc/ssl/certs/ca-certificates.crt
external_signaling_address=107.178.216.162
external_media_address=107.178.216.162
local_net=127.0.0.0/8

[twilio-aor]
type=aor
contact=sip:elevate-4632401404.pstn.twilio.com:5061\;transport=tls

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
    result.stdout = re.sub(r'\x1b\[[0-?]*[ -/]*[@-~]', '', result.stdout)
    if required and result.returncode:
        raise ValueError('isolated_trunk_command_failed')
    return result


def require_idle_endpoint_restart(channels, endpoints):
    if not all(re.search(r'^0 active ' + kind + r's?$', channels, re.M) for kind in ['call', 'channel']):
        raise ValueError('active_calls_prevent_carrier_transport_restart')
    names = re.findall(r'Endpoint:\s+([A-Za-z0-9_.-]+)(?:[ /]|$)', endpoints)
    count = re.search(r'Objects found:\s*(\d+)', endpoints)
    explicitly_empty = not names and (bool(count and count[1] == '0') or bool(re.search(r'^\s*No objects found\.?\s*$', endpoints, re.M)))
    only_new_endpoint = names == ['twilio'] and bool(count and count[1] == '1')
    if not (explicitly_empty or only_new_endpoint):
        raise ValueError('existing_endpoints_prevent_carrier_transport_restart')


def configuration_digest(root):
    digest = hashlib.sha256()
    for filename in sorted(root.rglob('*')):
        digest.update(str(filename.relative_to(root)).encode())
        if filename.is_symlink(): digest.update(os.readlink(filename).encode())
        elif filename.is_file(): digest.update(filename.read_bytes())
    return digest.hexdigest()


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
        # copytree preserves modes but not numeric ownership. The image drops
        # privileges, so preserve the live Asterisk group's read permissions.
        for copied in [staging, *staging.rglob('*')]:
            source = ROOT / copied.relative_to(staging)
            info = source.stat()
            os.chown(copied, info.st_uid, info.st_gid)
        os.chmod(directory, 0o700)
        pjsip = staging / 'pjsip.conf'
        original = pjsip.read_text()
        if re.search(r'^\[(twilio|twilio-aor|elevate-twilio-tls)\]', original, re.M):
            raise ValueError('existing_twilio_objects_require_review')
        (staging / 'elevate-twilio.conf').write_text(CONFIG)
        os.chmod(staging / 'elevate-twilio.conf', pjsip.stat().st_mode & 0o777)
        os.chown(staging / 'elevate-twilio.conf', pjsip.stat().st_uid, pjsip.stat().st_gid)
        if '#include elevate-twilio.conf' not in original.splitlines():
            pjsip.write_text(original + '\n#include elevate-twilio.conf\n')
        created = False
        network_created = False
        try:
            # Asterisk needs an Ethernet interface to initialize its global EID.
            # An internal-only bridge provides one without Internet access or
            # published ports. The carrier hostname resolves only to loopback.
            run(['docker', 'network', 'create', '--internal', '--driver=bridge', NETWORK])
            network_created = True
            run(['docker', 'run', '-d', '--name', NAME, '--network=' + NETWORK, '--restart=no',
                 '--add-host', 'elevate-4632401404.pstn.twilio.com:127.0.0.1',
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
                state = json.loads(run(['docker', 'inspect', NAME]).stdout)[0]['State']
                logs = run(['docker', 'logs', '--tail=1000', NAME], False)
                combined = logs.stdout + logs.stderr
                settings = run(['docker', 'exec', NAME, 'asterisk', '-rx', 'core show settings'], False).stdout
                print(json.dumps({'isolatedDiagnostics': {
                    'running': bool(state['Running']), 'exitCode': int(state['ExitCode']),
                    'endpointObserved': bool(re.search(r'Endpoint:\s+twilio(?:[ /]|$)', endpoint)),
                    'transportObserved': bool(re.search(r'Transport:\s+elevate-twilio-tls\b', transport)),
                    'sdesObserved': bool(re.search(r'media_encryption\s*:\s*sdes\b', endpoint, re.I)),
                    'tlsObserved': bool(re.search(r'protocol\s*:\s*tls\b', transport, re.I)),
                    # These two objects were created by this script, contain no
                    # authentication credentials, and use only public carrier data.
                    'newEndpointReadback': endpoint[:1500],
                    'newTransportReadback': transport[:1500],
                    'pjsipModuleRunning': bool(re.search(r'res_pjsip\.so\s+.*\bRunning\b', run(['docker', 'exec', NAME, 'asterisk', '-rx', 'module show like res_pjsip.so'], False).stdout)),
                    'newConfigErrors': [line[-600:] for line in combined.splitlines()
                                        if 'elevate-twilio.conf' in line and re.search(r'error|warning|unable|could not', line, re.I)],
                    'objectCreationErrors': re.findall(r"Could not create an object of type '(transport|endpoint|aor)' with id '(twilio|twilio-aor|elevate-twilio-tls)'", combined),
                    'invalidOptions': re.findall(r"Could not find option suitable for category '(twilio|twilio-aor|elevate-twilio-tls)' named '([a-z_]+)'", combined),
                    'configurationPaths': re.findall(r'(?im)^\s*(Configuration (?:file|directory)):\s*(/[a-zA-Z0-9/_.-]+)\s*$', settings),
                    'newFileReadable': run(['docker', 'exec', NAME, 'test', '-r', '/etc/asterisk/elevate-twilio.conf'], False).returncode == 0,
                    'newIncludePresent': '#include elevate-twilio.conf' in pjsip.read_text(),
                    'baselineUdpTransportPresent': 'transport-udp' in run(['docker', 'exec', NAME, 'asterisk', '-rx', 'pjsip show transports'], False).stdout,
                    'originalCommentBlockBalance': original.count(';--') - original.count('--;'),
                    'mainConfigLoadError': bool(re.search(r'(?:unable to load|error parsing|could not load)[^\n]*pjsip.conf', combined, re.I)),
                    'logSignals': {name: bool(re.search(pattern, combined, re.I)) for name, pattern in {
                        'permissionDenied': 'permission denied', 'missingFile': 'no such file',
                        'configLoadError': 'unable to load|could not create|error parsing|could not find',
                        'tlsError': 'SSL error|TLS error|unable to load.*certificate',
                        'cliUnavailable': 'unable to connect to remote asterisk',
                    }.items()}}}))
                raise ValueError('isolated_tls_srtp_endpoint_not_loaded')
            if not re.search(r'verify_server\s*:\s*(?:true|yes)\b', transport, re.I):
                print(json.dumps({'newTransportVerificationReadback': transport[:2000]}))
                raise ValueError('isolated_server_certificate_verification_not_enabled')
        finally:
            if created:
                run(['docker', 'rm', '-f', NAME])
            if network_created:
                run(['docker', 'network', 'rm', NETWORK])
    if not live_cli('core show version'):
        raise ValueError('live_pbx_readback_failed')
    return {'result': 'PASS', 'isolatedTlsSrtpEndpoint': True, 'liveConfigurationChanged': False,
            'carrierCallsMade': False, 'liveCallAcceptance': 'NOT TESTED'}


def install_endpoint(root=ROOT, backup=Path('/var/lib/elevate-pbx/twilio-rollback'), execute=run):
    """Add only the validated endpoint; public number and user dialplan stay separate."""
    main = root / 'pjsip.conf'
    fragment = root / 'elevate-twilio.conf'
    if main.is_symlink() or fragment.is_symlink():
        raise ValueError('carrier_configuration_symlink_requires_review')
    previous = main.read_text()
    if fragment.exists() and fragment.read_text() != CONFIG:
        raise ValueError('existing_carrier_configuration_requires_review')
    cli = lambda text: execute(['docker', 'exec', CONTAINER, 'asterisk', '-rx', text]).stdout
    channels = cli('core show channels count')
    if not all(re.search(r'^0 active ' + kind + r's?$', channels, re.M) for kind in ['call', 'channel']):
        raise ValueError('active_calls_or_channels_require_deferred_install')
    backup.mkdir(mode=0o700, parents=True, exist_ok=True)
    if not (backup / 'pjsip.conf').exists():
        shutil.copy2(main, backup / 'pjsip.conf')
        os.chmod(backup / 'pjsip.conf', 0o600)
    existed = fragment.exists()
    restarted = False
    identity = json.loads(execute(['docker', 'inspect', CONTAINER]).stdout)[0] if execute is run else None
    try:
        fragment.write_text(CONFIG)
        os.chmod(fragment, main.stat().st_mode & 0o777)
        os.chown(fragment, main.stat().st_uid, main.stat().st_gid)
        include = '#include elevate-twilio.conf'
        if include not in previous.splitlines():
            main.write_text(previous + '\n' + include + '\n')
        cli('pjsip reload')
        endpoint = cli('pjsip show endpoint twilio')
        transport = cli('pjsip show transport elevate-twilio-tls')
        if not re.search(r'protocol\s*:\s*tls\b', transport):
            require_idle_endpoint_restart(cli('core show channels count'), cli('pjsip show endpoints'))
            expected = configuration_digest(root)
            archive = backup / ('pre-transport-restart-' + expected + '.tar.gz')
            if not archive.exists():
                with tarfile.open(archive, 'x:gz') as output:
                    output.add(root, arcname='asterisk')
                os.chmod(archive, 0o600)
            execute(['docker', 'restart', CONTAINER])
            restarted = True
            for attempt in range(30):
                time.sleep(1)
                try:
                    endpoint = cli('pjsip show endpoint twilio')
                    transport = cli('pjsip show transport elevate-twilio-tls')
                    if re.search(r'protocol\s*:\s*tls\b', transport): break
                except ValueError: pass
            if identity is not None:
                after = json.loads(execute(['docker', 'inspect', CONTAINER]).stdout)[0]
                if after['Id'] != identity['Id'] or after['Image'] != identity['Image'] or not after['State']['Running'] or configuration_digest(root) != expected:
                    raise ValueError('carrier_restart_preservation_not_confirmed')
        if not re.search(r'media_encryption\s*:\s*sdes\b', endpoint) or not re.search(r'protocol\s*:\s*tls\b', transport):
            raise ValueError('live_tls_endpoint_reload_not_confirmed')
        if not re.search(r'verify_server\s*:\s*(?:true|yes)\b', transport, re.I):
            raise ValueError('live_server_certificate_verification_not_confirmed')
    except Exception:
        main.write_text(previous)
        if not existed:
            fragment.unlink(missing_ok=True)
        try:
            if restarted:
                execute(['docker', 'restart', CONTAINER])
                for attempt in range(30):
                    time.sleep(1)
                    try:
                        if 'Asterisk' in cli('core show version'): break
                    except ValueError: pass
                else: raise ValueError('carrier_endpoint_rollback_failed')
            else: cli('pjsip reload')
        except Exception:
            raise ValueError('carrier_endpoint_rollback_failed')
        raise
    return {'result': 'PASS', 'liveTlsSrtpEndpoint': True, 'publicNumberRoutingChanged': False,
            'userDialplanChanged': False, 'carrierCallsMade': False, 'asteriskRestarted': restarted, 'liveCallAcceptance': 'NOT TESTED'}


if __name__ == '__main__':
    try:
        result = validate()
        if sys.argv[1:] == ['--install-endpoint']:
            result = install_endpoint()
        elif sys.argv[1:]:
            raise ValueError('invalid_validation_invocation')
    except Exception as error:
        result = {'result': 'BLOCKED', 'code': str(error) if isinstance(error, ValueError) and re.fullmatch('[a-z_]+', str(error)) else 'isolated_trunk_validation_unavailable'}
    print(json.dumps(result))
    raise SystemExit(0 if result['result'] == 'PASS' else 1)
