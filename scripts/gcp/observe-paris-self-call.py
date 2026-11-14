#!/usr/bin/env python3
"""Read RTP counters only for the owned business self-call; never emit caller data."""
import base64,ipaddress,json,re,time,urllib.request,urllib.parse,socket,struct
from pathlib import Path

def fetch(url,headers):
 request=urllib.request.Request(url,headers=headers)
 with urllib.request.urlopen(request,timeout=4) as response:return json.loads(response.read(1048576))

def main():
 values={}
 for line in Path('/etc/elevate-pbx/paris.conf').read_text().splitlines():
  match=re.fullmatch(r'([A-Z_0-9]+)=(.*)',line.strip())
  if match:values[match[1]]=match[2].strip().strip('"').strip("'")
 ref=values.get('PARIS_ARI_PASSWORD_SECRET','')
 if not re.fullmatch(r'projects/(elegant-racer-299721|484736877039)/secrets/[A-Za-z0-9_-]+/versions/([0-9]+|latest)',ref):raise ValueError('reference_unverified')
 token=fetch('http://169.254.169.254/computeMetadata/v1/instance/service-accounts/default/token',{'Metadata-Flavor':'Google'})['access_token']
 password=base64.b64decode(fetch('https://secretmanager.googleapis.com/v1/'+ref+':access',{'Authorization':'Bearer '+token})['payload']['data']).decode().strip()
 user=values.get('PARIS_ARI_USER')
 if user!='elevate-paris':raise ValueError('ari_identity_unverified')
 headers={'Authorization':'Basic '+base64.b64encode((user+':'+password).encode()).decode()}
 def ari(path):return fetch('http://127.0.0.1:8088/ari'+path,headers)
 def stats(channel,kind):
  cid=channel.get('id','')
  if not re.fullmatch(r'[a-zA-Z0-9._:-]{1,128}',cid):return {'kind':kind,'unavailable':True}
  path='/channels/'+urllib.parse.quote(cid,safe='')
  try:data=ari(path+'/rtp_statistics')
  except Exception:data={}
  result={'kind':kind,'state':channel.get('state') if channel.get('state') in ['Up','Down','Ring','Ringing'] else 'other'}
  for key in ['txcount','rxcount','txoctetcount','rxoctetcount','txploss','rxploss']:
   if isinstance(data.get(key),(int,float)):result[key]=data[key]
  if kind=='media':result['transport']='tcp' if str(channel.get('name','')).startswith('AudioSocket/') else 'udp'
  if kind=='carrier':
   try:
    value=ari(path+'/variable?'+urllib.parse.urlencode({'variable':'CHANNEL(rtp,dest)'})).get('value','')
    address,port=value.rsplit(':',1);ip=ipaddress.ip_address(address.strip('[]'))
    result['destinationPublic']=ip.is_global;result['destinationLoopback']=ip.is_loopback
    if ip.is_global:result['publicDestination']=str(ip)
    if port.isdigit():result['destinationPort']=int(port)
   except Exception:result['destinationUnavailable']=True
  return result
 def loopback_flow(media):
  # Receive only Ethernet/IP/UDP headers, never RTP headers or audio payload.
  pairs=[]
  for c in media:
   cid=c.get('id','')
   name=c.get('name','')
   match=re.match(r'^UnicastRTP/127[.]0[.]0[.]1:(\d+)-',name)
   if not match:continue
   try:
    port=ari('/channels/'+urllib.parse.quote(cid,safe='')+'/variable?variable=UNICASTRTP_LOCAL_PORT').get('value','')
    if str(port).isdigit():pairs.append((int(match[1]),int(port)))
   except Exception:pass
  counts={'ownedPortPairs':len(pairs),'gatewayToAsterisk':0,'asteriskToGateway':0}
  if not pairs:return counts
  try:
   with socket.socket(socket.AF_PACKET,socket.SOCK_RAW,socket.htons(0x0800)) as capture:
    capture.bind(('lo',0));capture.settimeout(.1)
    deadline=time.monotonic()+2.5
    while time.monotonic()<deadline:
     try:header=capture.recv(42)
     except socket.timeout:continue
     if len(header)!=42 or header[14]!=0x45 or header[23]!=17 or header[26:34]!=bytes([127,0,0,1,127,0,0,1]):continue
     source,destination=struct.unpack('!HH',header[34:38])
     for gateway,asterisk in pairs:
      if (source,destination)==(gateway,asterisk):counts['gatewayToAsterisk']+=1
      elif (source,destination)==(asterisk,gateway):counts['asteriskToGateway']+=1
  except Exception:counts['headerCountersUnavailable']=True
  return counts
 samples=[]
 started=time.monotonic()
 for sample in range(5):
  sample_started=time.monotonic()
  channels=ari('/channels')
  own=[c for c in channels if str(c.get('name','')).startswith('PJSIP/twilio-') and re.sub(r'[^0-9]','',str(c.get('caller',{}).get('number',''))) in ['14632401404','4632401404']]
  sample_data={'offset':round(sample_started-started,1),'ownedCarrierCount':len(own),'totalCarrierCount':sum(str(c.get('name','')).startswith('PJSIP/twilio-') for c in channels),'carrier':[stats(c,'carrier') for c in own],'bridges':[],'media':[]}
  owned_media=[]
  if own:
   ids={c['id'] for c in own}
   for bridge in ari('/bridges'):
    if ids.intersection(bridge.get('channels',[])):
     sample_data['bridges'].append({'technology':bridge.get('technology'),'type':bridge.get('bridge_type'),'channelCount':len(bridge.get('channels',[]))})
     for c in channels:
      if c['id'] in bridge.get('channels',[]) and c['id'].startswith('paris-media-'):
       sample_data['media'].append(stats(c,'media'));owned_media.append(c)
  sample_data['loopbackHeaderCounters']=loopback_flow(owned_media)
  samples.append(sample_data)
  if sample<4:time.sleep(max(0,3-(time.monotonic()-sample_started)))
 print(json.dumps({'readOnlyRtpMonitor':True,'callsPlaced':0,'samples':samples}))
if __name__=='__main__':
 try:main()
 except Exception:print(json.dumps({'readOnlyRtpMonitor':True,'callsPlaced':0,'error':'SELF_CALL_RTP_MONITOR_UNAVAILABLE'}));raise SystemExit(1)
