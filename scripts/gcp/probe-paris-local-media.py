#!/usr/bin/env python3
"""Exercise two ephemeral loopback-only ARI media channels; never place a phone call."""
import base64,concurrent.futures,json,re,socket,struct,time,urllib.request,urllib.parse,uuid
from pathlib import Path

def main():
 values={}
 for line in Path('/etc/elevate-pbx/paris.conf').read_text().splitlines():
  match=re.fullmatch(r'([A-Z_0-9]+)=(.*)',line.strip())
  if match:values[match[1]]=match[2].strip().strip('"').strip("'")
 def fetch(url,headers):
  with urllib.request.urlopen(urllib.request.Request(url,headers=headers),timeout=5) as r:return json.load(r)
 ref=values.get('PARIS_ARI_PASSWORD_SECRET','')
 if not re.fullmatch(r'projects/(elegant-racer-299721|484736877039)/secrets/[A-Za-z0-9_-]+/versions/([0-9]+|latest)',ref) or values.get('PARIS_ARI_USER')!='elevate-paris':raise ValueError('PROBE_IDENTITY_UNVERIFIED')
 token=fetch('http://169.254.169.254/computeMetadata/v1/instance/service-accounts/default/token',{'Metadata-Flavor':'Google'})['access_token']
 password=base64.b64decode(fetch('https://secretmanager.googleapis.com/v1/'+ref+':access',{'Authorization':'Bearer '+token})['payload']['data']).decode().strip()
 headers={'Authorization':'Basic '+base64.b64encode(('elevate-paris:'+password).encode()).decode()}
 def ari(path,method='GET',**query):
  url='http://127.0.0.1:8088/ari'+path+('?' + urllib.parse.urlencode(query) if query else '')
  with urllib.request.urlopen(urllib.request.Request(url,headers=headers,method=method),timeout=5) as r:
   text=r.read(1048576);return json.loads(text) if text else {}
 if ari('/channels'):raise ValueError('PROBE_CHANNELS_NOT_IDLE')
 prefix='paris-probe-'+uuid.uuid4().hex
 ids=[prefix+'-a',prefix+'-b'];bridge_id=prefix+'-bridge';sockets=[];peers=[];created=[];bridged=False
 try:
  for cid in ids:
   sock=socket.socket(socket.AF_INET,socket.SOCK_DGRAM);sock.bind(('127.0.0.1',0));sock.settimeout(.1);sockets.append(sock)
   external=ari('/channels/externalMedia','POST',channelId=cid,app='elevate-paris',external_host='127.0.0.1:'+str(sock.getsockname()[1]),format='ulaw',direction='both',transport='udp',encapsulation='rtp',connection_type='client')
   created.append(cid)
   if external.get('id')!=cid:raise ValueError('PROBE_CHANNEL_MISMATCH')
   data=external.get('channelvars',{})
   for key in ['UNICASTRTP_LOCAL_ADDRESS','UNICASTRTP_LOCAL_PORT']:
    if key not in data:data[key]=ari('/channels/'+cid+'/variable',variable=key)['value']
   if data['UNICASTRTP_LOCAL_ADDRESS'] not in ['127.0.0.1','0.0.0.0'] or not str(data['UNICASTRTP_LOCAL_PORT']).isdigit() or not 1024<=int(data['UNICASTRTP_LOCAL_PORT'])<=65535:raise ValueError('PROBE_NONLOOPBACK_PEER')
   peers.append(('127.0.0.1',int(data['UNICASTRTP_LOCAL_PORT'])))
  bridge=ari('/bridges','POST',bridgeId=bridge_id,type='mixing,proxy_media',name=prefix)
  if bridge.get('id')!=bridge_id:raise ValueError('PROBE_BRIDGE_MISMATCH')
  bridged=True;ari('/bridges/'+bridge_id+'/addChannel','POST',channel=','.join(ids))
  def receive(sock):
   count=0;deadline=time.monotonic()+3
   while time.monotonic()<deadline:
    try:packet,source=sock.recvfrom(2048)
    except socket.timeout:continue
    if source[0]=='127.0.0.1' and len(packet)>=172 and packet[0]>>6==2 and packet[1]&127==0:count+=1
   return count
  with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
   results=[pool.submit(receive,s) for s in sockets]
   start=time.monotonic()
   for frame in range(100):
    for i,sock in enumerate(sockets):
     packet=struct.pack('!BBHII',0x80,0,frame,frame*160,123456+i)+bytes([0x20])*160
     sock.sendto(packet,peers[i])
    time.sleep(max(0,start+(frame+1)*.02-time.monotonic()))
   counts=[r.result() for r in results]
  print(json.dumps({'localMediaProbe':True,'phoneCallsPlaced':0,'loopbackOnly':True,'framesSentPerChannel':100,'framesReceived':counts,'bridgeTechnology':ari('/bridges/'+bridge_id).get('technology'),'result':'PASS' if min(counts)>=80 else 'FAIL'}))
 finally:
  for cid in created:
   try:ari('/channels/'+cid,'DELETE')
   except Exception:pass
  if bridged:
   try:ari('/bridges/'+bridge_id,'DELETE')
   except Exception:pass
  for sock in sockets:sock.close()
  remaining=ari('/channels')
  if any(c.get('id') in ids for c in remaining):raise ValueError('PROBE_CLEANUP_NOT_VERIFIED')
if __name__=='__main__':
 try:main()
 except Exception as error:
  code=str(error) if isinstance(error,ValueError) and re.fullmatch('PROBE_[A-Z_]+',str(error)) else 'PROBE_UNAVAILABLE'
  print(json.dumps({'localMediaProbe':True,'phoneCallsPlaced':0,'error':code}));raise SystemExit(1)
