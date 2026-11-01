#!/usr/bin/env python3
"""Enable the authorized business DID's PARIS entry; preserve files and roll back failures."""
import json
from pathlib import Path
import re
import subprocess
import tempfile
import shutil
import ipaddress
import ssl
import socket
import time
import hashlib
import sys
# Official Twilio signaling gateways: https://www.twilio.com/docs/sip-trunking/ip-addresses
SIGNALING=['54.172.60.0/30','54.244.51.0/30','54.171.127.192/30','35.156.191.128/30','54.65.63.192/30','54.169.127.128/30','54.252.254.64/30','177.71.206.192/30']
ROOT=Path('/opt/elevate-pbx/repo/infra/pbx/asterisk')
MARKER='; Managed Elevate PARIS business-number ingress'
def run(args):
 result=subprocess.run(args,capture_output=True,text=True,timeout=30)
 if result.returncode:raise ValueError('PBX_INGRESS_COMMAND_FAILED')
 return re.sub(r'\x1b\[[0-?]*[ -/]*[@-~]', '', result.stdout)
def cli(value):return run(['docker','exec','pbx_asterisk_1','asterisk','-rx',value])
def idle_state(text):return all(re.search(r'^0 active '+kind+r's?$',text,re.M) for kind in ['call','channel'])
def ingress_plan():
 rows=[MARKER,'[elevate-paris-inbound]']
 for extension in ['+14632401404','14632401404','4632401404','s']:
  rows += ['exten => '+extension+',1,Answer()',' same => n,Stasis(elevate-paris)',' same => n,Goto(internal,0,1)']
 return '\n'.join(rows)+'\n'
def update_endpoint(text):
 pattern=r'(?ms)(^\[twilio\]\s*\n)(.*?)(?=^\[|\Z)'
 match=re.search(pattern,text)
 if not match or not re.search(r'^type=endpoint\s*$',match[2],re.M):raise ValueError('PBX_CARRIER_ENDPOINT_UNVERIFIED')
 body=match[2]
 if len(re.findall(r'^context=.*$',body,re.M))!=1:raise ValueError('PBX_CARRIER_CONTEXT_AMBIGUOUS')
 body=re.sub(r'^context=.*$', 'context=elevate-paris-inbound',body,flags=re.M)
 body=re.sub(r'^identify_by=.*\n?', '',body,flags=re.M).rstrip()+'\nidentify_by=ip\n'
 return text[:match.start(2)]+body+text[match.end(2):]
def update_outbound_aor(text):
 pattern=r'(?ms)(^\[twilio-aor\]\s*\n)(.*?)(?=^\[|\Z)'
 match=re.search(pattern,text)
 if not match or not re.search(r'^type=aor\s*$',match[2],re.M):raise ValueError('PBX_CARRIER_AOR_UNVERIFIED')
 contacts=re.findall(r'^contact=(.*)$',match[2],re.M)
 allowed=['sip:elevate-standalone.pstn.twilio.com:5061;transport=tls','sip:elevate-4632401404.pstn.twilio.com:5061;transport=tls']
 if len(contacts)!=1 or contacts[0].replace('\\;', ';') not in allowed:raise ValueError('PBX_CARRIER_CONTACT_REQUIRES_REVIEW')
 body=re.sub(r'^contact=.*$', lambda _: 'contact='+allowed[1].replace(';', r'\;'),match[2],flags=re.M)
 return text[:match.start(2)]+body+text[match.end(2):]
def verified_identity(text):
 networks=set()
 for raw in re.findall(r'\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}/(?:[0-9]{1,3}\.){3}[0-9]{1,3}|\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}/[0-9]{1,2}\b',text):
  try:networks.add(str(ipaddress.ip_network(raw,strict=False)))
  except ValueError:pass
 return set(SIGNALING)==networks
TLS_FAILURE='not_checked'
def sip_tls_context():
 context=ssl.create_default_context()
 context.minimum_version=ssl.TLSVersion.TLSv1_2
 context.maximum_version=ssl.TLSVersion.TLSv1_2
 context.set_ciphers('ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384')
 return context
def trusted_sip_tls():
 global TLS_FAILURE
 try:
  with socket.create_connection(('127.0.0.1',5061),timeout=5) as raw:
   with sip_tls_context().wrap_socket(raw,server_hostname='phone.elevateforhumanity.org') as secure:
    TLS_FAILURE='none'
    return bool(secure.getpeercert())
 except ssl.SSLCertVerificationError as error:
  TLS_FAILURE='certificate_verification_'+str(error.verify_code);return False
 except ssl.SSLError:
  TLS_FAILURE='tls_handshake_failed';return False
 except (TimeoutError,socket.timeout):
  TLS_FAILURE='socket_timeout';return False
 except ConnectionRefusedError:
  TLS_FAILURE='connection_refused';return False
 except Exception:
  TLS_FAILURE='transport_unavailable';return False
def certificate_pair():
 # Reuse only the certificate actually served by the existing trusted gateway.
 with socket.create_connection(('127.0.0.1',443),timeout=5) as raw:
  with ssl.create_default_context().wrap_socket(raw,server_hostname='phone.elevateforhumanity.org') as secure:
   fingerprint=hashlib.sha256(secure.getpeercert(binary_form=True)).hexdigest()
 matches=[]
 for cert in Path('/var/lib/elevate-pbx-tls/data/caddy/certificates').glob('*/phone.elevateforhumanity.org/phone.elevateforhumanity.org.crt'):
  pem=re.search(r'-----BEGIN CERTIFICATE-----.*?-----END CERTIFICATE-----',cert.read_text(),re.S)
  key=cert.with_suffix('.key')
  if pem and key.is_file() and hashlib.sha256(ssl.PEM_cert_to_DER_cert(pem[0])).hexdigest()==fingerprint:
   run(['openssl','x509','-in',str(cert),'-noout','-checkhost','phone.elevateforhumanity.org'])
   run(['openssl','x509','-in',str(cert),'-noout','-checkend','604800'])
   if run(['openssl','x509','-in',str(cert),'-pubkey','-noout']).strip()!=run(['openssl','pkey','-in',str(key),'-pubout']).strip():raise ValueError('PBX_CERTIFICATE_KEY_MISMATCH')
   matches.append((cert,key))
 if len(matches)!=1:raise ValueError('PBX_TRUSTED_CERTIFICATE_AMBIGUOUS')
 return matches[0]
def certificate_uses_rsa(cert):
 return bool(re.search(r'Public Key Algorithm:\s*rsaEncryption\b',run(['openssl','x509','-in',str(cert),'-noout','-text'])))
def rsa_gateway_config(text):
 if text.count('phone.elevateforhumanity.org {')!=1 or len(re.findall(r'^\s*tls\s*\{\s*$',text,re.M))!=1 or not re.search(r'issuer\s+acme\s*\{',text):
  raise ValueError('PBX_GATEWAY_CONFIGURATION_REQUIRES_REVIEW')
 text=re.sub(r'^\s*key_type\s+\S+\s*$', '',text,flags=re.M)
 return re.sub(r'(^\s*tls\s*\{\s*$)',r'\1\n    key_type rsa2048',text,count=1,flags=re.M)
def gateway_ws_ready():
 key='dGhlIHNhbXBsZSBub25jZQ=='
 with socket.create_connection(('127.0.0.1',443),timeout=5) as raw:
  with ssl.create_default_context().wrap_socket(raw,server_hostname='phone.elevateforhumanity.org') as secure:
   secure.sendall(('GET /ws HTTP/1.1\r\nHost: phone.elevateforhumanity.org\r\nConnection: Upgrade\r\nUpgrade: websocket\r\nSec-WebSocket-Key: '+key+'\r\nSec-WebSocket-Version: 13\r\nSec-WebSocket-Protocol: sip\r\n\r\n').encode())
   response=b''
   while b'\r\n\r\n' not in response and len(response)<16384:
    block=secure.recv(4096)
    if not block:break
    response+=block
 lines=response.decode('latin1').split('\r\n')
 headers={line.split(':',1)[0].lower():line.split(':',1)[1].strip() for line in lines[1:] if ':' in line}
 return lines[0].startswith('HTTP/1.1 101 ') and headers.get('sec-websocket-accept')=='s3pPLMBiTxaQ9kYGzzhZRbK+xOo=' and headers.get('sec-websocket-protocol')=='sip'
def require_gateway_mount(container,config):
 mounts=[m for m in container.get('Mounts',[]) if m.get('Destination')=='/etc/caddy/Caddyfile']
 if not container.get('State',{}).get('Running') or len(mounts)!=1 or mounts[0].get('Source')!=str(config) or mounts[0].get('Type')!='bind':
  raise ValueError('PBX_GATEWAY_MOUNT_UNVERIFIED')
def ensure_rsa_gateway_certificate(pair):
 if certificate_uses_rsa(pair[0]):return pair
 # The current trusted browser certificate is ECDSA. Keep the same hostname,
 # ACME issuer and gateway; request an RSA key under its existing automation.
 if not idle_state(cli('core show channels count')):raise ValueError('PBX_ACTIVE_CALLS_OR_UNKNOWN')
 if not gateway_ws_ready():raise ValueError('PBX_GATEWAY_SIP_WEBSOCKET_UNVERIFIED')
 config=Path('/opt/elevate-pbx/tls-proxy/Caddyfile')
 name='elevate-pbx-wss-proxy'
 container=json.loads(run(['docker','inspect',name]))[0]
 require_gateway_mount(container,config)
 if config.is_symlink():raise ValueError('PBX_GATEWAY_CONFIGURATION_SYMLINK_REJECTED')
 before=config.read_text();after=rsa_gateway_config(before)
 resources=[]
 for cert in Path('/var/lib/elevate-pbx-tls/data/caddy/certificates').glob('*/phone.elevateforhumanity.org/phone.elevateforhumanity.org.crt'):
  for extension in ['.crt','.key','.json']:
   resource=cert.with_suffix(extension)
   if resource.is_symlink():raise ValueError('PBX_GATEWAY_CERTIFICATE_SYMLINK_REJECTED')
   if resource.is_file():resources.append(resource)
 if pair[0] not in resources or pair[1] not in resources:raise ValueError('PBX_GATEWAY_CERTIFICATE_RESOURCES_UNVERIFIED')
 backup=Path(tempfile.mkdtemp(prefix='elevate-rsa-gateway-'))
 restarted=False;saved=[]
 try:
  config.write_text(after)
  run(['docker','exec',name,'caddy','validate','--config','/etc/caddy/Caddyfile','--adapter','caddyfile'])
  if not idle_state(cli('core show channels count')):raise ValueError('PBX_CALL_STARTED_BEFORE_GATEWAY_RESTART')
  # Caddy otherwise retains its cached ECDSA certificate despite key_type.
  # Stage only this hostname's resources privately, preserving account state.
  for index,resource in enumerate(resources):
   destination=backup/str(index);shutil.move(resource,destination);saved.append((resource,destination))
  restarted=True
  run(['docker','restart',name])
  deadline=time.monotonic()+75
  while time.monotonic()<deadline:
   try:
    candidate=certificate_pair()
    if certificate_uses_rsa(candidate[0]) and gateway_ws_ready():
     after_container=json.loads(run(['docker','inspect',name]))[0]
     if after_container['Id']!=container['Id'] or after_container['Image']!=container['Image']:raise ValueError('PBX_GATEWAY_IDENTITY_CHANGED')
     shutil.rmtree(backup)
     print(json.dumps({'trustedRsaGatewayCertificateVerified':True,'gatewaySipWebSocketVerified':True}),flush=True)
     return candidate
   except (OSError,ssl.SSLError,ValueError,subprocess.TimeoutExpired):pass
   time.sleep(2)
  raise ValueError('PBX_TRUSTED_RSA_CERTIFICATE_NOT_ISSUED')
 except Exception:
  config.write_text(before)
  for resource,snapshot in saved:shutil.copy2(snapshot,resource)
  if restarted:
   if not idle_state(cli('core show channels count')):raise ValueError('PBX_GATEWAY_ROLLBACK_DEFERRED_ACTIVE_CALLS')
   try:
    run(['docker','restart',name])
    certificate_pair()
    if not gateway_ws_ready():raise ValueError('rollback')
   except Exception:raise ValueError('PBX_GATEWAY_ROLLBACK_UNCONFIRMED')
  shutil.rmtree(backup)
  raise
def tls_endpoint(text):
 pattern=r'(?ms)(^\[elevate-twilio-tls\]\s*\n)(.*?)(?=^\[|\Z)'
 match=re.search(pattern,text)
 if not match:raise ValueError('PBX_TLS_TRANSPORT_UNVERIFIED')
 body=match[2]
 for key,value in [('cert_file','/etc/asterisk/tls/phone.crt'),('priv_key_file','/etc/asterisk/tls/phone.key'),('allow_reload','yes')]:
  body=re.sub(r'^'+key+r'=.*\n?', '',body,flags=re.M)
  body=body.rstrip()+'\n'+key+'='+value+'\n'
 return text[:match.start(2)]+body+text[match.end(2):]
def messages_cursor():
 result=subprocess.run(['docker','exec','pbx_asterisk_1','stat','-c','%i %s','/var/log/asterisk/messages'],capture_output=True,text=True,timeout=10)
 match=re.fullmatch(r'(\d+) (\d+)\s*',result.stdout) if result.returncode==0 else None
 return tuple(map(int,match.groups())) if match else None
def current_attempt_messages(cursor):
 after=messages_cursor()
 if cursor is None or after is None:return '',False
 start=cursor[1]+1 if after[0]==cursor[0] and after[1]>=cursor[1] else 1
 result=subprocess.run(['docker','exec','pbx_asterisk_1','sh','-c','set -o pipefail; tail -c +"$1" /var/log/asterisk/messages | head -c 131072','check',str(start)],capture_output=True,text=True,timeout=10)
 return (result.stdout,True) if result.returncode==0 else ('',False)
def listener_ownership(listeners,processes):
 owners=set(re.findall(r'pid=(\d+)',listeners))
 asterisk={match[1] for line in processes.splitlines() if (match:=re.fullmatch(r'\s*(\d+)\s+asterisk\s*',line))}
 return {'listenerPresent':bool(listeners.strip()),'listenerOwnerVerified':bool(owners) and owners.issubset(asterisk),
  'asteriskProcessCount':len(asterisk),'listenerProcessNames':sorted(set(re.findall(r'users:\(\("([A-Za-z0-9_-]{1,40})"',listeners)))}
def diagnostic_tls_probe(ciphers):
 stage='tcp_connect'
 try:
  context=ssl.create_default_context();context.minimum_version=ssl.TLSVersion.TLSv1_2;context.maximum_version=ssl.TLSVersion.TLSv1_2;context.set_ciphers(ciphers)
  with socket.create_connection(('127.0.0.1',5061),timeout=5) as raw:
   stage='tls_handshake'
   with context.wrap_socket(raw,server_hostname='phone.elevateforhumanity.org') as secure:
    return {'trusted':bool(secure.getpeercert()),'cipher':secure.cipher()[0],'protocol':secure.version()}
 except ssl.SSLCertVerificationError:return {'trusted':False,'stage':stage,'reason':'certificate_verification'}
 except ssl.SSLError as error:
  reason=str(error.reason)
  return {'trusted':False,'stage':stage,'reason':reason if re.fullmatch(r'[A-Z0-9_]{1,80}',reason) else 'tls_failure'}
 except (TimeoutError,socket.timeout):return {'trusted':False,'stage':stage,'reason':'timeout'}
 except OSError:return {'trusted':False,'stage':stage,'reason':'socket_unavailable'}
def transport_runtime_evidence():
 evidence=listener_ownership(run(['ss','-H','-lntp','sport = :5061']),run(['docker','top','pbx_asterisk_1','-eo','pid,comm']))
 available=cli('pjsip list ciphers')
 allowed=['ECDHE-RSA-AES128-GCM-SHA256','ECDHE-RSA-AES256-GCM-SHA384','AES128-GCM-SHA256','AES256-GCM-SHA384']
 evidence['providerCiphersSupported']=[name for name in allowed if re.search(r'(?<![A-Za-z0-9_-])'+re.escape(name)+r'(?![A-Za-z0-9_-])',available)]
 evidence['cipherInventoryVerified']=not bool(re.search(r'no such command|not found',available,re.I))
 evidence['forwardSecrecyProbe']=diagnostic_tls_probe(':'.join(allowed[:2]))
 evidence['rsaGcmProbe']=diagnostic_tls_probe(':'.join(allowed[2:]))
 return evidence
def attempted_tls_evidence(cursor=None):
 # Capture the failed candidate before rollback. Emit booleans only, never raw
 # Asterisk logs, certificates, private keys, or command output.
 settings=cli('pjsip show transport elevate-twilio-tls')
 paths={key:match[1] for key in ['cert_file','priv_key_file']
  if (match:=re.search(r'^\s*'+key+r'\s*:\s*(/etc/asterisk/[A-Za-z0-9_./-]+)\s*$',settings,re.M))}
 readable={key:run(['docker','exec','--user','asterisk','pbx_asterisk_1','sh','-c','if test -r "$1"; then echo yes; else echo no; fi','check',path]).strip()=='yes'
  for key,path in paths.items()}
 logs,fresh=current_attempt_messages(cursor)
 patterns={'certificateLoadError':r'Unable to load.*(?:cert|key)|SSL.*(?:cert|key).*error',
  'noSharedCipher':r'no shared cipher','keyMismatch':r'key values mismatch',
  'permissionDenied':r'Permission denied','bindError':r'Unable to bind|Address already in use',
  'tlsFailure':r'TLS|SSL'}
 certificate=run(['openssl','x509','-in',str(ROOT/'tls/phone.crt'),'-noout','-text'])
 return {'candidateCertificateUsesRsa':bool(re.search(r'Public Key Algorithm:\s*rsaEncryption\b',certificate)),
  'candidateLogFresh':fresh,'candidateCertificateConfigured':'cert_file' in paths,'candidateKeyConfigured':'priv_key_file' in paths,
  'candidateFilesReadable':readable,'candidateLogSignals':{key:bool(re.search(pattern,logs,re.I)) for key,pattern in patterns.items()}}
def retire_standalone_contact():
 # This migration commits the new AOR independently of TLS activation. A later
 # TLS rollback must never restore the retired standalone contact.
 if not idle_state(cli('core show channels count')):raise ValueError('PBX_ACTIVE_CALLS_OR_UNKNOWN')
 fragment=ROOT/'elevate-twilio.conf'
 if fragment.is_symlink():raise ValueError('PBX_INGRESS_SYMLINK_REJECTED')
 before=fragment.read_text();after=update_outbound_aor(before)
 try:
  if after!=before:fragment.write_text(after);cli('module reload res_pjsip.so')
  for attempt in range(12):
   if 'sip:elevate-4632401404.pstn.twilio.com:5061;transport=tls' in cli('pjsip show aor twilio-aor'):
    return {'retiredContactRemoved':True,'dedicatedTrunkContactVerified':True,'liveCallAcceptance':'NOT_TESTED'}
   time.sleep(0.25)
  raise ValueError('PBX_CARRIER_CONTACT_READBACK_FAILED')
 except Exception:
  if after!=before:fragment.write_text(before);cli('module reload res_pjsip.so')
  raise
def apply():
 state=cli('core show channels count')
 if not idle_state(state):raise ValueError('PBX_ACTIVE_CALLS_OR_UNKNOWN')
 if run(['systemctl','is-active','elevate-paris-gateway.service']).strip()!='active':raise ValueError('PBX_PARIS_GATEWAY_NOT_ACTIVE')
 # A registered ARI application is required before any incoming route changes.
 if not re.search(r'\belevate-paris\b',cli('ari show apps')):raise ValueError('PBX_PARIS_APPLICATION_UNREGISTERED')
 repair_tls=not trusted_sip_tls()
 pair=ensure_rsa_gateway_certificate(certificate_pair()) if repair_tls else None
 files=[ROOT/'elevate-twilio.conf',ROOT/'pjsip.conf',ROOT/'extensions.conf',ROOT/'elevate-paris-inbound.conf',ROOT/'elevate-twilio-identity.conf']
 if repair_tls:files += [ROOT/'tls/phone.crt',ROOT/'tls/phone.key']
 if any(p.is_symlink() for p in files):raise ValueError('PBX_INGRESS_SYMLINK_REJECTED')
 for p in files[3:5]:
  if p.exists() and not p.read_text().startswith(MARKER):raise ValueError('PBX_INGRESS_FILE_OWNERSHIP_UNVERIFIED')
 previous={p:p.read_text() if p.exists() else None for p in files}
 new_endpoint=update_outbound_aor(update_endpoint(previous[files[0]] or ''))
 if repair_tls:new_endpoint=tls_endpoint(new_endpoint)
 gid=run(['docker','exec','pbx_asterisk_1','id','-g','asterisk']).strip()
 if not gid.isdigit():raise ValueError('PBX_GROUP_UNVERIFIED')
 backup=Path(tempfile.mkdtemp(prefix='elevate-paris-ingress-'))
 restarted=False
 for index,p in enumerate(files):
  if p.exists():shutil.copy2(p,backup/str(index))
 try:
  if repair_tls:
   import os
   if (ROOT/'tls').is_symlink():raise ValueError('PBX_TLS_DIRECTORY_SYMLINK_REJECTED')
   (ROOT/'tls').mkdir(mode=0o750,exist_ok=True);os.chown(ROOT/'tls',0,int(gid))
   for source,target in zip(pair,files[5:]):shutil.copy2(source,target)
  files[0].write_text(new_endpoint)
  files[3].write_text(ingress_plan())
  files[4].write_text(MARKER+'\n[elevate-twilio-carrier-identity]\ntype=identify\nendpoint=twilio\n'+''.join('match='+network+'\n' for network in SIGNALING))
  for target,name in [(files[1],'elevate-twilio-identity.conf'),(files[2],'elevate-paris-inbound.conf')]:
   prior=previous[target]
   if prior is None:raise ValueError('PBX_BASE_CONFIG_MISSING')
   if '#include '+name not in prior.splitlines():target.write_text(prior+'\n#include '+name+'\n')
  import os
  for p in files:os.chmod(p,0o640);os.chown(p,0,int(gid))
  cli('module reload res_pjsip.so');cli('dialplan reload')
  if repair_tls and not trusted_sip_tls():
   # An existing transport without allow_reload needs one idle restart before
   # its trusted server certificate can take effect. Never restart active calls.
   if not idle_state(cli('core show channels count')):raise ValueError('PBX_CALL_STARTED_BEFORE_RESTART')
   cursor=messages_cursor()
   run(['docker','restart','pbx_asterisk_1'])
   restarted=True
   for attempt in range(30):
    if trusted_sip_tls():break
    time.sleep(1)
   if not trusted_sip_tls():
    # Read only allowlisted non-secret transport settings while the attempted
    # configuration is still loaded, before rollback restores the old one.
    transport=cli('pjsip show transport elevate-twilio-tls')
    settings={key:match[1] for key in ['method','verify_client','require_client_cert','verify_server','protocol']
     if (match:=re.search(r'^\s*'+key+r'\s*:\s*([A-Za-z0-9_.-]+)\s*$',transport,re.M))}
    try:diagnostics=attempted_tls_evidence(cursor)
    except Exception:diagnostics={'candidateDiagnosticsUnavailable':True}
    try:diagnostics.update(transport_runtime_evidence())
    except Exception:diagnostics['runtimeDiagnosticsUnavailable']=True
    print(json.dumps({'sipTlsFailure':TLS_FAILURE,'transportSettings':settings,**diagnostics}),flush=True)
    raise ValueError('PBX_TRUSTED_SIP_TLS_FAILED')
  for attempt in range(30):
   if re.search(r'\belevate-paris\b',cli('ari show apps')):break
   time.sleep(1)
  if not re.search(r'\belevate-paris\b',cli('ari show apps')):raise ValueError('PBX_PARIS_NOT_REGISTERED_AFTER_RELOAD')
  aor=cli('pjsip show aor twilio-aor')
  if 'sip:elevate-4632401404.pstn.twilio.com:5061;transport=tls' not in aor:raise ValueError('PBX_CARRIER_CONTACT_READBACK_FAILED')
  endpoint=cli('pjsip show endpoint twilio')
  plan=cli('dialplan show +14632401404@elevate-paris-inbound')
  identity=cli('pjsip show identify elevate-twilio-carrier-identity')
  if not re.search(r'context\s*:\s*elevate-paris-inbound\b',endpoint) or not re.search(r'^\s*identify_by\s*:\s*ip\s*$',endpoint,re.M) or 'Stasis(elevate-paris)' not in plan or not verified_identity(identity):
   raise ValueError('PBX_INGRESS_READBACK_FAILED')
 except Exception:
  for index,p in enumerate(files):
   if previous[p] is None:p.unlink(missing_ok=True)
   else:shutil.copy2(backup/str(index),p)
  cli('module reload res_pjsip.so');cli('dialplan reload')
  if restarted and idle_state(cli('core show channels count')):run(['docker','restart','pbx_asterisk_1'])
  raise
 return {'pbxIngressVerified':True,'parisEntryConfigured':True,'carrierSourceIdentityConfigured':True,'sipTlsVerified':trusted_sip_tls(),'liveCallAcceptance':'NOT_TESTED'}
def failure_evidence(error):
 # Never print command output, certificates, provider credentials, or arbitrary exceptions.
 reason=str(error)
 if not re.fullmatch(r'PBX_[A-Z_]+',reason):
  reason='PBX_COMMAND_TIMEOUT' if isinstance(error,subprocess.TimeoutExpired) else 'PBX_UNEXPECTED_FAILURE'
 return {'result':'FAIL','code':'PBX_PARIS_INGRESS_NOT_CONFIRMED','reason':reason}
if __name__=='__main__':
 try:
  if sys.argv[1:] not in [[],['--retire-standalone']]:raise ValueError('PBX_OPERATION_UNRECOGNIZED')
  print(json.dumps(retire_standalone_contact() if sys.argv[1:] else apply()))
 except Exception as error:print(json.dumps(failure_evidence(error)));raise SystemExit(1)
