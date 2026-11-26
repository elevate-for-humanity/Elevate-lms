#!/usr/bin/env python3
"""Apply dashboard voicemail greetings to the Asterisk mailboxes.

The Admin dashboard (Communications Hub -> Phone -> "Voicemail greeting")
stores what each mailbox's greeting should be:

  phone_systems.voicemail_greeting*             the default greeting slot
  communication_extensions.voicemail_greeting*  a per-extension override

Each slot is either typed text (spoken by text-to-speech) or a recording
the admin made in the dashboard (stored in the private `phone-greetings`
bucket). Asterisk's voicemail plays a mailbox's own `unavail.wav` instead
of its stock prompts when one is installed, so this script turns the saved
settings into that file for every mailbox:

  mailbox '0'              <- the system default slot (the operator route
                              in elevate-operator.conf lands callers here)
  the admin extension      <- its override, else the system default
  every enabled extension  <- its override, else the system default
  a mailbox with no greeting configured gets no file, so callers hear the
  stock prompts exactly as before this feature existed.

Runs on the PBX VM under the protected Google deployment identity, in the
same shape as repair-paris-settings.py / configure-owned-voicemail.py:
refuses to run during active calls, backs up every file it replaces, and
rolls the whole run back if any mailbox cannot be updated and verified.
Emits only modes, sources and audio hashes — never greeting text, caller
data, or secrets.
"""
import base64
import hashlib
import io
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import time
import urllib.request
import wave

MAX_GREETING_CHARS = 600
EXTENSION = re.compile(r'0|[1-9][0-9]{2}')
RECORDING_PATH = re.compile(r'(system|extensions)/[A-Za-z0-9][A-Za-z0-9._-]*')
TTS_VOICE = {'languageCode': 'en-US', 'name': 'en-US-Neural2-F'}
BACKUP_ROOT = Path('/var/lib/elevate-pbx/voicemail-greeting-backup')


def run(args, timeout=40):
    result = subprocess.run(args, capture_output=True, text=True, timeout=timeout)
    if result.returncode:
        raise ValueError('voicemail_greeting_command_failed')
    return result.stdout


def get(url, headers):
    with urllib.request.urlopen(urllib.request.Request(url, headers=headers), timeout=20) as response:
        return json.loads(response.read(4194304))


def get_bytes(url, headers):
    with urllib.request.urlopen(urllib.request.Request(url, headers=headers), timeout=30) as response:
        return response.read(4194304)


# ---------------------------------------------------------------------------
# Pure planning: settings rows in, per-mailbox actions out. Kept free of I/O
# so test-apply-voicemail-greetings.py can pin the behavior.
# ---------------------------------------------------------------------------

def normalize_slot(row):
    if not isinstance(row, dict):
        return {'mode': 'text', 'text': '', 'recording_path': ''}
    mode = row.get('voicemail_greeting_mode')
    text = row.get('voicemail_greeting')
    path = row.get('voicemail_greeting_recording_path')
    return {
        'mode': 'recording' if mode == 'recording' else 'text',
        'text': text.strip() if isinstance(text, str) else '',
        'recording_path': path.strip() if isinstance(path, str) else '',
    }


def slot_is_set(slot):
    return bool(slot['recording_path']) if slot['mode'] == 'recording' else bool(slot['text'])


def resolve_greeting(extension_slot, system_slot):
    """The greeting one mailbox should play, or None for stock prompts."""
    for source, slot in (('extension', extension_slot), ('system', system_slot)):
        if not slot_is_set(slot):
            continue
        if slot['mode'] == 'recording':
            return {'source': source, 'mode': 'recording', 'recording_path': slot['recording_path']}
        return {'source': source, 'mode': 'text', 'text': slot['text']}
    return None


def validate_greeting(greeting):
    if greeting is None:
        return
    if greeting['mode'] == 'text':
        text = greeting['text']
        if not text or len(text) > MAX_GREETING_CHARS or any(ord(c) < 32 for c in text):
            raise ValueError('voicemail_greeting_text_invalid')
    elif not RECORDING_PATH.fullmatch(greeting['recording_path']):
        raise ValueError('voicemail_greeting_recording_invalid')


def mailbox_plan(system, extensions):
    """Map mailbox number -> greeting (or None) for every live mailbox.

    Mailbox '0' is the operator box the elevate-operator route falls back
    to, so it always carries the system default slot itself; every real
    extension resolves override-then-default. Disabled extensions are left
    completely alone.
    """
    system_slot = normalize_slot(system)
    plan = {'0': resolve_greeting({'mode': 'text', 'text': '', 'recording_path': ''}, system_slot)}
    for row in extensions:
        extension = row.get('extension')
        if not isinstance(extension, str) or not EXTENSION.fullmatch(extension):
            raise ValueError('voicemail_greeting_extension_invalid')
        if row.get('enabled') is not True or extension == '0':
            continue
        plan[extension] = resolve_greeting(normalize_slot(row), system_slot)
    for greeting in plan.values():
        validate_greeting(greeting)
    return plan


# ---------------------------------------------------------------------------
# Audio production
# ---------------------------------------------------------------------------

def validate_wav(audio, code):
    with wave.open(io.BytesIO(audio)) as wav:
        frames = wav.getnframes()
        if wav.getframerate() != 8000 or wav.getnchannels() != 1 or wav.getsampwidth() != 2:
            raise ValueError(code)
        if not 4000 <= frames <= 8000 * 300:
            raise ValueError(code)
    return audio


def synthesize(text, token):
    body = {
        'input': {'text': text},
        'voice': TTS_VOICE,
        'audioConfig': {'audioEncoding': 'LINEAR16', 'sampleRateHertz': 8000},
    }
    request = urllib.request.Request(
        'https://texttospeech.googleapis.com/v1/text:synthesize',
        data=json.dumps(body).encode(),
        headers={'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json'},
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        reply = json.load(response)
    audio = base64.b64decode(reply['audioContent'], validate=True)
    return validate_wav(audio, 'voicemail_greeting_tts_invalid')


def convert_recording(raw):
    """Convert a dashboard recording (webm/ogg/mp4/…) to 8 kHz mono WAV."""
    ffmpeg = shutil.which('ffmpeg')
    if not ffmpeg:
        raise ValueError('voicemail_greeting_converter_unavailable')
    stamp = str(time.time_ns())
    source = Path('/tmp/elevate-greeting-' + stamp + '.src')
    target = Path('/tmp/elevate-greeting-' + stamp + '.wav')
    try:
        source.write_bytes(raw)
        result = subprocess.run(
            [ffmpeg, '-nostdin', '-v', 'error', '-y', '-i', str(source),
             '-ar', '8000', '-ac', '1', '-f', 'wav', str(target)],
            capture_output=True, timeout=60,
        )
        if result.returncode or not target.exists():
            raise ValueError('voicemail_greeting_recording_invalid')
        return validate_wav(target.read_bytes(), 'voicemail_greeting_recording_invalid')
    finally:
        source.unlink(missing_ok=True)
        target.unlink(missing_ok=True)


# ---------------------------------------------------------------------------
# VM application
# ---------------------------------------------------------------------------

def read_authority():
    config = {}
    for line in Path('/etc/elevate-pbx/provisioner.conf').read_text().splitlines():
        match = re.fullmatch(r'([A-Z_0-9]+)=(.*)', line.strip())
        if match:
            config[match[1]] = match[2].strip().strip('"').strip("'")
    if config.get('SUPABASE_URL', '').rstrip('/') != 'https://cuxzzpsyufcewtmicszk.supabase.co':
        raise ValueError('voicemail_greeting_database_unverified')
    system_id = config.get('PBX_PHONE_SYSTEM_ID', '')
    reference = config.get('SUPABASE_SERVICE_ROLE_KEY_SECRET', '')
    if not re.fullmatch(r'[0-9a-f-]{36}', system_id) or not re.fullmatch(
            r'projects/(elegant-racer-299721|484736877039)/secrets/[A-Za-z0-9_-]+/versions/([0-9]+|latest)', reference):
        raise ValueError('voicemail_greeting_identity_unverified')
    identity = get('http://169.254.169.254/computeMetadata/v1/instance/service-accounts/default/token',
                   {'Metadata-Flavor': 'Google'})
    secret = get('https://secretmanager.googleapis.com/v1/' + reference + ':access',
                 {'Authorization': 'Bearer ' + identity['access_token']})
    key = base64.b64decode(secret['payload']['data']).decode().strip()
    headers = {'apikey': key, 'Authorization': 'Bearer ' + key}
    base = config['SUPABASE_URL'].rstrip('/') + '/rest/v1/'
    systems = get(base + 'phone_systems?select=id,admin_extension,voicemail_greeting,voicemail_greeting_mode,voicemail_greeting_recording_path&id=eq.' + system_id, headers)
    workspaces = get(base + 'communication_workspaces?select=id&phone_system_id=eq.' + system_id, headers)
    if len(systems) != 1 or len(workspaces) != 1:
        raise ValueError('voicemail_greeting_scope_unverified')
    extensions = get(base + 'communication_extensions?select=extension,enabled,voicemail_greeting,voicemail_greeting_mode,voicemail_greeting_recording_path&workspace_id=eq.' + workspaces[0]['id'], headers)
    return {
        'system': systems[0],
        'extensions': extensions,
        'headers': headers,
        'base': config['SUPABASE_URL'].rstrip('/'),
        'token': identity['access_token'],
    }


def require_idle():
    output = run(['docker', 'exec', 'pbx_asterisk_1', 'asterisk', '-rx', 'core show channels count'])
    if not re.search(r'^0 active calls?$', output, re.M):
        raise ValueError('voicemail_greeting_active_call_or_unknown_state')


def spool_base():
    mounts = json.loads(run(['docker', 'inspect', 'pbx_asterisk_1', '--format', '{{json .Mounts}}']))
    mount = next((m for m in mounts if m.get('Destination') == '/var/spool/asterisk'), None)
    if not mount or not str(mount.get('Source', '')).startswith('/'):
        raise ValueError('voicemail_greeting_spool_unverified')
    base = Path(mount['Source']) / 'voicemail' / 'elevate'
    if base.is_symlink():
        raise ValueError('voicemail_greeting_spool_unverified')
    return base


def install_greeting(base, mailbox, audio, stamp):
    """Install (or, when audio is None, remove) one mailbox's unavail.wav.

    Returns a restore() closure that puts the previous state back.
    """
    folder = base / mailbox
    target = folder / 'unavail.wav'
    if target.is_symlink() or folder.is_symlink():
        raise ValueError('voicemail_greeting_spool_unverified')
    previous = target.read_bytes() if target.exists() else None
    if previous is not None:
        BACKUP_ROOT.mkdir(mode=0o700, parents=True, exist_ok=True)
        backup = BACKUP_ROOT / (mailbox + '-' + stamp + '.wav')
        backup.write_bytes(previous)
        os.chmod(backup, 0o600)

    def restore():
        if previous is None:
            target.unlink(missing_ok=True)
        else:
            target.write_bytes(previous)

    if audio is None:
        target.unlink(missing_ok=True)
        return restore
    folder.mkdir(parents=True, exist_ok=True)
    temporary = folder / ('.unavail-' + stamp + '.tmp')
    temporary.write_bytes(audio)
    os.chmod(temporary, 0o644)
    os.replace(temporary, target)
    return restore


def apply_greetings():
    require_idle()
    authority = read_authority()
    plan = mailbox_plan(authority['system'], authority['extensions'])
    base = spool_base()
    stamp = str(time.time_ns())
    applied = {}
    restores = []
    try:
        for mailbox in sorted(plan):
            greeting = plan[mailbox]
            if greeting is None:
                audio = None
            elif greeting['mode'] == 'text':
                audio = synthesize(greeting['text'], authority['token'])
            else:
                raw = get_bytes(
                    authority['base'] + '/storage/v1/object/phone-greetings/' + greeting['recording_path'],
                    authority['headers'])
                audio = convert_recording(raw)
            restores.append(install_greeting(base, mailbox, audio, stamp))
            if audio is not None:
                run(['docker', 'exec', '--user', 'asterisk', 'pbx_asterisk_1', 'test', '-r',
                     '/var/spool/asterisk/voicemail/elevate/' + mailbox + '/unavail.wav'])
            applied[mailbox] = {
                'source': 'none' if greeting is None else greeting['source'],
                'mode': 'stock' if greeting is None else greeting['mode'],
                'audioSha256': None if audio is None else hashlib.sha256(audio).hexdigest(),
            }
    except Exception:
        for restore in reversed(restores):
            try:
                restore()
            except Exception:
                pass
        raise
    return {'result': 'PASS', 'scope': 'voicemail_greetings', 'mailboxes': applied, 'callsPlaced': 0}


if __name__ == '__main__':
    try:
        result = apply_greetings()
    except Exception as error:
        code = str(error) if isinstance(error, ValueError) and re.fullmatch(r'[a-z_]+', str(error)) \
            else 'voicemail_greeting_apply_unavailable'
        result = {'result': 'BLOCKED', 'code': code}
    print(json.dumps(result))
    raise SystemExit(0 if result['result'] == 'PASS' else 1)
