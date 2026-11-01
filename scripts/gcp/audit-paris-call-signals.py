#!/usr/bin/env python3
"""Read only fixed media failure markers; never emit caller data or raw logs."""
import json,re,subprocess

def run(args):
 p=subprocess.run(args,capture_output=True,text=True,timeout=20)
 return p.stdout+p.stderr if p.returncode==0 else ''

def main():
 gateway=run(['journalctl','-u','elevate-paris-gateway.service','--since','10 minutes ago','--no-pager','-o','cat'])
 logs=run(['docker','logs','--since','10m','--tail','1000','pbx_asterisk_1'])
 for path in ['/var/log/asterisk/messages','/var/log/asterisk/messages.log','/var/log/asterisk/full','/var/log/asterisk/full.log']:
  logs+=run(['docker','exec','pbx_asterisk_1','tail','-n','500',path])
 signals={label:len(re.findall(pattern,logs,re.I)) for label,pattern in {
  'srtpFailure':r'(?:SRTP|crypto).{0,100}(?:fail|error|not|unable)',
  'tlsFailure':r'(?:TLS|SSL).{0,100}(?:fail|error|timeout)',
  'endpointUnmatched':r'No matching endpoint','authenticationFailure':r'Failed to authenticate',
  'stasisUnavailable':r'Stasis app.{0,100}not registered|Stasis.{0,100}not found',
  'mediaBridgeError':r'UnicastRTP.{0,100}(?:error|fail)|externalMedia.{0,100}(?:error|fail)',
  'missingFormat':r'Unable to find.{0,100}(?:codec|format|translation)',
  'dialplanMissing':r'Invalid extension|sent to invalid extension|No application.*Stasis',
  'callCongestion':r'Everyone is busy/congested'}.items()}
 print(json.dumps({'readOnly':True,'callsPlaced':0,'gatewayActive':run(['systemctl','is-active','elevate-paris-gateway.service']).strip()=='active',
  'gatewayFailureMarkers':{marker:gateway.count(marker) for marker in ['PARIS_BRIDGE_FAILED','PARIS_GREETING_FAILED','PARIS_TURN_FAILED','PARIS_CALL_RELEASE_FAILED','PARIS_RUNTIME_STARTUP_FAILED']},'asteriskSignals':signals}))
if __name__=='__main__':main()
