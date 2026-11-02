#!/usr/bin/env python3
"""Read only the approved operator route and worker health; never emit caller data."""
import json,re,subprocess,hashlib,base64,urllib.request
from pathlib import Path

def run(args):
 result=subprocess.run(args,capture_output=True,text=True,timeout=20)
 if result.returncode:raise ValueError('PHONE_ACCEPTANCE_COMMAND_FAILED')
 return result.stdout

def paris_application_registered():
 try:
  values={}
  for line in Path('/etc/elevate-pbx/paris.conf').read_text().splitlines():
   m=re.fullmatch(r'([A-Z_0-9]+)=(.*)',line.strip())
   if m:values[m[1]]=m[2].strip().strip('"').strip("'")
  ref=values.get('PARIS_ARI_PASSWORD_SECRET','')
  if values.get('PARIS_ARI_USER')!='elevate-paris' or not re.fullmatch(r'projects/(elegant-racer-299721|484736877039)/secrets/[A-Za-z0-9_-]+/versions/([0-9]+|latest)',ref):return False
  def get(url,headers):
   with urllib.request.urlopen(urllib.request.Request(url,headers=headers),timeout=5) as response:return json.loads(response.read(1048576))
  identity=get('http://169.254.169.254/computeMetadata/v1/instance/service-accounts/default/token',{'Metadata-Flavor':'Google'})
  secret=get('https://secretmanager.googleapis.com/v1/'+ref+':access',{'Authorization':'Bearer '+identity['access_token']})
  password=base64.b64decode(secret['payload']['data']).decode().strip()
  app=get('http://127.0.0.1:8088/ari/applications/elevate-paris',{'Authorization':'Basic '+base64.b64encode(('elevate-paris:'+password).encode()).decode()})
  return app.get('name')=='elevate-paris' and isinstance(app.get('channel_ids'),list)
 except Exception:return False

def preflight():
 cli=lambda value:run(['docker','exec','pbx_asterisk_1','asterisk','-rx',value])
 active=cli('core show channels count')
 idle=all(re.search(r'^0 active '+kind+r's?\s*$',active,re.M) for kind in ['call','channel'])
 operator=cli('dialplan show 0@internal');fallback=cli('dialplan show s@elevate-operator');generated=cli('dialplan show 0@elevate-pwa-extensions')
 targets=set(re.findall(r'PJSIP_DIAL_CONTACTS\((pwa-[a-f0-9]{40})\)',generated))
 contacts=sum(len(re.findall(r'^\s*Contact:\s+\S+',cli('pjsip show aor '+endpoint),re.M)) for endpoint in targets)
 journal=run(['journalctl','-u','elevate-voicemail-worker.service','--since','30 minutes ago','--no-pager','-o','cat'])
 files={}
 for label,path in [('gateway','/opt/elevate-pbx/paris/ari-media.mjs'),('voicemailWorker','/opt/elevate-pbx/voicemail/worker.mjs')]:
  p=Path(path)
  if p.is_file():files[label]=hashlib.sha256(p.read_bytes()).hexdigest()
 return {'phoneAcceptancePreflight':True,'callsPlaced':0,'messagesSent':0,'idle':idle,
  'gatewayARIApplicationRegistered':paris_application_registered(),
  'operatorEntryVerified':'Gosub(elevate-operator,s,1)' in operator,
  'operatorDeviceRouteVerified':'Gosub(elevate-pwa-extensions,0,1)' in fallback,
  'operatorVoicemailFallbackVerified':'VoiceMail(0@elevate,u)' in fallback,
  'operatorRegisteredContacts':contacts,'operatorLeasedEndpointCount':len(targets),
  'operatorVoicemailPromptsReady':all(subprocess.run(['docker','exec','--user','asterisk','pbx_asterisk_1','test','-r','/var/lib/asterisk/sounds/en/'+name],capture_output=True,timeout=10).returncode==0 for name in ['beep.ulaw','vm-intro.ulaw','vm-theperson.ulaw','vm-isunavail.ulaw','digits/0.ulaw']),
  'operatorVoicemailApplicationRegistered':"Info about Application 'VoiceMail'" in cli('core show application VoiceMail'),
  'operatorMailboxConfigured':bool(re.search(r'^\s*elevate\s+0\s+',cli('voicemail show users'),re.M)),
  'voicemailWorkerActive':run(['systemctl','is-active','elevate-voicemail-worker.service']).strip()=='active',
  'recentIngestRetryStatuses':sorted(set(re.findall(r'OWNED_VOICEMAIL_INGEST_REQUIRES_RETRY_(\d{3})',journal))),
  'recentMessageRetries':journal.count('OWNED_VOICEMAIL_MESSAGE_REQUIRES_RETRY'),'sourceSha256':files}
if __name__=='__main__':
 try:print(json.dumps(preflight()))
 except Exception:print(json.dumps({'phoneAcceptancePreflight':True,'error':'PHONE_ACCEPTANCE_PREFLIGHT_UNAVAILABLE','callsPlaced':0}));raise SystemExit(1)
