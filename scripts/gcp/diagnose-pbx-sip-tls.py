#!/usr/bin/env python3
"""Read-only transport diagnosis. Never emit certificates, keys or raw logs."""
import json,re,socket,ssl,subprocess

def run(args):
 r=subprocess.run(args,capture_output=True,text=True,timeout=20)
 return (r.stdout+(r.stderr if args[:2]==['docker','logs'] else '')) if r.returncode==0 else ''

def probe(host):
 stage='tcp_connect'
 try:
  with socket.create_connection((host,5061),timeout=5) as raw:
   stage='tls_handshake'
   with ssl.create_default_context().wrap_socket(raw,server_hostname='phone.elevateforhumanity.org') as secure:
    return {'trusted':bool(secure.getpeercert()),'protocol':secure.version()}
 except ssl.SSLCertVerificationError as e:return {'stage':stage,'error':'certificate_verification','verifyCode':e.verify_code}
 except ssl.SSLError as e:return {'stage':stage,'error':'tls_handshake_failed','reason':e.reason if re.fullmatch(r'[A-Z0-9_]{1,100}',str(e.reason)) else 'unclassified'}
 except TimeoutError:return {'stage':stage,'error':'timeout'}
 except ConnectionRefusedError:return {'stage':stage,'error':'refused'}
 except OSError:return {'stage':stage,'error':'network_unavailable'}

def main():
 cli=lambda v:run(['docker','exec','pbx_asterisk_1','asterisk','-rx',v])
 transport=cli('pjsip show transport elevate-twilio-tls')
 settings={key:m[1] for key in ['method','verify_client','require_client_cert','verify_server','protocol','bind','cert_file','priv_key_file','ca_list_file','cipher']
  if (m:=re.search(r'^\s*'+key+r'\s*:\s*([A-Za-z0-9_./:\[\]-]+)\s*$',transport,re.M))}
 listeners=run(['ss','-H','-lnt','sport = :5061'])
 binds=[line.split()[3] for line in listeners.splitlines() if len(line.split())>=4]
 logs=run(['docker','logs','--since','10m','--tail','300','pbx_asterisk_1'])
 logs+=run(['docker','exec','pbx_asterisk_1','tail','-n','300','/var/log/asterisk/messages'])
 logs+=run(['docker','exec','pbx_asterisk_1','tail','-n','300','/var/log/asterisk/full'])
 file_checks={}
 for key in ['cert_file','priv_key_file','ca_list_file']:
  path=settings.get(key)
  if path and path.startswith('/etc/asterisk/'):
   readable=run(['docker','exec','--user','asterisk','pbx_asterisk_1','sh','-c','test -r "$1" && echo readable','check',path]).strip()=='readable'
   file_checks[key]={'readableByAsterisk':readable}
   if key=='cert_file':
    certificate=run(['docker','exec','pbx_asterisk_1','openssl','x509','-in',path,'-noout','-checkhost','phone.elevateforhumanity.org'])
    file_checks[key]['hostMatches']='does match' in certificate and 'does NOT match' not in certificate
 patterns_extra={'noSharedCipher':r'no shared cipher','keyMismatch':r'key values mismatch','certificateMissing':r'No such file|Permission denied','sslContextFailure':r'Unable to (?:create|set up|load).*SSL|SSL_CTX|SSL_ERROR'}

 patterns={**patterns_extra,'certificateLoadError':r'Unable to load.*(?:cert|key)|SSL.*(?:cert|key).*error',
  'handshakeTimeout':r'TLS.*(?:timeout|timed out)|SSL.*(?:timeout|timed out)',
  'bindError':r'Unable to bind|Address already in use', 'tlsError':r'TLS|SSL'}
 print(json.dumps({'readOnly':True,'configurationChanged':False,'transportSettings':settings,
  'tlsFileChecks':file_checks,'tcpListeners':binds,'loopback':probe('127.0.0.1'),
  'logSignals':{key:bool(re.search(pattern,logs,re.I)) for key,pattern in patterns.items()}}))
if __name__=='__main__':main()
