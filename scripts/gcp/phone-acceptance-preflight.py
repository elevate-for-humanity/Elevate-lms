#!/usr/bin/env python3
"""Read only the approved operator route and worker health; never emit caller data."""
import json,re,subprocess,hashlib
from pathlib import Path

def run(args):
 result=subprocess.run(args,capture_output=True,text=True,timeout=20)
 if result.returncode:raise ValueError('PHONE_ACCEPTANCE_COMMAND_FAILED')
 return result.stdout

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
  'operatorEntryVerified':'Gosub(elevate-operator,s,1)' in operator,
  'operatorDeviceRouteVerified':'Gosub(elevate-pwa-extensions,0,1)' in fallback,
  'operatorVoicemailFallbackVerified':'VoiceMail(0@elevate,u)' in fallback,
  'operatorRegisteredContacts':contacts,'operatorLeasedEndpointCount':len(targets),
  'operatorMailboxConfigured':bool(re.search(r'^\s*elevate\s+0\s+',cli('voicemail show users'),re.M)),
  'voicemailWorkerActive':run(['systemctl','is-active','elevate-voicemail-worker.service']).strip()=='active',
  'recentIngestRetryStatuses':sorted(set(re.findall(r'OWNED_VOICEMAIL_INGEST_REQUIRES_RETRY_(\d{3})',journal))),
  'recentMessageRetries':journal.count('OWNED_VOICEMAIL_MESSAGE_REQUIRES_RETRY'),'sourceSha256':files}
if __name__=='__main__':
 try:print(json.dumps(preflight()))
 except Exception:print(json.dumps({'phoneAcceptancePreflight':True,'error':'PHONE_ACCEPTANCE_PREFLIGHT_UNAVAILABLE','callsPlaced':0}));raise SystemExit(1)
