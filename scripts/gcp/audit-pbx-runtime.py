#!/usr/bin/env python3
"""Read-only remote PBX audit. Never emit CLI/config contents or caller details."""
import json
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
    match = re.search(r'(\d+)\s+voicemail users? configured', output or '', re.I)
    return int(match[1]) if match else None


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
    record('VOICEMAIL_CONFIGURATION', count is not None and count > 0, {'configured_mailboxes': count})
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
