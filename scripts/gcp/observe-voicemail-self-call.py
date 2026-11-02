#!/usr/bin/env python3
"""Read only the owned synthetic caller's ARI application transitions; no audio or writes."""
import base64,json,re,time,urllib.request
from pathlib import Path
DID='14632401404'
def get(url,headers):
 with urllib.request.urlopen(urllib.request.Request(url,headers=headers),timeout=4) as r:return json.loads(r.read(1048576))
def main():
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
 started=time.monotonic();events=[];last=None;observed=False;missing=0
 while time.monotonic()-started<42:
  rows=get('http://127.0.0.1:8088/ari/channels',headers)
  owned=[c for c in rows if re.sub('[^0-9]','',str(c.get('caller',{}).get('number',''))) in [DID,DID[1:]] and str(c.get('name','')).startswith('PJSIP/twilio-')]
  if len(owned)>1:raise ValueError()
  if owned:
   observed=True;missing=0;c=owned[0];d=c.get('dialplan',{})
   app=d.get('app_name','');context=d.get('context','')
   event={'application':app if re.fullmatch('[A-Za-z0-9_]+',app) else 'other','context':context if re.fullmatch('[A-Za-z0-9_-]+',context) else 'other','state':c.get('state') if c.get('state') in ['Up','Down','Ring','Ringing'] else 'other'}
   key=json.dumps(event,sort_keys=True)
   if key!=last:events.append({'elapsedSeconds':round(time.monotonic()-started,1),**event});last=key
  elif observed:
   missing+=1
   if missing>=10:events.append({'elapsedSeconds':round(time.monotonic()-started,1),'application':'ended'});break
  time.sleep(.15)
 print(json.dumps({'ownedVoicemailObservation':True,'readOnly':True,'callsPlaced':0,'callerObserved':observed,'transitions':events[:50]}))
if __name__=='__main__':
 try:main()
 except Exception:print(json.dumps({'ownedVoicemailObservation':True,'error':'OWNED_CALL_OBSERVATION_UNAVAILABLE','callsPlaced':0}));raise SystemExit(1)
