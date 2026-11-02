#!/usr/bin/env python3
"""Observe only the owned synthetic call; remove the private temporary log channel in finally."""
import base64,json,re,time,urllib.request,urllib.parse,subprocess,uuid,os
from pathlib import Path
DID='14632401404'
PHASE='identity'
PREFLIGHT=os.environ.get('OWNED_PHONE_TRACE_PREFLIGHT')=='1'
DIRECT_MAILBOX=os.environ.get('OWNED_PHONE_MAILBOX_TEST')=='1'
def cli(command):
 p=subprocess.run(['docker','exec','pbx_asterisk_1','asterisk','-rx',command],capture_output=True,text=True,timeout=10)
 if p.returncode:raise ValueError()
 return p.stdout

def scoped_trace(logs,names):
 logs=re.sub(r'\x1b\[[0-9;]*[A-Za-z]','',logs)
 lines=logs.splitlines()
 tags={tag for line in lines if any(name in line for name in names) for tag in re.findall(r'\[C-[0-9a-f]+\]',line,re.I)}
 selected=[line for line in lines if any(name in line for name in names) or any(tag in line for tag in tags)]
 executions=[];errors=[]
 for line in selected:
  m=re.search(r'Executing \[([^@]+)@([A-Za-z0-9_-]+):([0-9]+)\]\s+([A-Za-z]+)',line)
  if m:executions.append({'context':m[2],'priority':int(m[3]),'application':m[4]})
  if re.search(r'\b(?:WARNING|ERROR|NOTICE)\b',line):
   source=re.search(r'([A-Za-z0-9_]+[.]c):([0-9]+)\s+([A-Za-z0-9_]+):',line)
   if source:errors.append({'sourceFile':source[1],'line':int(source[2]),'function':source[3]})
 return {'ownedExecution':executions[-40:],'ownedWarnings':errors[-12:],'matchingLineCount':len(selected),'capturedLogLines':len(lines),'nonzeroExit':any('exited non-zero' in line for line in selected)}
def get(url,headers):
 with urllib.request.urlopen(urllib.request.Request(url,headers=headers),timeout=4) as r:return json.loads(r.read(1048576))
def main():
 global PHASE
 values={}
 for line in Path('/etc/elevate-pbx/paris.conf').read_text().splitlines():
  m=re.fullmatch(r'([A-Z_0-9]+)=(.*)',line.strip())
  if m:values[m[1]]=m[2].strip().strip('"').strip("'")
 ref=values.get('PARIS_ARI_PASSWORD_SECRET','')
 if values.get('PARIS_ARI_USER')!='elevate-paris' or not re.fullmatch(r'projects/(elegant-racer-299721|484736877039)/secrets/[A-Za-z0-9_-]+/versions/([0-9]+|latest)',ref):raise ValueError()
 identity=get('http://169.254.169.254/computeMetadata/v1/instance/service-accounts/default/token',{'Metadata-Flavor':'Google'})
 secret=get('https://secretmanager.googleapis.com/v1/'+ref+':access',{'Authorization':'Bearer '+identity['access_token']})
 password=base64.b64decode(secret['payload']['data']).decode().strip()
 headers={'Authorization':'Basic '+base64.b64encode(('elevate-paris:'+password).encode()).decode()}
 started=time.monotonic();events=[];last=None;observed=False;missing=0;names=set();handoff=False
 capture='efhvm_'+uuid.uuid4().hex[:10]
 path='/var/log/asterisk/'+capture
 PHASE='private_log_file'
 pid=subprocess.run(['docker','exec','pbx_asterisk_1','pidof','asterisk'],capture_output=True,text=True,timeout=10).stdout.strip()
 if not re.fullmatch('[0-9]+',pid):raise ValueError()
 status=subprocess.run(['docker','exec','pbx_asterisk_1','cat','/proc/'+pid+'/status'],capture_output=True,text=True,timeout=10).stdout
 uid=re.search(r'^Uid:\s+[0-9]+\s+([0-9]+)',status,re.M);gid=re.search(r'^Gid:\s+[0-9]+\s+([0-9]+)',status,re.M)
 if not uid or not gid:raise ValueError()
 owner=uid[1]+':'+gid[1]
 for command in [['touch',path],['chown',owner,path],['chmod','600',path]]:
  subprocess.run(['docker','exec','pbx_asterisk_1',*command],capture_output=True,timeout=10,check=True)
 cleanup=False;trace={}
 try:
  PHASE='temporary_log_channel'
  cli('logger add channel '+capture+' notice,warning,error,verbose(5),dtmf')
  if capture not in cli('logger show channels'):raise ValueError()
  if DIRECT_MAILBOX and 'VoiceMail(0@elevate,u)' not in cli('dialplan show s@elevate-operator'):raise ValueError()
  PHASE='owned_call_observation'
  while not PREFLIGHT and time.monotonic()-started<42:
   rows=get('http://127.0.0.1:8088/ari/channels',headers)
   owned=[c for c in rows if re.sub('[^0-9]','',str(c.get('caller',{}).get('number',''))) in [DID,DID[1:]] and str(c.get('name','')).startswith('PJSIP/twilio-')]
   if len(owned)>1:raise ValueError()
   if owned:
    observed=True;missing=0;c=owned[0];names.add(c['name']);d=c.get('dialplan',{})
    app=d.get('app_name','');context=d.get('context','')
    if DIRECT_MAILBOX and not handoff and time.monotonic()-started>=24:
     if app!='Stasis' or context!='elevate-paris-inbound' or not re.fullmatch('[A-Za-z0-9._:-]{1,128}',c.get('id','')):raise ValueError()
     handoff=True
     query=urllib.parse.urlencode({'context':'elevate-operator','extension':'s','label':'voicemail'})
     request=urllib.request.Request('http://127.0.0.1:8088/ari/channels/'+urllib.parse.quote(c['id'],safe='')+'/continue?'+query,headers=headers,data=b'',method='POST')
     with urllib.request.urlopen(request,timeout=4) as response:
      if response.status!=204:raise ValueError()
    event={'application':app if re.fullmatch('[A-Za-z0-9_]+',app) else 'other','context':context if re.fullmatch('[A-Za-z0-9_-]+',context) else 'other','state':c.get('state') if c.get('state') in ['Up','Down','Ring','Ringing'] else 'other'}
    key=json.dumps(event,sort_keys=True)
    if key!=last:events.append({'elapsedSeconds':round(time.monotonic()-started,1),**event});last=key
   elif observed:
    missing+=1
    if missing>=10:events.append({'elapsedSeconds':round(time.monotonic()-started,1),'application':'ended'});break
   time.sleep(.15)
 finally:
  cli('logger remove channel '+capture)
  cleanup=capture not in cli('logger show channels')
  raw=subprocess.run(['docker','exec','pbx_asterisk_1','tail','-n','1000',path],capture_output=True,text=True,timeout=10)
  trace=scoped_trace(raw.stdout,names)
 print(json.dumps({'tracePreflight':PREFLIGHT,'ownedVoicemailObservation':True,'temporaryLoggingRemoved':cleanup,'routingChanged':False,'directOwnedMailboxTest':DIRECT_MAILBOX,'ownedMailboxHandoffRequested':handoff,'trace':trace,'callsPlaced':0,'callerObserved':observed,'transitions':events[:50]}))
if __name__=='__main__':
 try:main()
 except Exception as e:print(json.dumps({'ownedVoicemailObservation':True,'error':'OWNED_CALL_OBSERVATION_UNAVAILABLE','phase':PHASE,'exceptionClass':type(e).__name__,'callsPlaced':0}));raise SystemExit(1 if PREFLIGHT else 0)
