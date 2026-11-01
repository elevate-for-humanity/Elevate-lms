#!/usr/bin/env python3
"""Compare saved phone settings with running processes; exercise synthetic speech only.

Never dial, deliver a message, change routing, or emit credentials/caller data.
Run on the existing PBX via the protected deployment identity.
"""
import base64
import json
from pathlib import Path
import re
import secrets
import struct
import subprocess
import urllib.error
import urllib.request

SYSTEM = '341f59a3-b1d6-4360-8463-0ce0402f86fe'
DATABASE = 'https://cuxzzpsyufcewtmicszk.supabase.co'
REFERENCE = re.compile(r'projects/(elegant-racer-299721|484736877039)/secrets/[A-Za-z0-9_-]+/versions/([0-9]+|latest)')


def request(url, headers, body=None):
    data = None if body is None else json.dumps(body).encode()
    try:
        with urllib.request.urlopen(urllib.request.Request(url, headers=headers, data=data), timeout=35) as response:
            return response.status, json.loads(response.read(2097152))
    except urllib.error.HTTPError as error:
        return error.code, {}


def run(args):
    result = subprocess.run(args, capture_output=True, text=True, timeout=20)
    if result.returncode:
        raise ValueError('runtime_read_failed')
    return result.stdout


def file_environment(filename):
    result = {}
    for line in Path(filename).read_text().splitlines():
        match = re.fullmatch(r'([A-Z_0-9]+)=(.*)', line.strip())
        if match:
            result[match[1]] = match[2].strip().strip('"').strip("'")
    return result


def process_environment(unit):
    pid = run(['systemctl', 'show', unit, '--property=MainPID', '--value']).strip()
    if not re.fullmatch('[1-9][0-9]*', pid):
        raise ValueError('phone_service_not_running')
    # Read only the already-running process. Never print its environment.
    return dict(item.decode().split('=', 1) for item in Path('/proc/' + pid + '/environ').read_bytes().split(b'\0') if b'=' in item)


def compare_configuration(system, extensions, turn, gateway):
    expected = sorted(row['extension'] for row in extensions if row['extension'] != '0')
    turn_routes = sorted(set(filter(None, turn.get('PARIS_ALLOWED_EXTENSIONS', '').split(','))))
    gateway_routes = sorted(set(filter(None, gateway.get('PARIS_ALLOWED_EXTENSIONS', '').split(','))))
    return {
        'phoneSystemActive': system.get('status') == 'active',
        'parisEnabledInDashboard': system.get('ai_enabled') is True,
        'savedGreetingAppliedToRunningTurnService': bool(system.get('greeting')) and turn.get('PARIS_GREETING') == system['greeting'],
        'savedInstructionsAppliedToRunningTurnService': bool(system.get('ai_instructions')) and turn.get('PARIS_SYSTEM_INSTRUCTIONS') == system['ai_instructions'],
        'allEnabledExtensionsUseOwnedPbx': all(row.get('webrtc_provider') == 'asterisk' for row in extensions),
        'turnExtensionListMatchesDashboard': turn_routes == expected,
        'gatewayExtensionListMatchesDashboard': gateway_routes == expected,
        'voicemailEnabledInDashboard': system.get('voicemail_enabled') is True,
        'transcriptionEnabledInDashboard': system.get('voicemail_transcription_enabled') is True,
    }


def mulaw_payload(wav):
    if len(wav) < 12 or wav[:4] != b'RIFF' or wav[8:12] != b'WAVE':
        raise ValueError('synthetic_audio_format_invalid')
    offset, fmt, audio = 12, None, None
    while offset + 8 <= len(wav):
        tag, size = wav[offset:offset + 4], struct.unpack_from('<I', wav, offset + 4)[0]
        if offset + 8 + size > len(wav):
            raise ValueError('synthetic_audio_truncated')
        chunk = wav[offset + 8:offset + 8 + size]
        if tag == b'fmt ' and len(chunk) >= 16:
            fmt = struct.unpack_from('<HHI', chunk) + (struct.unpack_from('<H', chunk, 14)[0],)
        if tag == b'data':
            audio = chunk
        offset += 8 + size + size % 2
    if fmt != (7, 1, 8000, 8) or not audio or len(audio) > 100000:
        raise ValueError('synthetic_audio_format_invalid')
    return audio + b'\xff' * ((-len(audio)) % 160)


def voice_probe(token, google_token, send=request):
    headers = {'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json'}
    base = {'sessionId': secrets.token_hex(12), 'callId': 'synthetic-phone-readiness-' + secrets.token_hex(8),
            'encoding': 'PCMU', 'sampleRate': 8000, 'sequence': 0}
    url = 'http://127.0.0.1:8091/internal/paris/turn'
    def audible(body):
        try:
            audio = base64.b64decode(body.get('replyAudioUlawBase64', ''), validate=True)
            return 160 <= len(audio) <= 1040000 and len(audio) % 160 == 0 and len(set(audio)) > 4
        except Exception:
            return False
    status, reply = send(url, headers, {**base, 'event': 'greeting'})
    report = {'greetingHttpStatus': status, 'greetingAudioReturned': status == 200 and audible(reply), 'greetingAudioDurationSeconds':round(len(base64.b64decode(reply.get('replyAudioUlawBase64','')))/8000,2) if status==200 and audible(reply) else 0}
    tts_status, tts = send('https://texttospeech.googleapis.com/v1/text:synthesize',
        {'Authorization': 'Bearer ' + google_token, 'Content-Type': 'application/json'},
        {'input': {'text': 'Please connect me to the operator.'},
         'voice': {'languageCode': 'en-US', 'name': 'en-US-Neural2-F'},
         'audioConfig': {'audioEncoding': 'MULAW', 'sampleRateHertz': 8000}})
    report['syntheticCallerTtsHttpStatus'] = tts_status
    if tts_status != 200:
        report['operatorSpeechRouteVerified'] = False
        return report
    audio = mulaw_payload(base64.b64decode(tts.get('audioContent', ''), validate=True))
    status, reply = send(url, headers, {**base, 'sequence': 1 if report['greetingAudioReturned'] else 0,
                                      'audioBase64': base64.b64encode(audio).decode()})
    report.update({'operatorSpeechHttpStatus': status,
                   'operatorSpeechRouteVerified': status == 200 and reply.get('requestedRoute') == {'type': 'operator', 'extension': '0'},
                   'operatorReplyAudioReturned': status == 200 and audible(reply)})
    return report


def private_gateway_probe(token):
    # Exercise the exact deployed Node HTTPS helper; direct adapter HTTP does
    # not verify proxy routing, Node trust, or the deployed response envelope.
    program="""import fs from 'node:fs';
import {privateTurn} from '/opt/elevate-pbx/paris/private-turn.mjs';
const input=JSON.parse(fs.readFileSync(0,'utf8'));
try{const reply=await privateTurn('https://phone.elevateforhumanity.org/internal/paris/turn',input.body,input.token);const audio=Buffer.from(reply.replyAudioUlawBase64||'','base64');console.log(JSON.stringify({audioReturned:audio.length>=160&&audio.length%160===0,audioDurationSeconds:audio.length/8000}));}
catch(e){const allowed=['PARIS_TURN_RESPONSE_TOO_LARGE','PARIS_TURN_TRANSPORT_FAILED','PARIS_TURN_INVALID_RESPONSE','PARIS_TURN_RESPONSE_FAILED','PARIS_TURN_TIMEOUT'];const reason=allowed.includes(e.message)||/^PARIS_TURN_HTTP_[0-9]{3}$/.test(e.message)?e.message:'PARIS_PRIVATE_GATEWAY_FAILED';console.log(JSON.stringify({audioReturned:false,reason}));}
"""
    body={'callId':'synthetic-private-gateway-'+secrets.token_hex(8),'sessionId':secrets.token_hex(12),'sequence':0,'event':'greeting','encoding':'PCMU','sampleRate':8000}
    result=subprocess.run(['/usr/bin/node','--input-type=module','-e',program],input=json.dumps({'token':token,'body':body}),capture_output=True,text=True,timeout=40)
    if result.returncode:return {'audioReturned':False,'reason':'PARIS_PRIVATE_GATEWAY_PROBE_UNAVAILABLE'}
    return json.loads(result.stdout)

def main():
    config = file_environment('/etc/elevate-pbx/provisioner.conf')
    paris = file_environment('/etc/elevate-pbx/paris.conf')
    if config.get('SUPABASE_URL', '').rstrip('/') != DATABASE or config.get('PBX_PHONE_SYSTEM_ID') != SYSTEM:
        raise ValueError('phone_scope_unverified')
    status, identity = request('http://169.254.169.254/computeMetadata/v1/instance/service-accounts/default/token', {'Metadata-Flavor': 'Google'})
    if status != 200 or not identity.get('access_token'):
        raise ValueError('workload_identity_unavailable')
    def secret(reference):
        if not REFERENCE.fullmatch(reference):
            raise ValueError('secret_reference_unverified')
        status, body = request('https://secretmanager.googleapis.com/v1/' + reference + ':access', {'Authorization': 'Bearer ' + identity['access_token']})
        if status != 200:
            raise ValueError('secret_access_unavailable')
        return base64.b64decode(body['payload']['data']).decode().strip()
    key = secret(config.get('SUPABASE_SERVICE_ROLE_KEY_SECRET', ''))
    headers = {'apikey': key, 'Authorization': 'Bearer ' + key}
    status, systems = request(DATABASE + '/rest/v1/phone_systems?select=status,greeting,ai_instructions,ai_enabled,ai_voice,voicemail_enabled,voicemail_transcription_enabled&id=eq.' + SYSTEM, headers)
    if status != 200 or len(systems) != 1:
        raise ValueError('phone_system_unverified')
    status, extensions = request(DATABASE + '/rest/v1/communication_extensions?select=extension,webrtc_provider,voicemail_greeting,communication_workspaces!inner(phone_system_id)&enabled=eq.true&communication_workspaces.phone_system_id=eq.' + SYSTEM, headers)
    if status != 200 or not extensions or any(not re.fullmatch(r'0|[1-9][0-9]{2}', row['extension']) for row in extensions):
        raise ValueError('phone_extensions_unverified')
    turn = process_environment('elevate-paris-turn.service')
    gateway = process_environment('elevate-paris-gateway.service')
    comparison = compare_configuration(systems[0], extensions, turn, gateway)
    cli = lambda value: run(['docker', 'exec', 'pbx_asterisk_1', 'asterisk', '-rx', value])
    routes = []
    for row in extensions:
        extension = row['extension']
        context = 'elevate-pwa-extensions' if extension == '0' else 'elevate-paris-directory'
        plan = cli('dialplan show ' + extension + '@' + context)
        routes.append({'extension': extension, 'generatedRoutePresent': bool(re.search(r"^\s*'" + extension + r"'\s*=>\s*1\.", plan, re.M)),
                       'savedVoicemailGreetingPresent': bool(row.get('voicemail_greeting'))})
    report = {'configuration': comparison, 'extensions': routes,
              'enabledExtensionCount': len(extensions), 'callsPlaced': 0, 'messagesDelivered': 0,
              'liveCallAcceptance': 'NOT_TESTED', 'configurationChanged': False,
              'provisionerSourceSha256': __import__('hashlib').sha256(Path('/opt/elevate-pbx/provisioner/server.mjs').read_bytes()).hexdigest(),
              'turnSourceSha256': __import__('hashlib').sha256(Path('/opt/elevate-pbx/paris/turn-adapter.mjs').read_bytes()).hexdigest(),
              'gatewaySourceSha256': __import__('hashlib').sha256(Path('/opt/elevate-pbx/paris/ari-media.mjs').read_bytes()).hexdigest(),
              'privateTurnSourceSha256': __import__('hashlib').sha256(Path('/opt/elevate-pbx/paris/private-turn.mjs').read_bytes()).hexdigest()}
    # Emit configuration evidence even if a speech provider is unavailable.
    print(json.dumps({'livePhoneConfiguration': report}), flush=True)
    token=secret(paris.get('PARIS_TURN_TOKEN_SECRET', ''))
    report['speech'] = voice_probe(token, identity['access_token'])
    report['privateGatewayGreeting']=private_gateway_probe(token)
    report['result'] = 'PASS' if report['privateGatewayGreeting'].get('audioReturned') is True and all(comparison.values()) and all(row['generatedRoutePresent'] for row in routes) and all(report['speech'].get(k) is True for k in ['greetingAudioReturned', 'operatorSpeechRouteVerified', 'operatorReplyAudioReturned']) else 'FAIL'
    return report


if __name__ == '__main__':
    try:
        result = main()
    except Exception as error:
        safe = {'runtime_read_failed', 'phone_service_not_running', 'phone_scope_unverified', 'workload_identity_unavailable', 'secret_reference_unverified', 'secret_access_unavailable', 'phone_system_unverified', 'phone_extensions_unverified', 'synthetic_audio_format_invalid', 'synthetic_audio_truncated'}
        result = {'result': 'FAIL', 'code': str(error) if str(error) in safe else 'live_phone_configuration_unavailable', 'callsPlaced': 0, 'messagesDelivered': 0}
    print(json.dumps(result))
    raise SystemExit(0 if result['result'] == 'PASS' else 1)
