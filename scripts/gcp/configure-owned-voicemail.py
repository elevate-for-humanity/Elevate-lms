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
import time
import urllib.request
import io
import wave
OPERATOR="; Managed Elevate operator fallback\n[internal]\nexten => 0,1,Gosub(elevate-operator,s,1)\n same => n,Hangup()\n[elevate-operator]\nexten => s,1,GotoIf($[${DIALPLAN_EXISTS(elevate-pwa-extensions,0,1)}=0]?voicemail)\n same => n,Gosub(elevate-pwa-extensions,0,1)\n same => n,GotoIf($[\"${DIALSTATUS}\"=\"ANSWER\"]?done)\n same => n(voicemail),VoiceMail(0@elevate,u)\n same => n(done),Return()\n"
FORWARD_NUMBER='+13179562748'
OWNER='964dc85a-bce8-4e67-92eb-198ffafb2384'
ANNOUNCEMENT='Elevate for Humanity. Press 1 to accept this call.'

def operator_route(system,owner):
    if system.get('id')!='341f59a3-b1d6-4360-8463-0ce0402f86fe' or system.get('tenant_id','missing') is not None or system.get('status')!='active' or system.get('admin_extension')!='0':
        raise ValueError('operator_system_unverified')
    if owner.get('profile_id')!=OWNER or owner.get('extension')!='0' or owner.get('enabled') is not True:
        raise ValueError('operator_owner_unverified')
    if not owner.get('admin_external_fallback'):
        return OPERATOR
    if owner.get('external_fallback_number')!=FORWARD_NUMBER:
        raise ValueError('operator_forward_number_requires_review')
    # Offline browser presence must not prevent cellular fallback. Explicit DND
    # and off-duty ring modes still suppress it.
    if owner.get('ring_mode') in ['offline','do_not_disturb']:
        return OPERATOR
    return OPERATOR.replace('?voicemail)', '?cellular)').replace(
        ' same => n(voicemail),VoiceMail(0@elevate,u)',
        ' same => n(cellular),Set(ELEVATE_ORIGINAL_NAME=${CALLERID(name)})\n'
        ' same => n,Set(ELEVATE_ORIGINAL_NUMBER=${CALLERID(num)})\n'
        ' same => n,Set(CALLERID(name)=Elevate for Humanity)\n'
        ' same => n,Set(CALLERID(num)=+14632401404)\n'
        ' same => n,Set(ELEVATE_OWNER_ACCEPTED=0)\n'
        ' same => n,Dial(PJSIP/'+FORWARD_NUMBER+'@twilio,25,U(elevate-owner-accept))\n'
        ' same => n,Set(CALLERID(name)=${ELEVATE_ORIGINAL_NAME})\n'
        ' same => n,Set(CALLERID(num)=${ELEVATE_ORIGINAL_NUMBER})\n'
        ' same => n,GotoIf($["${ELEVATE_OWNER_ACCEPTED}"="1"]?done)\n'
        ' same => n(voicemail),VoiceMail(0@elevate,u)') + (
        '[elevate-owner-accept]\n'
        'exten => s,1,Read(ELEVATE_ACCEPT,custom/elevate-owner-call,1,,1,8)\n'
        ' same => n,GotoIf($["${ELEVATE_ACCEPT}"="1"]?accepted)\n'
        ' same => n,Set(GOSUB_RESULT=CONTINUE)\n'
        ' same => n,Return()\n'
        ' same => n(accepted),Set(MASTER_CHANNEL(ELEVATE_OWNER_ACCEPTED)=1)\n'
        ' same => n,Return()\n')

def announcement_audio():
    identity=get('http://169.254.169.254/computeMetadata/v1/instance/service-accounts/default/token',{'Metadata-Flavor':'Google'})
    body={'input':{'text':ANNOUNCEMENT},'voice':{'languageCode':'en-US','name':'en-US-Neural2-F'},'audioConfig':{'audioEncoding':'LINEAR16','sampleRateHertz':8000}}
    request=urllib.request.Request('https://texttospeech.googleapis.com/v1/text:synthesize',data=json.dumps(body).encode(),headers={'Authorization':'Bearer '+identity['access_token'],'Content-Type':'application/json'})
    with urllib.request.urlopen(request,timeout=30) as response: reply=json.load(response)
    audio=base64.b64decode(reply['audioContent'],validate=True)
    with wave.open(io.BytesIO(audio)) as wav:
        if wav.getframerate()!=8000 or wav.getnchannels()!=1 or wav.getsampwidth()!=2 or not 8000<wav.getnframes()<160000:
            raise ValueError('operator_announcement_audio_invalid')
    return audio
ROOT=Path('/opt/elevate-pbx/repo/infra/pbx/asterisk')
MARKER='; Managed Elevate voicemail configuration'
def run(args):
    result=subprocess.run(args,capture_output=True,text=True,timeout=30)
    if result.returncode: raise ValueError('owned_voicemail_command_failed')
    return result.stdout
def application_registered(text):
    plain=re.sub(r'\x1b\[[0-9;]*[A-Za-z]','',text)
    return "Info about Application 'VoiceMail'" in plain and 'not registered' not in plain.lower()

def ensure_voicemail_application(command=run,restart=None):
    cli=lambda text: command(['docker','exec','pbx_asterisk_1','asterisk','-rx',text])
    registered=application_registered(cli('core show application VoiceMail'))
    restarted=False
    if registered:
        cli('module reload app_voicemail.so')
    else:
        active=cli('core show channels count')
        if not all(re.search(r'^0 active '+kind+r's?$',active,re.M) for kind in ['call','channel']):
            raise ValueError('owned_voicemail_active_call_or_unverified_state')
        # A config reload cannot recreate the application's registration.
        # Use the existing installed module, with an ordinary non-forced unload.
        cli('module unload app_voicemail.so')
        inventory=cli('module show like app_voicemail.so')
        if re.search(r'^app_voicemail[.]so\s',inventory,re.M):
            if restart is None:raise ValueError('owned_voicemail_module_unload_refused')
            restart();restarted=True
        else:
            cli('module load app_voicemail.so')
    if not application_registered(cli('core show application VoiceMail')):
        raise ValueError('owned_voicemail_application_not_registered')
    return {'applicationRegisteredBefore':registered,'applicationRegisteredAfter':True,'moduleReloadedFromDisk':not registered and not restarted,'existingContainerRestarted':restarted}

def voicemail_module_policy(text):
    alternatives=['app_voicemail_imap.so','app_voicemail_odbc.so']
    if any(re.search(r'^\s*(load|require|preload)\s*(?:=>|=)\s*'+re.escape(name)+r'\s*$',text,re.M) for name in alternatives):
        raise ValueError('owned_voicemail_module_policy_conflict')
    result=text.rstrip()+'\n'
    for name in alternatives:
        if not re.search(r'^\s*noload\s*(?:=>|=)\s*'+re.escape(name)+r'\s*$',result,re.M):
            result+='noload='+name+'\n'
    return result

def restart_owned_asterisk():
    cli=lambda text:run(['docker','exec','pbx_asterisk_1','asterisk','-rx',text])
    active=cli('core show channels count')
    if not all(re.search(r'^0 active '+kind+r's?$',active,re.M) for kind in ['call','channel']):raise ValueError('owned_voicemail_active_call_or_unverified_state')
    if run(['docker','inspect','pbx_asterisk_1','--format','{{.Config.Image}}']).strip()!='mlan/asterisk:xtra-1.1.13':raise ValueError('owned_voicemail_container_unverified')
    # Keep the existing image, mounts, TLS identity, carrier and SIP credentials.
    run(['docker','restart','--time','10','pbx_asterisk_1'])
    for attempt in range(30):
        try:
            if application_registered(cli('core show application VoiceMail')):return
        except Exception:pass
        time.sleep(.5)
    raise ValueError('owned_voicemail_restart_application_unavailable')

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
    systems=get(values['SUPABASE_URL']+'/rest/v1/phone_systems?select=id,tenant_id,status,admin_extension&id=eq.'+system,headers)
    if len(systems)!=1:raise ValueError('operator_system_unverified')
    workspaces=get(values['SUPABASE_URL']+'/rest/v1/communication_workspaces?select=id&phone_system_id=eq.'+system,headers)
    if len(workspaces)!=1: raise ValueError('voicemail_workspace_unverified')
    rows=get(values['SUPABASE_URL']+'/rest/v1/communication_extensions?select=extension,display_name,department&enabled=eq.true&workspace_id=eq.'+workspaces[0]['id'],headers)
    owners=get(values['SUPABASE_URL']+'/rest/v1/communication_extensions?select=profile_id,extension,enabled,admin_external_fallback,external_fallback_number,ring_mode&extension=eq.0&workspace_id=eq.'+workspaces[0]['id'],headers)
    if len(owners)!=1:raise ValueError('operator_owner_unverified')
    route=operator_route(systems[0],owners[0])
    enhanced=operator_route(systems[0],{**owners[0],'admin_external_fallback':True,'external_fallback_number':FORWARD_NUMBER,'ring_mode':'ring'})
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
    modules=ROOT/'modules.conf'
    if not modules.is_file() or modules.is_symlink():raise ValueError('owned_voicemail_module_policy_unverified')
    prior_modules=modules.read_text();module_policy=voicemail_module_policy(prior_modules)
    main=ROOT/'extensions.conf';prior=main.read_text()
    destination=ROOT/'elevate-operator.conf'
    if destination.is_symlink():raise ValueError('existing_operator_route_requires_review')
    prior_operator=destination.read_text() if destination.exists() else None
    if prior_operator is not None and prior_operator not in [OPERATOR,enhanced]: raise ValueError('existing_operator_route_requires_review')
    prompt=None;prior_prompt=None
    if route!=OPERATOR:
        container=json.loads(run(['docker','inspect','pbx_asterisk_1']))[0]
        if container['Config']['Image']!='mlan/asterisk:xtra-1.1.13':raise ValueError('operator_container_unverified')
        mounts=[m for m in container['Mounts'] if m['Destination']=='/var/lib/asterisk' and m.get('RW')]
        if len(mounts)!=1:raise ValueError('operator_sound_volume_unverified')
        sound_root=Path(mounts[0]['Source'])
        prompt=sound_root/'sounds/en/custom/elevate-owner-call.wav'
        if not sound_root.is_absolute() or not sound_root.is_dir() or any(p.is_symlink() for p in [prompt,*prompt.parents]):raise ValueError('operator_sound_volume_unverified')
        prior_prompt=prompt.read_bytes() if prompt.exists() else None
        audio=announcement_audio()
    gid=run(['docker','exec','pbx_asterisk_1','id','-g','asterisk']).strip()
    if not gid.isdigit(): raise ValueError('asterisk_group_unverified')
    backup=Path('/var/lib/elevate-pbx/voicemail-backup')
    backup.mkdir(mode=0o700,parents=True,exist_ok=True)
    if not (backup/'extensions.conf').exists(): shutil.copy2(main,backup/'extensions.conf')
    if not (backup/'modules.conf').exists():shutil.copy2(modules,backup/'modules.conf')
    if mailbox.exists() and not (backup/'voicemail.conf').exists(): shutil.copy2(mailbox,backup/'voicemail.conf');os.chmod(backup/'voicemail.conf',0o600)
    if prior_operator is not None:
        evidence=backup/('operator-before-forwarding-'+str(time.time_ns())+'.conf')
        evidence.write_text(prior_operator);os.chmod(evidence,0o600)
    try:
        if prompt is not None:
            prompt.parent.mkdir(parents=True,exist_ok=True,mode=0o755)
            prompt.write_bytes(audio);os.chmod(prompt,0o644)
            run(['docker','exec','--user','asterisk','pbx_asterisk_1','test','-r','/var/lib/asterisk/sounds/en/custom/elevate-owner-call.wav'])
        # Recheck idleness immediately before changing the serving dialplan.
        active=run(['docker','exec','pbx_asterisk_1','asterisk','-rx','core show channels count'])
        if not all(re.search(r'^0 active '+kind+r's?$',active,re.M) for kind in ['call','channel']):raise ValueError('active_call_or_unverified_state')
        mailbox.write_text(text);destination.write_text(route);modules.write_text(module_policy)
        for filename in [mailbox,destination,modules]: os.chmod(filename,0o640);os.chown(filename,0,int(gid))
        if '#include elevate-operator.conf' not in prior: main.write_text(prior+chr(10)+'#include elevate-operator.conf'+chr(10))
        application=ensure_voicemail_application(restart=restart_owned_asterisk)
        run(['docker','exec','pbx_asterisk_1','asterisk','-rx','dialplan reload'])
        users=run(['docker','exec','pbx_asterisk_1','asterisk','-rx','voicemail show users'])
        match=re.search(r'([0-9]+) voicemail users? configured',users)
        plan=run(['docker','exec','pbx_asterisk_1','asterisk','-rx','dialplan show 0@internal'])
        if not match or int(match[1])!=len(rows) or 'Gosub(elevate-operator,s,1)' not in plan:
            raise ValueError('operator_or_mailbox_verification_failed')
        if route!=OPERATOR:
            forwarding=run(['docker','exec','pbx_asterisk_1','asterisk','-rx','dialplan show s@elevate-operator'])
            whisper=run(['docker','exec','pbx_asterisk_1','asterisk','-rx','dialplan show s@elevate-owner-accept'])
            if 'Dial(PJSIP/'+FORWARD_NUMBER+'@twilio,25,U(elevate-owner-accept))' not in forwarding or 'custom/elevate-owner-call' not in whisper or 'MASTER_CHANNEL(ELEVATE_OWNER_ACCEPTED)' not in whisper:
                raise ValueError('operator_forwarding_readback_failed')
    except Exception:
        main.write_text(prior);modules.write_text(prior_modules)
        if prior_operator is None:destination.unlink(missing_ok=True)
        else:destination.write_text(prior_operator)
        if prompt is not None:
            if prior_prompt is None:prompt.unlink(missing_ok=True)
            else:prompt.write_bytes(prior_prompt)
        if previous: mailbox.write_text(previous)
        else: mailbox.unlink(missing_ok=True)
        run(['docker','exec','pbx_asterisk_1','asterisk','-rx','module reload app_voicemail.so'])
        run(['docker','exec','pbx_asterisk_1','asterisk','-rx','dialplan reload'])
        raise
    return {'result':'PASS',**application,'alternateVoicemailProvidersDisabled':True,'operatorConfigured':True,'mailboxCount':len(rows),'adminCellularFallbackConfigured':route!=OPERATOR,'forwardingNumber':FORWARD_NUMBER if route!=OPERATOR else None,'spokenAnnouncementConfigured':prompt is not None,'pressOneAcceptanceRequired':prompt is not None,'carrierRoutingChanged':False,'liveCallAcceptance':'NOT TESTED'}
if __name__=='__main__':
    try: result=configure()
    except Exception as error:
        result={'result':'BLOCKED','code':str(error) if isinstance(error,ValueError) and re.fullmatch('[a-z_]+',str(error)) else 'owned_voicemail_configuration_unavailable'}
    print(json.dumps(result))
    raise SystemExit(0 if result['result']=='PASS' else 1)
