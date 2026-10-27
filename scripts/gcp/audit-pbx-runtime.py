#!/usr/bin/env python3
"""Read-only remote PBX audit. Never emit CLI/config contents or caller details."""
import json
import http.client
from pathlib import Path
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


def pwa_operator_configured(output):
    """Verify generated operator routing, including the guarded live-contact form."""
    if not output or not re.search(r"^\s*'0'\s*=>\s*1\.\s*Set\(PWA_CONTACTS=\)", output, re.M):
        return False
    if 'elevate-pwa-extensions' not in output or 'Return(' not in output:
        return False
    if 'Set(DIALSTATUS=CHANUNAVAIL)' in output and 'Dial(' not in output:
        return True
    # The provisioner uses ExecIf to guard every temporary device lease.
    # Require both real SIP contact resolution and bounded dialing.
    return bool(re.search(r'PJSIP_DIAL_CONTACTS\(pwa-[a-f0-9]{40}\)', output)
                and re.search(r'Dial\(\$\{PWA_CONTACTS\},\d+\)', output)
                and ('PWA_DEVICE_CONTACTS' in output or 'PWA_CONTACTS' in output))



def operator_alias_extension(output):
    """Extract only a concrete three-digit delegated operator route."""
    match = re.search(r"^\s*'0'\s*=>\s*1\.\s*Gosub\(elevate-pwa-extensions,([1-9][0-9]{2}),1\)", output or '', re.M)
    return match.group(1) if match else None


def delegated_operator_configured(operator_output, target_output):
    """Require an explicit operator alias AND a usable generated target route.

    Asterisk's provisioner maps operator 0 to the administrator's assigned
    extension when no dedicated 0 device exists. Merely seeing Gosub is not
    sufficient: the destination must have guarded PJSIP dialing or an explicit
    unavailable fallback. This is configuration evidence, not call acceptance.
    """
    if not operator_output or not target_output:
        return False
    extension = operator_alias_extension(operator_output)
    if not extension or 'Return(' not in operator_output:
        return False
    expected = r"^\s*'" + extension + r"'\s*=>\s*1\.\s*Set\(PWA_CONTACTS=\)"
    if not re.search(expected, target_output, re.M):
        return False
    normalized = re.sub(expected, "'0' => 1. Set(PWA_CONTACTS=)", target_output, count=1, flags=re.M)
    return pwa_operator_configured(normalized)


def operator_route_reason(operator_output, target_output):
    """Return only fixed diagnostic labels; never emit dialplan or device details."""
    if operator_output is None:
        return 'operator_dialplan_unavailable'
    if pwa_operator_configured(operator_output):
        return 'direct_route_verified'
    if operator_alias_extension(operator_output):
        return ('delegated_route_verified' if delegated_operator_configured(operator_output, target_output)
                else 'delegated_target_unverified')
    if re.search(r"^\s*'0'\s*=>\s*1\.", operator_output, re.M):
        return 'generated_route_invalid'
    return 'generated_route_absent'


def mailbox_count(output):
    # Asterisk 20 emits this sentence instead of a numeric summary when empty.
    if re.search(r'^There are no voicemail users currently defined\.?$', output or '', re.M):
        return 0
    match = re.search(r'(\d+)\s+voicemail users? configured', output or '', re.I)
    return int(match[1]) if match else None


def carrier_inventory(transports, endpoints):
    """Return protocol/bind and carrier-presence evidence, never auth or device IDs."""
    rows = []
    for line in (transports or '').splitlines():
        match = re.fullmatch(r'\s*Transport:\s+[A-Za-z0-9_.-]+\s+(udp|tcp|tls|ws|wss)\s+\d+\s+\d+\s+([0-9.:[\]]+:\d+)\s*', line)
        if match:
            rows.append({'protocol': match[1], 'bind': match[2]})
    names = re.findall(r'^\s*Endpoint:\s+([A-Za-z0-9_.-]+)(?:[ /]|$)', endpoints or '', re.M)
    return {'result': 'PASS' if transports is not None and endpoints is not None else 'BLOCKED',
            'evidence': {'transports': rows, 'transport_inventory_parsed': bool(rows),
                         'twilio_endpoint_present': any('twilio' in name.lower() for name in names),
                         'telnyx_endpoint_present': any('telnyx' in name.lower() for name in names),
                         'scope': 'configuration_only; carrier_calls_not_tested'}}


def service_state(output):
    """Whitelist state labels. Never return unit Environment, command lines or errors."""
    if output is None:
        return {'result': 'BLOCKED', 'evidence': {'reason': 'unit_state_unavailable'}}
    allowed = {
        'LoadState': {'loaded', 'not-found', 'error', 'masked', 'bad-setting', 'merged', 'stub'},
        'ActiveState': {'active', 'reloading', 'inactive', 'failed', 'activating', 'deactivating', 'maintenance', 'refreshing'},
        'SubState': {'running', 'dead', 'failed', 'exited', 'start', 'stop', 'auto-restart', 'start-pre', 'start-post', 'stop-sigterm', 'stop-post'},
    }
    raw = dict(line.split('=', 1) for line in output.splitlines() if '=' in line)
    states = {key: raw.get(key) if raw.get(key) in values else 'unknown' for key, values in allowed.items()}
    ready = states == {'LoadState': 'loaded', 'ActiveState': 'active', 'SubState': 'running'}
    result = 'PASS' if ready else ('BLOCKED' if 'unknown' in states.values() else 'FAIL')
    return {'result': result, 'evidence': {**states, 'scope': 'systemd_process_only; listener_and_call_checks_separate'}}


def runtime_files(paths, exists=lambda p: Path(p).is_file()):
    # Presence only: no environment/config contents or secret values are read.
    try:
        present = {name: bool(exists(filename)) for name, filename in paths.items()}
        return {'result': 'PASS' if all(present.values()) else 'FAIL', 'evidence': present}
    except OSError:
        return {'result': 'BLOCKED', 'evidence': {'reason': 'runtime_file_presence_unavailable'}}


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
    direct_operator = pwa_operator_configured(generated)
    alias_extension = operator_alias_extension(generated) if not direct_operator else None
    target = cli('dialplan show ' + alias_extension + '@elevate-pwa-extensions') if alias_extension else None
    configured = direct_operator or delegated_operator_configured(generated, target)
    record('PWA_OPERATOR_CONFIGURATION', configured, {'scope': 'configuration_only; live call acceptance separate',
          'reason_code': operator_route_reason(generated, target)})
    count = mailbox_count(cli('voicemail show users'))
    checks['VOICEMAIL_CONFIGURATION'] = {
        'result': 'BLOCKED' if count is None else ('PASS' if count > 0 else 'FAIL'),
        'evidence': {'configured_mailboxes': count}}
    checks['VM_SECRET_MANAGER_SCOPE'] = vm_secret_scope()
    services = {
        'PWA_PROVISIONER': ('elevate-pbx-provisioner.service', '/opt/elevate-pbx/provisioner/server.mjs', '/etc/elevate-pbx/provisioner.conf'),
        'PARIS_TURN': ('elevate-paris-turn.service', '/opt/elevate-pbx/paris/launch.mjs', '/etc/elevate-pbx/paris.conf'),
        'PARIS_GATEWAY': ('elevate-paris-gateway.service', '/opt/elevate-pbx/paris/launch.mjs', '/etc/elevate-pbx/paris.conf'),
    }
    for name, (unit, entrypoint, environment) in services.items():
        checks[name + '_UNIT'] = service_state(command('systemctl', 'show', unit, '--no-pager',
                                                     '--property=LoadState,ActiveState,SubState'))
        checks[name + '_FILES'] = runtime_files({'entrypoint': entrypoint, 'environment_file': environment})
    node_present = Path('/usr/bin/node').is_file()
    node_version = command('/usr/bin/node', '--version') if node_present else None
    node_match = re.fullmatch(r'v([0-9]+)\.[0-9]+\.[0-9]+\s*', node_version or '')
    checks['NODE_RUNTIME'] = {'result': ('PASS' if int(node_match[1]) >= 22 else 'FAIL') if node_match else ('BLOCKED' if node_present else 'FAIL'),
                              'evidence': {'binary_present': node_present, 'major_version': int(node_match[1]) if node_match else None}}
    checks['PWA_PROVISIONER_LISTENER'] = private_listener(8090, '/internal/pbx/devices')
    checks['PARIS_TURN_LISTENER'] = private_listener(8091, '/internal/paris/turn')
    endpoints = cli('pjsip show endpoints')
    checks['CARRIER_CONFIGURATION'] = carrier_inventory(cli('pjsip show transports'), endpoints)
    pwa = re.findall(r'Endpoint:\s+(pwa-[0-9a-f]{40})(?:[ /]|$)', endpoints or '', re.M)
    secure = 0
    for endpoint in pwa[:100]:
        details = cli('pjsip show endpoint ' + endpoint) or ''
        if all(re.search(pattern, details) for pattern in [r'media_encryption\s*:\s*dtls\s',
                r'ice_support\s*:\s*true\s', r'rtcp_mux\s*:\s*true\s', r'use_avpf\s*:\s*true\s']):
            secure += 1
    # Device credentials are leased for ten minutes and removed after expiry.
    # An idle fleet with zero endpoints is not evidence that provisioned
    # endpoints are insecure; it is also not evidence of registration success.
    checks['SECURE_PWA_ENDPOINTS'] = {
        'result': ('NOT TESTED' if len(pwa) == 0 and endpoints is not None else
                   'PASS' if 0 < len(pwa) <= 100 and secure == len(pwa) else
                   'BLOCKED' if endpoints is None else 'FAIL'),
        'evidence': {'endpoint_count': len(pwa), 'secure_profiles': secure,
                     'scope': 'ephemeral_lease_snapshot; provision_and_register_for_acceptance'}}
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
