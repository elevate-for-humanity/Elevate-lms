#!/usr/bin/env python3
"""Configure owned operator and assigned mailboxes without changing public carrier routing."""
import base64
import json
import os
from pathlib import Path
import re
import secrets
import shutil
import subprocess
import urllib.request
OPERATOR="; Managed Elevate operator fallback\n[internal]\nexten => 0,1,Gosub(elevate-operator,s,1)\n same => n,Hangup()\n[elevate-operator]\nexten => s,1,GotoIf($[${DIALPLAN_EXISTS(elevate-pwa-extensions,0,1)}=0]?voicemail)\n same => n,Gosub(elevate-pwa-extensions,0,1)\n same => n,GotoIf($[\"${DIALSTATUS}\"=\"ANSWER\"]?done)\n same => n(voicemail),VoiceMail(0@elevate,u)\n same => n(done),Return()\n"
ROOT=Path('/opt/elevate-pbx/repo/infra/pbx/asterisk')
MARKER='; Managed Elevate voicemail configuration'
def run(args):
    result=subprocess.run(args,capture_output=True,text=True,timeout=30)
    if result.returncode: raise ValueError('owned_voicemail_command_failed')
    return result.stdout
def get(url,headers):
    with urllib.request.urlopen(urllib.request.Request(url,headers=headers),timeout=15) as response:
        return json.loads(response.read(1048576))
def config():
    values={}
    for line in Path('/etc/elevate-pbx/provisioner.conf').read_text().splitlines():
        match=re.fullmatch(r'([A-Z_0-9]+)=(.*)',line.strip())
        if match: values[match[1]]=match[2].strip().strip('"').strip("'")
    return values
def configure():
    if not re.search(r'^0 active calls?$',run(['docker','exec','pbx_asterisk_1','asterisk','-rx','core show channels count']),re.M):
        raise ValueError('active_call_or_unverified_state')
    values=config()
    if values.get('SUPABASE_URL','').rstrip('/')!='https://cuxzzpsyufcewtmicszk.supabase.co':
        raise ValueError('voicemail_database_unverified')
    reference=values.get('SUPABASE_SERVICE_ROLE_KEY_SECRET','')
    if not re.fullmatch(r'projects/(elegant-racer-299721|484736877039)/secrets/[A-Za-z0-9_-]+/versions/([0-9]+|latest)',reference):
        raise ValueError('voicemail_secret_reference_invalid')
    identity=get('http://169.254.169.254/computeMetadata/v1/instance/service-accounts/default/token',{'Metadata-Flavor':'Google'})
    payload=get('https://secretmanager.googleapis.com/v1/'+reference+':access',{'Authorization':'Bearer '+identity['access_token']})
    key=base64.b64decode(payload['payload']['data']).decode().strip()
    headers={'apikey':key,'Authorization':'Bearer '+key}
    system=values.get('PBX_PHONE_SYSTEM_ID','')
    if not re.fullmatch('[0-9a-f-]{36}',system): raise ValueError('voicemail_phone_system_invalid')
    workspaces=get(values['SUPABASE_URL']+'/rest/v1/communication_workspaces?select=id&phone_system_id=eq.'+system,headers)
    if len(workspaces)!=1: raise ValueError('voicemail_workspace_unverified')
    rows=get(values['SUPABASE_URL']+'/rest/v1/communication_extensions?select=extension,display_name,department&enabled=eq.true&workspace_id=eq.'+workspaces[0]['id'],headers)
    rows=[row for row in rows if row['extension']=='0' or 'prestige' not in (str(row.get('display_name',''))+' '+str(row.get('department',''))).lower()]
    if not rows or not any(row['extension']=='0' for row in rows) or any(not re.fullmatch('(0|[1-9][0-9]{2})',row['extension']) for row in rows):
        raise ValueError('assigned_operator_and_mailboxes_required')
    mailbox=ROOT/'voicemail.conf'
    previous=mailbox.read_text() if mailbox.exists() else ''
    if previous and not previous.startswith(MARKER): raise ValueError('existing_voicemail_config_requires_review')
    pins={}
    for line in previous.splitlines():
        match=re.fullmatch(r'([0-9]+) => ([0-9]{6}),.*',line)
        if match: pins[match[1]]=match[2]
    names=[]
    for row in rows:
        name=''.join(character if character.isalnum() or character in ' ._-' else ' ' for character in str(row['display_name']))[:80]
        pin=pins.get(row['extension']) or str(secrets.randbelow(900000)+100000)
        names.append(row['extension']+' => '+pin+','+name+',,')
    text=MARKER+chr(10)+'[general]'+chr(10)+'format=wav'+chr(10)+'maxsecs=55'+chr(10)+'minsecs=1'+chr(10)+'maxmsg=100'+chr(10)+'[elevate]'+chr(10)+chr(10).join(names)+chr(10)
    main=ROOT/'extensions.conf';prior=main.read_text()
    destination=ROOT/'elevate-operator.conf'
    if destination.exists() and destination.read_text()!=OPERATOR: raise ValueError('existing_operator_route_requires_review')
    gid=run(['docker','exec','pbx_asterisk_1','id','-g','asterisk']).strip()
    if not gid.isdigit(): raise ValueError('asterisk_group_unverified')
    backup=Path('/var/lib/elevate-pbx/voicemail-backup')
    backup.mkdir(mode=0o700,parents=True,exist_ok=True)
    if not (backup/'extensions.conf').exists(): shutil.copy2(main,backup/'extensions.conf')
    if mailbox.exists() and not (backup/'voicemail.conf').exists(): shutil.copy2(mailbox,backup/'voicemail.conf');os.chmod(backup/'voicemail.conf',0o600)
    try:
        mailbox.write_text(text);destination.write_text(OPERATOR)
        for filename in [mailbox,destination]: os.chmod(filename,0o640);os.chown(filename,0,int(gid))
        if '#include elevate-operator.conf' not in prior: main.write_text(prior+chr(10)+'#include elevate-operator.conf'+chr(10))
        run(['docker','exec','pbx_asterisk_1','asterisk','-rx','module reload app_voicemail.so'])
        run(['docker','exec','pbx_asterisk_1','asterisk','-rx','dialplan reload'])
        users=run(['docker','exec','pbx_asterisk_1','asterisk','-rx','voicemail show users'])
        match=re.search(r'([0-9]+) voicemail users? configured',users)
        plan=run(['docker','exec','pbx_asterisk_1','asterisk','-rx','dialplan show 0@internal'])
        if not match or int(match[1])!=len(rows) or 'Gosub(elevate-operator,s,1)' not in plan:
            raise ValueError('operator_or_mailbox_verification_failed')
    except Exception:
        main.write_text(prior)
        if previous: mailbox.write_text(previous)
        else: mailbox.unlink(missing_ok=True)
        run(['docker','exec','pbx_asterisk_1','asterisk','-rx','module reload app_voicemail.so'])
        run(['docker','exec','pbx_asterisk_1','asterisk','-rx','dialplan reload'])
        raise
    return {'result':'PASS','operatorConfigured':True,'mailboxCount':len(rows),'carrierRoutingChanged':False,'liveCallAcceptance':'NOT TESTED'}
if __name__=='__main__':
    try: result=configure()
    except Exception as error:
        result={'result':'BLOCKED','code':str(error) if isinstance(error,ValueError) and re.fullmatch('[a-z_]+',str(error)) else 'owned_voicemail_configuration_unavailable'}
    print(json.dumps(result))
    raise SystemExit(0 if result['result']=='PASS' else 1)
