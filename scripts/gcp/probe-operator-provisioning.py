#!/usr/bin/env python3
"""Read-only authenticated operator probe. Never issue or print credentials."""
import base64
import json
from pathlib import Path
import re
import uuid
import urllib.error
import urllib.request
import subprocess
import sys

SAFE_ERRORS = {
    'unauthorized', 'not_found', 'device_not_authorized', 'ownership_unavailable',
    'phone_system_configuration_invalid', 'provisioner_unavailable',
    'asterisk_command_failed', 'asterisk_endpoint_unverified',
    'asterisk_aor_unverified', 'asterisk_dialplan_unverified',
    'device_authorization_unavailable', 'invalid_identity', 'invalid_json',
    'asterisk_configuration_rejected', 'asterisk_rollback_failed',
    'device_limit_reached', 'device_assignment_conflict',
}
REFERENCE = re.compile(r'projects/(elegant-racer-299721|484736877039)/secrets/[A-Za-z0-9_-]+/versions/([0-9]+|latest)')

def request(url, headers, body=None):
    encoded = None if body is None else json.dumps(body).encode()
    try:
        with urllib.request.urlopen(urllib.request.Request(url, headers=headers, data=encoded), timeout=20) as response:
            return response.status, json.loads(response.read(1048576))
    except urllib.error.HTTPError as error:
        try:
            result = json.loads(error.read(4096))
        except Exception:
            result = {}
        return error.code, result

def summarize(status, body):
    # No reflected body, credentials, profile IDs or private backend details.
    result = {'httpStatus': status}
    if status == 200:
        result['providerVerified'] = body.get('provider') == 'asterisk'
        result['registered'] = body.get('registered') is True
    else:
        code = body.get('error')
        result['code'] = code if isinstance(code, str) and code in SAFE_ERRORS else 'unclassified_response'
    return result

def exercise(body, token, send=request, run=subprocess.run):
    """Exercise only the approved operator, then revoke the temporary credential."""
    calls = run(['docker', 'exec', 'pbx_asterisk_1', 'asterisk', '-rx', 'core show channels count'],
                capture_output=True, text=True, timeout=20)
    if calls.returncode or not re.search(r'^0 active calls?\s*$', calls.stdout, re.M):
        raise ValueError('active_call_or_unverified_state')
    origin = 'https://phone.elevateforhumanity.org/internal/pbx/devices'
    headers = {'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json'}
    output = {}
    try:
        status, result = send(origin, headers, body)
        output['create'] = summarize(status, result)
        # Never print or save the SIP password returned by a successful create.
        result = None
    except Exception:
        output['create'] = {'httpStatus': 0, 'code': 'transport_unavailable'}
    finally:
        # Revoke even after a timeout: the server may have applied the request.
        try:
            status, result = send(origin + '/revoke', headers, body)
            output['cleanup'] = summarize(status, result)
            output['cleanup']['revoked'] = status == 200 and result.get('revoked') is True
        except Exception:
            output['cleanup'] = {'httpStatus': 0, 'code': 'transport_unavailable', 'revoked': False}
    return output

def main():
    values = {}
    for line in Path('/etc/elevate-pbx/provisioner.conf').read_text().splitlines():
        match = re.fullmatch(r'([A-Z_0-9]+)=(.*)', line.strip())
        if match:
            values[match[1]] = match[2].strip().strip('"').strip("'")
    if values.get('SUPABASE_URL', '').rstrip('/') != 'https://cuxzzpsyufcewtmicszk.supabase.co':
        raise ValueError('database_scope_unverified')
    system = values.get('PBX_PHONE_SYSTEM_ID', '')
    if system != '341f59a3-b1d6-4360-8463-0ce0402f86fe':
        raise ValueError('phone_system_scope_unverified')
    _, identity = request('http://169.254.169.254/computeMetadata/v1/instance/service-accounts/default/token', {'Metadata-Flavor': 'Google'})
    def secret(key):
        ref = values.get(key, '')
        if not REFERENCE.fullmatch(ref):
            raise ValueError('secret_reference_unverified')
        status, result = request('https://secretmanager.googleapis.com/v1/' + ref + ':access', {'Authorization': 'Bearer ' + identity['access_token']})
        if status != 200:
            raise ValueError('secret_access_unavailable')
        return base64.b64decode(result['payload']['data']).decode().strip()
    service = secret('SUPABASE_SERVICE_ROLE_KEY_SECRET')
    token = secret('PBX_PROVISIONING_TOKEN_SECRET')
    if len(token) < 32:
        raise ValueError('credential_reference_unverified')
    headers = {'apikey': service, 'Authorization': 'Bearer ' + service}
    status, rows = request(values['SUPABASE_URL'].rstrip('/') + '/rest/v1/communication_extensions?select=id,profile_id,webrtc_provider,communication_workspaces!inner(phone_system_id)&extension=eq.0&enabled=eq.true&communication_workspaces.phone_system_id=eq.' + system, headers)
    if status != 200 or not isinstance(rows, list) or len(rows) != 1 or rows[0].get('webrtc_provider') != 'asterisk':
        raise ValueError('operator_assignment_unverified')
    if '--exercise' in sys.argv and (rows[0]['id'] != 'ea5439e0-014b-4020-8e25-e305f20c53d6' or
            rows[0]['profile_id'] != '964dc85a-bce8-4e67-92eb-198ffafb2384'):
        raise ValueError('approved_operator_changed')
    # A fresh diagnostic identity has never been provisioned. The /status action
    # validates ownership without creating a device, SIP credential or endpoint.
    body = {'profileId': rows[0]['profile_id'], 'extensionId': rows[0]['id'], 'deviceId': 'asterisk_probe_' + uuid.uuid4().hex}
    output = {}
    for name, origin in [('private', 'http://127.0.0.1:8090'), ('public', 'https://phone.elevateforhumanity.org')]:
        try:
            status, result = request(origin + '/internal/pbx/devices/status', {'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json'}, body)
            output[name] = summarize(status, result)
        except Exception:
            output[name] = {'code': 'transport_unavailable'}
    report = {'operatorProvisioningProbe': output, 'credentialsCreated': False, 'carrierRoutingChanged': False}
    if not all(value.get('providerVerified') is True for value in output.values()):
        report['result'] = 'FAIL'
        return report
    if '--exercise' in sys.argv:
        base = Path('/opt/elevate-pbx/repo/infra/pbx/asterisk')
        report['mainFileIncludeReferences'] = {name: ('elevate-webrtc/current/' + name) in (base / name).read_text() for name in ['pjsip.conf', 'extensions.conf']}
        print(json.dumps({'operatorPreflight': report}), flush=True)
        report['operatorDeviceExercise'] = exercise(body, token)
        report['credentialsCreated'] = ('UNKNOWN' if report['operatorDeviceExercise']['create']['httpStatus'] == 0
                                        else report['operatorDeviceExercise']['create']['httpStatus'] == 200)
        report['temporaryCredentialsRevoked'] = report['operatorDeviceExercise']['cleanup']['revoked']
        if (report['operatorDeviceExercise']['create'].get('providerVerified') is not True or
                not report['temporaryCredentialsRevoked']):
            report['result'] = 'FAIL'
        else:
            report['result'] = 'PASS'
    return report

if __name__ == '__main__':
    try:
        report = main()
        print(json.dumps(report))
        if report.get('result') == 'FAIL':
            raise SystemExit(1)
    except Exception as error:
        known = {'database_scope_unverified', 'phone_system_scope_unverified', 'secret_reference_unverified', 'secret_access_unavailable', 'credential_reference_unverified', 'operator_assignment_unverified', 'approved_operator_changed', 'active_call_or_unverified_state'}
        code = str(error) if isinstance(error, ValueError) and str(error) in known else 'probe_unavailable'
        print(json.dumps({'operatorProvisioningProbe': {'code': code}, 'credentialsCreated': 'UNKNOWN' if '--exercise' in sys.argv else False, 'cleanupVerified': False, 'carrierRoutingChanged': False}))
        raise SystemExit(1)
