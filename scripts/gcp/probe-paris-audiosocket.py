#!/usr/bin/env python3
"""Probe two owned loopback AudioSocket channels with synthetic PCM; never dial."""
import base64,concurrent.futures,json,re,socket,struct,time,urllib.request,urllib.parse,uuid,math
from pathlib import Path

phase='preflight'
def main():
 global phase
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
 prefix='paris-probe-as-'+uuid.uuid4().hex
 ids=[prefix+'-a',prefix+'-b'];bridge_id=prefix+'-bridge';servers=[];clients=[];created=[];bridged=False
 def exact(sock,size):
  output=b''
  while len(output)<size:
   part=sock.recv(size-len(output))
   if not part:raise ValueError('PROBE_CONNECTION_CLOSED')
   output+=part
  return output
 try:
  phase='audiosocket_create'
  for cid in ids:
   server=socket.socket(socket.AF_INET,socket.SOCK_STREAM);server.bind(('127.0.0.1',0));server.listen(1);server.settimeout(5);servers.append(server)
   handshake=uuid.uuid4()
   external=ari('/channels/externalMedia','POST',channelId=cid,app='elevate-paris',external_host='127.0.0.1:'+str(server.getsockname()[1]),format='slin',direction='both',transport='tcp',encapsulation='audiosocket',connection_type='client',data=str(handshake))
   created.append(cid)
   if external.get('id')!=cid or not str(external.get('name','')).startswith('AudioSocket/127.0.0.1:'):raise ValueError('PROBE_CHANNEL_MISMATCH')
   client,peer=server.accept();clients.append(client);client.settimeout(5)
   if peer[0]!='127.0.0.1' or exact(client,3)!=bytes([1,0,16]) or exact(client,16)!=handshake.bytes:raise ValueError('PROBE_HANDSHAKE_MISMATCH')
   client.settimeout(.1)
  phase='audiosocket_bridge'
  for _ in range(30):
   if all(cid in ari('/applications/elevate-paris').get('channel_ids',[]) for cid in ids):break
   time.sleep(.1)
  bridge=ari('/bridges','POST',bridgeId=bridge_id,type='mixing,proxy_media',name=prefix)
  if bridge.get('id')!=bridge_id:raise ValueError('PROBE_BRIDGE_MISMATCH')
  bridged=True;ari('/bridges/'+bridge_id+'/addChannel','POST',channel=','.join(ids))
  def receive(sock):
   frames=audible=0;pending=b'';deadline=time.monotonic()+3
   while time.monotonic()<deadline:
    try:part=sock.recv(4096)
    except socket.timeout:continue
    if not part:break
    pending+=part
    if len(pending)>65536:raise ValueError('PROBE_FRAME_TOO_LARGE')
    while len(pending)>=3:
     kind,length=struct.unpack('!BH',pending[:3])
     if len(pending)<3+length:break
     payload=pending[3:3+length];pending=pending[3+length:]
     if kind==0x10 and len(payload)%2==0 and payload:
      samples=struct.unpack('<'+'h'*(len(payload)//2),payload);frames+=1
      if sum(abs(v) for v in samples)/len(samples)>400:audible+=1
   return {'frames':frames,'audibleFrames':audible}
  phase='audiosocket_audio'
  with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
   results=[pool.submit(receive,c) for c in clients];start=time.monotonic()
   for frame in range(100):
    for i,client in enumerate(clients):
     pcm=struct.pack('<160h',*(round(5000*math.sin(2*math.pi*(440+i*110)*(frame*160+k)/8000)) for k in range(160)))
     client.sendall(bytes([0x10,1,64])+pcm)
    time.sleep(max(0,start+(frame+1)*.02-time.monotonic()))
   counts=[r.result() for r in results]
  print(json.dumps({'localAudioSocketProbe':True,'phoneCallsPlaced':0,'loopbackOnly':True,'handshakesVerified':True,'framesSentPerChannel':100,'framesReceived':counts,'bridgeTechnology':ari('/bridges/'+bridge_id).get('technology'),'result':'PASS' if min(c['audibleFrames'] for c in counts)>=80 else 'FAIL'}),flush=True)
 finally:
  for cid in created:
   try:ari('/channels/'+cid,'DELETE')
   except Exception:pass
  if bridged:
   try:ari('/bridges/'+bridge_id,'DELETE')
   except Exception:pass
  for sock in clients+servers:sock.close()
  if any(c.get('id') in ids for c in ari('/channels')):raise ValueError('PROBE_CLEANUP_NOT_VERIFIED')
if __name__=='__main__':
 try:main()
 except Exception as error:
  code=str(error) if isinstance(error,ValueError) and re.fullmatch('PROBE_[A-Z_]+',str(error)) else 'PROBE_UNAVAILABLE'
  print(json.dumps({'localAudioSocketProbe':True,'phoneCallsPlaced':0,'error':code,'phase':phase,**({'httpStatus':error.code} if isinstance(error,urllib.error.HTTPError) else {})}));raise SystemExit(1)
