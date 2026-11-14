#!/usr/bin/env python3
"""Exercise two ephemeral loopback-only ARI media channels; never place a phone call."""
import base64,concurrent.futures,json,re,socket,struct,time,urllib.request,urllib.parse,uuid,subprocess,os,types,urllib.error,math
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
 prefix='paris-probe-'+uuid.uuid4().hex
 ids=[prefix+'-a',prefix+'-b'];bridge_id=prefix+'-bridge';sockets=[];peers=[];created=[];bridged=False
 def cli(command):
  return run_command(['docker','exec','pbx_asterisk_1','asterisk','-rx',command]).stdout
 def run_command(args):
  try:return subprocess.run(args,capture_output=True,text=True,timeout=8)
  except (OSError,subprocess.TimeoutExpired):return types.SimpleNamespace(returncode=127,stdout='',stderr='')
 iptables={}
 for chain,flag in [('INPUT','-i'),('OUTPUT','-o')]:
  result=run_command(['iptables','-S',chain])
  iptables[chain]={'readable':result.returncode==0,'acceptPolicy':('-P '+chain+' ACCEPT') in result.stdout,'loopbackAccept':run_command(['iptables','-C',chain,flag,'lo','-j','ACCEPT']).returncode==0,'dropRuleCount':result.stdout.count('-j DROP')}
 rtp_settings=cli('rtp show settings')
 runtime={'modulesLoaded':{name:bool(re.search(r'^'+re.escape(name)+r'\s',cli('module show like '+name),re.M)) for name in ['bridge_softmix.so','codec_ulaw.so','chan_rtp.so','res_rtp_asterisk.so']},'firewall':iptables,'rtpSettings':{key:match[1].strip() for key in ['Strict RTP','Probation','Checksums'] if (match:=re.search(r'^\s*'+key+r':\s*(.+)$',rtp_settings,re.M))}}
 try:
  pid=run_command(['docker','inspect','-f','{{.State.Pid}}','pbx_asterisk_1']).stdout.strip()
  runtime['asteriskUsesHostNetwork']=os.readlink('/proc/'+pid+'/ns/net')==os.readlink('/proc/self/ns/net')
 except Exception:runtime['asteriskNetworkNamespaceUnavailable']=True
 debug_enabled=False
 try:
  phase='create_channels'
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
  phase='create_bridge'
  bridge=ari('/bridges','POST',bridgeId=bridge_id,type='mixing,proxy_media',name=prefix)
  if bridge.get('id')!=bridge_id:raise ValueError('PROBE_BRIDGE_MISMATCH')
  bridged=True;ari('/bridges/'+bridge_id+'/addChannel','POST',channel=','.join(ids))
  def decode(byte):
   byte=(~byte)&255;value=(((byte&15)*8+132) << ((byte>>4)&7))-132
   return -value if byte&128 else value
  def encode(sample):
   negative=sample<0;magnitude=min(32635,abs(sample))+132;exponent=7;mask=0x4000
   while exponent>0 and not magnitude&mask:exponent-=1;mask>>=1
   return (~((0x80 if negative else 0)|(exponent<<4)|((magnitude>>(exponent+3))&15)))&255
  def receive(sock):
   count=audible=0;deadline=time.monotonic()+3
   while time.monotonic()<deadline:
    try:packet,source=sock.recvfrom(2048)
    except socket.timeout:continue
    if source[0]!='127.0.0.1' or len(packet)<172 or packet[0]>>6!=2 or packet[1]&127!=0:continue
    count+=1;payload=packet[12:]
    if sum(abs(decode(v)) for v in payload)/len(payload)>400:audible+=1
   return {'frames':count,'audibleFrames':audible}
  def exercise(start_frame):
   with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
    results=[pool.submit(receive,s) for s in sockets]
    start=time.monotonic()
    for frame in range(start_frame,start_frame+100):
     for i,sock in enumerate(sockets):
      tone=bytes(encode(round(5000*math.sin(2*math.pi*(440+i*110)*(frame*160+k)/8000))) for k in range(160))
      packet=struct.pack('!BBHII',0x80,0,frame,frame*160,123456+i)+tone
      sock.sendto(packet,peers[i])
     time.sleep(max(0,start+(frame-start_frame+1)*.02-time.monotonic()))
    return [r.result() for r in results]
  phase='simple_media'
  counts=exercise(0)
  report={'localMediaProbe':True,'phoneCallsPlaced':0,'loopbackOnly':True,'framesSentPerChannel':100,'simpleFramesReceived':counts,'simpleTechnology':ari('/bridges/'+bridge_id).get('technology'),'runtime':runtime}
  print(json.dumps({'localMediaProbeStage':'simple','report':report}),flush=True)
  # The supported SFU attribute scopes Asterisk's full mixer to this bridge.
  # Only audio channels are created; no video media or third participant exists.
  phase='full_mixer'
  ari('/bridges/'+bridge_id,'DELETE');bridged=False
  bridge_id=prefix+'-full'
  bridge=ari('/bridges','POST',bridgeId=bridge_id,type='mixing,proxy_media,video_sfu',name=prefix)
  if bridge.get('id')!=bridge_id:raise ValueError('PROBE_BRIDGE_MISMATCH')
  bridged=True
  for _ in range(20):
   if all(cid in ari('/applications/elevate-paris').get('channel_ids',[]) for cid in ids):break
   time.sleep(.1)
  ari('/bridges/'+bridge_id+'/addChannel','POST',channel=','.join(ids))
  report['fullMixerFramesReceived']=exercise(100)
  report['fullMixerTechnology']=ari('/bridges/'+bridge_id).get('technology')
  report['fullMixerAudioPassed']=min(c['audibleFrames'] for c in report['fullMixerFramesReceived'])>=80
  print(json.dumps(report),flush=True)

 finally:
  if debug_enabled:cli('rtp set debug off')
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
  detail={}
  if isinstance(error,urllib.error.HTTPError):
   try:
    body=error.read(4096).decode(errors='replace')
    detail={'errorSignals':{key:key.lower() in body.lower() for key in ['Stasis','bridge','channel','transport','format','encapsulation','capacity','mixing','add','allocated']}}
   except Exception:pass
  code=str(error) if isinstance(error,ValueError) and re.fullmatch('PROBE_[A-Z_]+',str(error)) else 'PROBE_UNAVAILABLE'
  print(json.dumps({'localMediaProbe':True,'phoneCallsPlaced':0,'error':code,'phase':phase,**detail,**({'httpStatus':error.code} if isinstance(error,urllib.error.HTTPError) else {})}));raise SystemExit(1)
