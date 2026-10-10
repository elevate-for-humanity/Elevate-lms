#!/usr/bin/env python3
"""Read-only remote PBX audit. Never emit CLI/config contents or caller details."""
import json
import http.client
import re
import subprocess


def command(*args):
    try:
        result = subprocess.run(args, capture_output=True, text=True, timeout=15, check=False)
        if result.returncode or re.search(r'no such command|unable to connect', result.stdout, re.I):
            return None
        return result.stdout
    except (OSError, subprocess.TimeoutExpired):
        return None


def operator_configured(output):
    return bool(output and re.search(r"^\s*'0'\s*=>\s*1\.\s*(?:Goto|Gosub|Dial)\(", output, re.M))


def mailbox_count(output):
    # Asterisk 20 emits this sentence instead of a numeric summary when empty.
    if re.search(r'^There are no voicemail users currently defined\.?$', output or '', re.M):
        return 0
    match = re.search(r'(\d+)\s+voicemail users? configured', output or '', re.I)
    return int(match[1]) if match else None


def private_listener(port, path, connect=http.client.HTTPConnection):
    """An unauthenticated request cannot provision a device or invoke a voice turn."""
    connection = connect('127.0.0.1', port, timeout=3)
    try:
        connection.request('POST', path, body='{}', headers={'Content-Type': 'application/json'})
        status = connection.getresponse().status
        return {'result': 'PASS' if status == 401 else 'FAIL',
                'evidence': {'http_status': status, 'scope': 'unauthenticated_listener_only'}}
    except (OSError, http.client.HTTPException):
        return {'result': 'BLOCKED', 'evidence': {'reason': 'listener_unreachable'}}
    finally:
        connection.close()


def vm_secret_scope(connect=http.client.HTTPConnection):
    """Read metadata scope names only. Never request an access token or secret."""
    connection = connect('169.254.169.254', 80, timeout=3)
    try:
        connection.request('GET', '/computeMetadata/v1/instance/service-accounts/default/scopes',
                           headers={'Metadata-Flavor': 'Google'})
        response = connection.getresponse()
        if response.status != 200:
            return {'result': 'BLOCKED', 'evidence': {'reason': 'scope_metadata_unavailable'}}
        scopes = response.read(8192).decode('utf-8').splitlines()
        available = 'https://www.googleapis.com/auth/cloud-platform' in scopes
        return {'result': 'PASS' if available else 'FAIL',
                'evidence': {'cloud_platform_scope': available, 'scope': 'OAuth_scope_only; secret_IAM_separate'}}
    except (OSError, UnicodeError, http.client.HTTPException):
        return {'result': 'BLOCKED', 'evidence': {'reason': 'scope_metadata_unavailable'}}
    finally:
        connection.close()


def audit():
    checks = {}
    def record(name, passed, evidence):
        checks[name] = {'result': 'PASS' if passed else 'FAIL', 'evidence': evidence}
    running = command('docker', 'inspect', 'pbx_asterisk_1', '--format', '{{.State.Running}}')
    record('ASTERISK_RUNNING', running is not None and running.strip() == 'true', 'container_state_observed')
    cli = lambda text: command('docker', 'exec', 'pbx_asterisk_1', 'asterisk', '-rx', text)
    version_text = cli('core show version')
    version = re.search(r'\bAsterisk ([0-9]+\.[0-9]+(?:\.[0-9]+)?)', version_text or '')
    record('ASTERISK_CLI', bool(version), {'version': version[1] if version else None})
    for capability, module in [('PJSIP', 'res_pjsip.so'), ('WEBRTC', 'res_http_websocket.so'),
                               ('SRTP', 'res_srtp.so'), ('ARI', 'res_ari_channels.so'),
                               ('EXTERNAL_MEDIA_RTP', 'chan_rtp.so'), ('VOICEMAIL_MODULE', 'app_voicemail.so')]:
        output = cli('module show like ' + module)
        record(capability, bool(output and re.search(re.escape(module) + r'\s+.*\bRunning\b', output)), 'loaded_module_state')
    plan = cli('dialplan show 0@internal')
    record('OPERATOR_CONFIGURATION', operator_configured(plan), 'explicit_extension_0_required; call acceptance separate')
    generated = cli('dialplan show 0@elevate-pwa-extensions')
    record('PWA_OPERATOR_CONFIGURATION', operator_configured(generated), 'generated_operator_route_observed; fallback acceptance separate')
    count = mailbox_count(cli('voicemail show users'))
    checks['VOICEMAIL_CONFIGURATION'] = {
        'result': 'BLOCKED' if count is None else ('PASS' if count > 0 else 'FAIL'),
        'evidence': {'configured_mailboxes': count}}
    checks['VM_SECRET_MANAGER_SCOPE'] = vm_secret_scope()
    checks['PWA_PROVISIONER_LISTENER'] = private_listener(8090, '/internal/pbx/devices')
    checks['PARIS_TURN_LISTENER'] = private_listener(8091, '/internal/paris/turn')
    endpoints = cli('pjsip show endpoints')
    pwa = re.findall(r'Endpoint:\s+(pwa-[0-9a-f]{40})(?:[ /]|$)', endpoints or '', re.M)
    secure = 0
    for endpoint in pwa[:100]:
        details = cli('pjsip show endpoint ' + endpoint) or ''
        if all(re.search(pattern, details) for pattern in [r'media_encryption\s*:\s*dtls\s',
                r'ice_support\s*:\s*true\s', r'rtcp_mux\s*:\s*true\s', r'use_avpf\s*:\s*true\s']):
            secure += 1
    record('SECURE_PWA_ENDPOINTS', bool(pwa) and len(pwa) <= 100 and secure == len(pwa),
           {'endpoint_count': len(pwa), 'secure_profiles': secure})
    channels = cli('core show channels count')
    active = re.search(r'(\d+) active calls?', channels or '')
    checks['ACTIVE_CALLS'] = {'result': 'PASS' if active else 'BLOCKED',
                              'evidence': {'active_call_count': int(active[1]) if active else None}}
    for name in ['AUTHENTICATED_REGISTRATION', 'TWO_WAY_AUDIO', 'OPERATOR_CALL',
                 'PARIS_VOICE', 'VOICEMAIL_DELIVERY', 'MOBILE_PWA']:
        checks[name] = {'result': 'NOT TESTED', 'evidence': 'requires controlled live acceptance'}
    print(json.dumps({'checks': checks}, separators=(',', ':')))
    return 1 if any(row['result'] in ('FAIL', 'BLOCKED') for row in checks.values()) else 0


if __name__ == '__main__':
    raise SystemExit(audit())
