#!/usr/bin/env python3
"""Authorized admin-only Asterisk recording -> worker -> private inbox acceptance.

Creates one clearly labeled local test call. Does not place a PSTN carrier call.
Credentials and recordings stay on the existing PBX; only receipts are printed.
"""
import base64,hashlib,io,json,os,re,subprocess,tempfile,time,urllib.request,uuid,wave
from pathlib import Path
SYSTEM='341f59a3-b1d6-4360-8463-0ce0402f86fe'
ADMIN='964dc85a-bce8-4e67-92eb-198ffafb2384'
DB='https://cuxzzpsyufcewtmicszk.supabase.co'
ROOT=Path('/opt/elevate-pbx/repo/infra/pbx/asterisk')
def run(args):
 r=subprocess.run(args,capture_output=True,text=True,timeout=20)
 if r.returncode:raise ValueError('VOICEMAIL_TEST_COMMAND_FAILED')
 return re.sub(r'\x1b\[[0-?]*[ -/]*[@-~]','',r.stdout)
def cli(value):return run(['docker','exec','pbx_asterisk_1','asterisk','-rx',value])
def request(url,headers,binary=False):
 with urllib.request.urlopen(urllib.request.Request(url,headers=headers),timeout=20) as r:
  body=r.read(1100001)
  if len(body)>1100000:raise ValueError('VOICEMAIL_TEST_READBACK_TOO_LARGE')
  return body if binary else json.loads(body)
def authority():
 values={}
 for line in Path('/etc/elevate-pbx/provisioner.conf').read_text().splitlines():
  match=re.fullmatch(r'([A-Z_0-9]+)=(.*)',line.strip())
  if match:values[match[1]]=match[2].strip().strip('"').strip("'")
 ref=values.get('SUPABASE_SERVICE_ROLE_KEY_SECRET','')
 if values.get('SUPABASE_URL','').rstrip('/')!=DB or values.get('PBX_PHONE_SYSTEM_ID')!=SYSTEM or not re.fullmatch(r'projects/(elegant-racer-299721|484736877039)/secrets/[A-Za-z0-9_-]+/versions/([0-9]+|latest)',ref):raise ValueError('VOICEMAIL_TEST_AUTHORITY_UNVERIFIED')
 identity=request('http://169.254.169.254/computeMetadata/v1/instance/service-accounts/default/token',{'Metadata-Flavor':'Google'})
 secret=request('https://secretmanager.googleapis.com/v1/'+ref+':access',{'Authorization':'Bearer '+identity['access_token']})
 key=base64.b64decode(secret['payload']['data']).decode().strip()
 return {'apikey':key,'Authorization':'Bearer '+key}
def message_id(metadata):
 digest=hashlib.sha256((SYSTEM+':0:'+metadata['origtime']+':'+metadata['callerchan']).encode()).hexdigest()[:32]
 return digest[:8]+'-'+digest[8:12]+'-5'+digest[13:16]+'-a'+digest[17:20]+'-'+digest[20:]
def wav_data(path):
 if path.is_symlink():raise ValueError('VOICEMAIL_TEST_AUDIO_SYMLINK')
 with wave.open(str(path),'rb') as audio:
  if (audio.getnchannels(),audio.getsampwidth(),audio.getframerate(),audio.getcomptype())!=(1,2,8000,'NONE'):raise ValueError('VOICEMAIL_TEST_AUDIO_FORMAT')
  frames=audio.readframes(audio.getnframes())
 if not 16000<=len(frames)<=480000:raise ValueError('VOICEMAIL_TEST_AUDIO_DURATION')
 return frames
def verify_saved(message,call,task,stored,recorded,identity):
 if message.get('id')!=identity or message.get('call_id')!=identity or message.get('phone_system_id')!=SYSTEM or message.get('assigned_profile_id')!=ADMIN or message.get('recording_url')!='supabase://phone-voicemails/'+identity+'.wav' or not message.get('transcription','').strip() or not message.get('duration_seconds',0)>0:raise ValueError('VOICEMAIL_TEST_INBOX_READBACK_FAILED')
 if call.get('id')!=identity or call.get('provider')!='asterisk' or call.get('direction')!='inbound' or call.get('assigned_profile_id')!=ADMIN:raise ValueError('VOICEMAIL_TEST_CALL_READBACK_FAILED')
 if task.get('id')!=identity or task.get('source')!='voicemail' or task.get('assigned_profile_id')!=ADMIN:raise ValueError('VOICEMAIL_TEST_TASK_READBACK_FAILED')
 if len(stored)<44 or stored[:4]!=b'RIFF' or stored[8:12]!=b'WAVE' or hashlib.sha256(stored).digest()!=hashlib.sha256(recorded).digest():raise ValueError('VOICEMAIL_TEST_AUDIO_READBACK_FAILED')
def perform():
 if os.environ.get('AUTHORIZED_VOICEMAIL_DELIVERY_TEST')!='admin-extension-0':raise ValueError('VOICEMAIL_TEST_AUTHORIZATION_REQUIRED')
 headers=authority()
 def rows(table,query):return request(DB+'/rest/v1/'+table+'?'+query,headers)
 system=rows('phone_systems','select=id,status,admin_extension,voicemail_enabled&id=eq.'+SYSTEM)
 if len(system)!=1 or system[0]['status']!='active' or system[0]['admin_extension']!='0' or not system[0]['voicemail_enabled']:raise ValueError('VOICEMAIL_TEST_SYSTEM_UNVERIFIED')
 workspace=rows('communication_workspaces','select=id&phone_system_id=eq.'+SYSTEM)
 if len(workspace)!=1:raise ValueError('VOICEMAIL_TEST_WORKSPACE_UNVERIFIED')
 recipient=rows('communication_extensions','select=profile_id&enabled=eq.true&extension=eq.0&workspace_id=eq.'+workspace[0]['id'])
 profile=rows('profiles','select=id,role,is_active,suspended&id=eq.'+ADMIN)
 if len(recipient)!=1 or recipient[0]['profile_id']!=ADMIN or len(profile)!=1 or profile[0]['is_active'] is not True or profile[0]['suspended'] or profile[0]['role'] not in ['admin','super_admin']:raise ValueError('VOICEMAIL_TEST_RECIPIENT_UNVERIFIED')
 state=cli('core show channels count')
 if not all(re.search(r'^0 active '+kind+r's?$',state,re.M) for kind in ['call','channel']):raise ValueError('VOICEMAIL_TEST_ACTIVE_CALLS')
 if run(['systemctl','is-active','elevate-voicemail-worker.service']).strip()!='active':raise ValueError('VOICEMAIL_TEST_WORKER_INACTIVE')
 mounts=json.loads(run(['docker','inspect','pbx_asterisk_1','--format','{{json .Mounts}}']))
 mount=next((entry for entry in mounts if entry.get('Destination')=='/var/spool/asterisk'),None)
 if not mount:raise ValueError('VOICEMAIL_TEST_SPOOL_UNVERIFIED')
 mailbox=(Path(mount['Source'])/'voicemail/elevate/0').resolve(strict=True)
 greeting=mailbox/'temp.wav' if (mailbox/'temp.wav').is_file() else mailbox/'unavail.wav'
 greeting_frames=wav_data(greeting)
 fixture=wav_data(Path('/tmp/elevate-voicemail-delivery-fixture.wav'))
 lead=len(greeting_frames)/16000+1.5
 if lead+len(fixture)/16000>50:raise ValueError('VOICEMAIL_TEST_TOTAL_AUDIO_TOO_LONG')
 token=uuid.uuid4().hex;context='elevate-voicemail-check-'+token
 fragment=ROOT/(context+'.conf');sound=ROOT/(context+'.wav');main=ROOT/'extensions.conf';include='#include '+fragment.name
 if main.is_symlink() or fragment.exists() or sound.exists():raise ValueError('VOICEMAIL_TEST_CONFIGURATION_UNVERIFIED')
 gid=run(['docker','exec','pbx_asterisk_1','id','-g','asterisk']).strip()
 if not gid.isdigit():raise ValueError('VOICEMAIL_TEST_GROUP_UNVERIFIED')
 metadata=None;recorded_path=None;identity=None
 try:
  with wave.open(str(sound),'wb') as audio:
   audio.setnchannels(1);audio.setsampwidth(2);audio.setframerate(8000);audio.writeframes(bytes(int(lead*8000)*2)+fixture+bytes(16000))
  fragment.write_text('['+context+']\nexten => s,1,Set(CALLERID(name)=Elevate voicemail delivery verification)\n same => n,Set(CALLERID(num)=0)\n same => n,Answer()\n same => n,VoiceMail(0@elevate,us)\n same => n,Hangup()\n')
  for path in [sound,fragment]:os.chmod(path,0o640);os.chown(path,0,int(gid))
  main.write_text(main.read_text()+'\n'+include+'\n');cli('dialplan reload')
  if 'VoiceMail(0@elevate,us)' not in cli('dialplan show s@'+context):raise ValueError('VOICEMAIL_TEST_DIALPLAN_UNVERIFIED')
  cli('channel originate Local/s@'+context+'/n application Playback /etc/asterisk/'+context)
  deadline=time.monotonic()+180
  while time.monotonic()<deadline:
   if context in cli('core show channels concise'):time.sleep(2);continue
   for text in (mailbox/'INBOX').glob('msg*.txt'):
    if text.is_symlink():continue
    values=dict(line.split('=',1) for line in text.read_text().splitlines() if '=' in line)
    if context in values.get('callerchan',''):
     metadata=values;recorded_path=text.with_suffix('.wav');identity=message_id(values);break
   if identity:
    message=rows('voicemails','select=*&id=eq.'+identity)
    call=rows('phone_calls','select=id,provider,direction,assigned_profile_id&id=eq.'+identity)
    task=rows('phone_callback_tasks','select=id,source,assigned_profile_id&id=eq.'+identity)
    if len(message)==len(call)==len(task)==1:
     stored=request(DB+'/storage/v1/object/authenticated/phone-voicemails/'+identity+'.wav',headers,binary=True)
     verify_saved(message[0],call[0],task[0],stored,recorded_path.read_bytes(),identity)
     notices=rows('phone_notification_deliveries','select=channel,status&task_id=eq.'+identity+'&recipient_profile_id=eq.'+ADMIN)
     return {'messageId':identity,'asteriskRecordingVerified':True,'workerDeliveryVerified':True,'privateAudioReadbackVerified':True,'transcriptAvailable':True,'assignedAdminVerified':True,'callbackTaskVerified':True,'notificationEvidence':notices,'carrierCallsPlaced':0,'pstnInboundAcceptance':'NOT_TESTED'}
   time.sleep(3)
  raise ValueError('VOICEMAIL_TEST_DELIVERY_TIMEOUT')
 finally:
  # Remove only our test include and channels; preserve concurrent configuration.
  for line in cli('core show channels concise').splitlines():
   channel=line.split('!',1)[0]
   if re.fullmatch(r'Local/s@'+re.escape(context)+r'-[a-fA-F0-9]+;[12]',channel):cli('channel request hangup '+channel)
  main.write_text(main.read_text().replace('\n'+include+'\n','\n'));cli('dialplan reload')
  fragment.unlink(missing_ok=True);sound.unlink(missing_ok=True)
if __name__=='__main__':
 try:print(json.dumps(perform()))
 except Exception as error:
  reason=str(error) if re.fullmatch(r'VOICEMAIL_TEST_[A-Z_]+',str(error)) else 'VOICEMAIL_TEST_UNEXPECTED_FAILURE'
  print(json.dumps({'result':'FAIL','code':reason,'pstnInboundAcceptance':'NOT_TESTED'}));raise SystemExit(1)
