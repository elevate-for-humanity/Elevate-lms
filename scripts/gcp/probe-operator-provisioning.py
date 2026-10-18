#!/usr/bin/env python3
"""Read-only authenticated operator probe. Never issue or print credentials."""
import base64
import json
from pathlib import Path
import re
import uuid
import urllib.error
import urllib.request

SAFE_ERRORS = {
    'unauthorized', 'not_found', 'device_not_authorized', 'ownership_unavailable',
    'phone_system_configuration_invalid', 'provisioner_unavailable',
    'asterisk_command_failed', 'asterisk_endpoint_unverified',
    'asterisk_aor_unverified', 'asterisk_dialplan_unverified',
    'device_authorization_unavailable', 'invalid_identity', 'invalid_json',
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
    return {'operatorProvisioningProbe': output, 'credentialsCreated': False, 'carrierRoutingChanged': False}

if __name__ == '__main__':
    try:
        print(json.dumps(main()))
    except Exception:
        print(json.dumps({'operatorProvisioningProbe': {'code': 'probe_unavailable'}, 'credentialsCreated': False, 'carrierRoutingChanged': False}))
        raise SystemExit(1)
