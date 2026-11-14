#!/usr/bin/env python3
"""Read only fixed media failure markers; never emit caller data or raw logs."""
import json,re,subprocess
from pathlib import Path

def run(args):
 p=subprocess.run(args,capture_output=True,text=True,timeout=20)
 return p.stdout+p.stderr if p.returncode==0 else ''

def main():
 gateway=run(['journalctl','-u','elevate-paris-gateway.service','--since','10 minutes ago','--no-pager','-o','cat'])
 logs=run(['docker','logs','--since','10m','--tail','1000','pbx_asterisk_1'])
 for path in ['/var/log/asterisk/messages','/var/log/asterisk/messages.log','/var/log/asterisk/full','/var/log/asterisk/full.log']:
  logs+=run(['docker','exec','pbx_asterisk_1','tail','-n','500',path])
 signals={label:len(re.findall(pattern,logs,re.I)) for label,pattern in {
  'iceReceiveFailure':r'PJ ICE Rx error|ICE PJ Rx error','rtpUnknownCodec':r'Unknown RTP codec','rtpUnsupportedMedia':r'Unknown or unsupported media type',
  'srtpFailure':r'(?:SRTP|crypto).{0,100}(?:fail|error|not|unable)',
  'tlsFailure':r'(?:TLS|SSL).{0,100}(?:fail|error|timeout)',
  'endpointUnmatched':r'No matching endpoint','authenticationFailure':r'Failed to authenticate',
  'stasisUnavailable':r'Stasis app.{0,100}not registered|Stasis.{0,100}not found',
  'mediaBridgeError':r'UnicastRTP.{0,100}(?:error|fail)|externalMedia.{0,100}(?:error|fail)',
  'missingFormat':r'Unable to find.{0,100}(?:codec|format|translation)',
  'dialplanMissing':r'Invalid extension|sent to invalid extension|No application.*Stasis',
  'callCongestion':r'Everyone is busy/congested'}.items()}
 srtp_reasons={label:bool(re.search(pattern,logs,re.I)) for label,pattern in {
  'authenticationFailure':r'SRTP.{0,100}auth(?:entication)?(?:entication)? fail',
  'replayFailure':r'SRTP.{0,100}replay','cryptoNegotiationFailure':r'(?:SRTP|crypto).{0,100}negotiat|negotiate.{0,100}(?:SRTP|crypto)',
  'srtpModuleMissing':r'No SRTP module loaded|SRTP support.*not|No SRTP support',
  'sessionInitializationFailed':r'(?:initialize|create).{0,50}SRTP|SRTP.{0,100}(?:initializ|session).{0,100}fail',
  'unprotectFailure':r'SRTP unprotect failed','protectFailure':r'SRTP protect failed',
  'unsuitableCryptoSuite':r'(?:SRTP|crypto).{0,100}(?:suite|unsupported|not supported)',
  'badKeyLength':r'(?:SRTP|crypto).{0,100}(?:key length|master key)',
  'sdpNegotiationFailure':r'Couldn.t negotiate stream|No compatible codecs|Couldn.t negotiate audio',
  'sdpNoCrypto':r'(?:SDP|crypto).{0,100}(?:missing|no usable|not acceptable)'}.items()}
 endpoint=run(['docker','exec','pbx_asterisk_1','asterisk','-rx','pjsip show endpoint twilio'])
 endpoint_settings={key:match[1] for key in ['media_encryption','media_encryption_optimistic','direct_media','rtp_symmetric','rtp_keepalive','use_avpf','dtmf_mode','force_rport'] if (match:=re.search(r'^\s*'+key+r'\s*:\s*([A-Za-z0-9_]+)\s*$',endpoint,re.M))}
 processes=[]
 for path in Path('/proc').iterdir():
  if not path.name.isdigit():continue
  try:
   args=(path/'cmdline').read_bytes().split(b'\0')
   if any(a.endswith(b'/paris/launch.mjs') for a in args) and b'gateway' in args:processes.append(path)
  except (OSError,PermissionError):pass
 gateway_pid=run(['systemctl','show','elevate-paris-gateway.service','--property=MainPID','--value']).strip()
 gateway_process={'matchingLaunchProcessCount':len(processes),'servicePidMatchesSingleProcess':len(processes)==1 and processes[0].name==gateway_pid}
 print(json.dumps({'gatewayProcess':gateway_process,'srtpReasonSignals':srtp_reasons,'carrierEndpointSettings':endpoint_settings,'readOnly' :True,'callsPlaced':0,'gatewayActive':run(['systemctl','is-active','elevate-paris-gateway.service']).strip()=='active',
  'gatewayFailureMarkers':{marker:gateway.count(marker) for marker in ['PARIS_TURN_REQUESTED','PARIS_TURN_AUDIO_READY','PARIS_TURN_SENT','PARIS_GREETING_REQUESTED','PARIS_GREETING_AUDIO_READY','PARIS_GREETING_SENT','PARIS_BRIDGE_FAILED','PARIS_GREETING_FAILED','PARIS_TURN_FAILED','PARIS_CALL_RELEASE_FAILED','PARIS_RUNTIME_STARTUP_FAILED']},'asteriskSignals':signals}))
if __name__=='__main__':main()
