#!/usr/bin/env python3
"""Apply authoritative phone settings to PARIS; refuse active calls; roll back on failure.
Run on the existing PBX using the protected Google deployment identity.
Never emit settings, secrets, caller data, or provider responses.
"""
import base64
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import tempfile
import urllib.request

ROOT = Path('/opt/elevate-pbx/paris')
UNITS = ['elevate-paris-turn.service', 'elevate-paris-gateway.service']

def run(args):
    result = subprocess.run(args, capture_output=True, text=True, timeout=40)
    if result.returncode:
        raise ValueError('PARIS_COMMAND_FAILED')
    return result.stdout

def get(url, headers):
    with urllib.request.urlopen(urllib.request.Request(url, headers=headers), timeout=20) as response:
        return json.loads(response.read(1048576))

def settings(system, extensions):
    if system.get('status') != 'active' or system.get('ai_enabled') is not True:
        raise ValueError('PARIS_DISABLED_IN_AUTHORITATIVE_SETTINGS')
    result = {}
    for key, field, limit in [('PARIS_GREETING', 'greeting', 1200), ('PARIS_SYSTEM_INSTRUCTIONS', 'ai_instructions', 16000)]:
        value = system.get(field)
        if not isinstance(value, str) or not value.strip() or len(value) > limit or '\0' in value:
            raise ValueError('PARIS_SAVED_SETTINGS_INVALID')
        result[key] = value
    numbers = [row.get('extension') for row in extensions]
    if not numbers or any(not isinstance(n, str) or not re.fullmatch(r'0|[1-9][0-9]{2}', n) for n in numbers) or len(numbers) != len(set(numbers)):
        raise ValueError('PARIS_SAVED_EXTENSIONS_INVALID')
    result['PARIS_ALLOWED_EXTENSIONS'] = ','.join(sorted(n for n in numbers if n != '0'))
    return result

def environment_text(values):
    # systemd EnvironmentFile supports literal newlines inside double quotes.
    # Escape backslashes and quotes; never interpolate these values into a shell.
    return ''.join(key + '="' + value.replace('\\', '\\\\').replace('"', '\\"') + '"\n' for key, value in values.items())

def require_idle():
    output = run(['docker', 'exec', 'pbx_asterisk_1', 'asterisk', '-rx', 'core show channels count'])
    if not re.search(r'^0 active calls?$', output, re.M):
        raise ValueError('PARIS_ACTIVE_CALLS_OR_UNKNOWN_STATE')

def directory_text(values):
    lines = ['; Managed PARIS approved extension calls and voicemail', '[elevate-paris-directory]']
    for extension in values['PARIS_ALLOWED_EXTENSIONS'].split(','):
        if not extension:
            continue
        if not re.fullmatch(r'[1-9][0-9]{2}', extension):
            raise ValueError('PARIS_DIRECTORY_INVALID')
        lines += [f'exten => {extension},1,Set(DIALSTATUS=CHANUNAVAIL)',
                  f' same => n,GotoIf($[${{DIALPLAN_EXISTS(elevate-pwa-extensions,{extension},1)}}=0]?voicemail)',
                  f' same => n,Gosub(elevate-pwa-extensions,{extension},1)',
                  ' same => n,GotoIf($["${DIALSTATUS}"="ANSWER"]?done)',
                  f' same => n(voicemail),VoiceMail({extension}@elevate,u)',
                  ' same => n(done),Hangup()']
    return '\n'.join(lines) + '\n'

def read_authority():
    config = {}
    for line in Path('/etc/elevate-pbx/provisioner.conf').read_text().splitlines():
        match = re.fullmatch(r'([A-Z_0-9]+)=(.*)', line.strip())
        if match:
            config[match[1]] = match[2].strip().strip('"').strip("'")
    if config.get('SUPABASE_URL', '').rstrip('/') != 'https://cuxzzpsyufcewtmicszk.supabase.co':
        raise ValueError('PARIS_DATABASE_UNVERIFIED')
    system_id = config.get('PBX_PHONE_SYSTEM_ID', '')
    reference = config.get('SUPABASE_SERVICE_ROLE_KEY_SECRET', '')
    if not re.fullmatch(r'[0-9a-f-]{36}', system_id) or not re.fullmatch(r'projects/(elegant-racer-299721|484736877039)/secrets/[A-Za-z0-9_-]+/versions/([0-9]+|latest)', reference):
        raise ValueError('PARIS_IDENTITY_UNVERIFIED')
    identity = get('http://169.254.169.254/computeMetadata/v1/instance/service-accounts/default/token', {'Metadata-Flavor': 'Google'})
    secret = get('https://secretmanager.googleapis.com/v1/' + reference + ':access', {'Authorization': 'Bearer ' + identity['access_token']})
    key = base64.b64decode(secret['payload']['data']).decode().strip()
    headers = {'apikey': key, 'Authorization': 'Bearer ' + key}
    base = config['SUPABASE_URL'].rstrip('/') + '/rest/v1/'
    systems = get(base + 'phone_systems?select=status,ai_enabled,greeting,ai_instructions&id=eq.' + system_id, headers)
    workspaces = get(base + 'communication_workspaces?select=id&phone_system_id=eq.' + system_id, headers)
    if len(systems) != 1 or len(workspaces) != 1:
        raise ValueError('PARIS_SETTINGS_SCOPE_UNVERIFIED')
    extensions = get(base + 'communication_extensions?select=extension&enabled=eq.true&workspace_id=eq.' + workspaces[0]['id'], headers)
    return settings(systems[0], extensions)

def repair(source):
    require_idle()
    values = read_authority()
    for unit in UNITS:
        if run(['systemctl', 'is-active', unit]).strip() != 'active':
            raise ValueError('PARIS_EXISTING_RUNTIME_NOT_ACTIVE')
    # Source must already have passed the repository's complete PARIS tests.
    source = Path(source)
    names = ['launch.mjs', 'turn-adapter.mjs', 'ari-media.mjs']
    for name in names:
        if not (source / name).is_file() or (ROOT / name).is_symlink():
            raise ValueError('PARIS_SOURCE_UNVERIFIED')
        run(['/usr/bin/node', '--check', str(source / name)])
    config = Path('/etc/elevate-pbx/paris-dashboard-settings.conf')
    asterisk = Path('/opt/elevate-pbx/repo/infra/pbx/asterisk')
    main = asterisk / 'extensions.conf'
    directory = asterisk / 'elevate-paris-directory.conf'
    if not main.is_file() or main.is_symlink():
        raise ValueError('PARIS_DIALPLAN_UNVERIFIED')
    original_main = main.read_text()
    if directory.exists() and not directory.read_text().startswith('; Managed PARIS approved extension calls and voicemail'):
        raise ValueError('PARIS_DIRECTORY_OWNERSHIP_UNVERIFIED')
    users = run(['docker', 'exec', 'pbx_asterisk_1', 'asterisk', '-rx', 'voicemail show users'])
    for extension in filter(None, values['PARIS_ALLOWED_EXTENSIONS'].split(',')):
        if not re.search(r'^\s*elevate\s+' + extension + r'\s+', users, re.M):
            raise ValueError('PARIS_TARGET_MAILBOX_UNVERIFIED')
    gid = run(['docker', 'exec', 'pbx_asterisk_1', 'id', '-g', 'asterisk']).strip()
    if not gid.isdigit():
        raise ValueError('PARIS_ASTERISK_GROUP_UNVERIFIED')
    dropins = [Path('/etc/systemd/system/' + unit + '.d/30-dashboard-settings.conf') for unit in UNITS]
    targets = [ROOT / name for name in names] + [config] + dropins + [main, directory]
    if any(path.is_symlink() for path in targets):
        raise ValueError('PARIS_TARGET_SYMLINK_REJECTED')
    backup_root = Path('/var/lib/elevate-pbx/paris-rollback')
    backup_root.mkdir(mode=0o700, parents=True, exist_ok=True)
    backup = Path(tempfile.mkdtemp(prefix='settings-', dir=backup_root))
    existed = {}
    for index, target in enumerate(targets):
        existed[target] = target.exists()
        if target.exists():
            shutil.copy2(target, backup / str(index))
    require_idle()
    try:
        for name in names:
            shutil.copy2(source / name, ROOT / name)
            os.chmod(ROOT / name, 0o644)
        config.write_text(environment_text(values)); os.chmod(config, 0o600)
        for path in dropins:
            path.parent.mkdir(mode=0o755, parents=True, exist_ok=True)
            path.write_text('[Service]\nEnvironmentFile=/etc/elevate-pbx/paris-dashboard-settings.conf\n')
            os.chmod(path, 0o644)
        directory.write_text(directory_text(values)); os.chmod(directory, 0o640); os.chown(directory, 0, int(gid))
        if '#include elevate-paris-directory.conf' not in original_main:
            main.write_text(original_main + '\n#include elevate-paris-directory.conf\n')
        run(['docker', 'exec', 'pbx_asterisk_1', 'asterisk', '-rx', 'dialplan reload'])
        for extension in filter(None, values['PARIS_ALLOWED_EXTENSIONS'].split(',')):
            plan = run(['docker', 'exec', 'pbx_asterisk_1', 'asterisk', '-rx', 'dialplan show ' + extension + '@elevate-paris-directory'])
            if not re.search(r"^\s*'" + extension + r"'\s*=>\s*1\.", plan, re.M) or 'VoiceMail(' + extension + '@elevate,u)' not in plan:
                raise ValueError('PARIS_CALLER_ROUTE_NOT_LOADED')
        run(['systemctl', 'daemon-reload'])
        require_idle()
        for unit in UNITS:
            run(['systemctl', 'restart', unit])
            if run(['systemctl', 'is-active', unit]).strip() != 'active':
                raise ValueError('PARIS_RESTART_VERIFICATION_FAILED')
        for unit in UNITS:
            pid = run(['systemctl', 'show', unit, '--property=MainPID', '--value']).strip()
            if not re.fullmatch(r'[1-9][0-9]*', pid):
                raise ValueError('PARIS_PID_UNVERIFIED')
            environment = dict(item.decode().split('=', 1) for item in Path('/proc/' + pid + '/environ').read_bytes().split(b'\0') if b'=' in item)
            if any(environment.get(key) != value for key, value in values.items()):
                raise ValueError('PARIS_RUNNING_SETTINGS_MISMATCH')
    except Exception:
        for index, target in enumerate(targets):
            if existed[target]:
                shutil.copy2(backup / str(index), target)
            else:
                target.unlink(missing_ok=True)
        run(['systemctl', 'daemon-reload'])
        run(['docker', 'exec', 'pbx_asterisk_1', 'asterisk', '-rx', 'dialplan reload'])
        for unit in UNITS:
            run(['systemctl', 'restart', unit])
        raise
    return {'result': 'PASS', 'scope': 'paris_saved_settings_and_reviewed_source', 'carrierRoutingChanged': False, 'liveCallAcceptance': 'NOT_TESTED'}

if __name__ == '__main__':
    import sys
    try:
        print(json.dumps(repair(sys.argv[1])))
    except Exception as error:
        reason=str(error) if isinstance(error,ValueError) and re.fullmatch(r'PARIS_[A-Z_]+',str(error)) else 'PARIS_SETTINGS_REPAIR_NOT_CONFIRMED'
        print(json.dumps({'result': 'FAIL', 'code': reason}))
        sys.exit(1)
