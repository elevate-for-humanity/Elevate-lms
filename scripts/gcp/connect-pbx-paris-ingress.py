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
# Official Twilio signaling gateways: https://www.twilio.com/docs/sip-trunking/ip-addresses
SIGNALING=['54.172.60.0/30','54.244.51.0/30','54.171.127.192/30','35.156.191.128/30','54.65.63.192/30','54.169.127.128/30','54.252.254.64/30','177.71.206.192/30']
ROOT=Path('/opt/elevate-pbx/repo/infra/pbx/asterisk')
MARKER='; Managed Elevate PARIS business-number ingress'
def run(args):
 result=subprocess.run(args,capture_output=True,text=True,timeout=30)
 if result.returncode:raise ValueError('PBX_INGRESS_COMMAND_FAILED')
 return result.stdout
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
 return text[:match.start(2)]+body+text[match.end(2):]
def verified_identity(text):
 networks=set()
 for raw in re.findall(r'\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}/(?:[0-9]{1,3}\.){3}[0-9]{1,3}|\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}/[0-9]{1,2}\b',text):
  try:networks.add(str(ipaddress.ip_network(raw,strict=False)))
  except ValueError:pass
 return set(SIGNALING).issubset(networks)
def trusted_sip_tls():
 try:
  with socket.create_connection(('127.0.0.1',5061),timeout=5) as raw:
   with ssl.create_default_context().wrap_socket(raw,server_hostname='phone.elevateforhumanity.org') as secure:
    return bool(secure.getpeercert())
 except Exception:return False
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
def tls_endpoint(text):
 pattern=r'(?ms)(^\[elevate-twilio-tls\]\s*\n)(.*?)(?=^\[|\Z)'
 match=re.search(pattern,text)
 if not match:raise ValueError('PBX_TLS_TRANSPORT_UNVERIFIED')
 body=match[2]
 for key,value in [('cert_file','/etc/asterisk/tls/phone.crt'),('priv_key_file','/etc/asterisk/tls/phone.key'),('allow_reload','yes')]:
  body=re.sub(r'^'+key+r'=.*\n?', '',body,flags=re.M)
  body=body.rstrip()+'\n'+key+'='+value+'\n'
 return text[:match.start(2)]+body+text[match.end(2):]
def apply():
 state=cli('core show channels count')
 if not idle_state(state):raise ValueError('PBX_ACTIVE_CALLS_OR_UNKNOWN')
 if run(['systemctl','is-active','elevate-paris-gateway.service']).strip()!='active':raise ValueError('PBX_PARIS_GATEWAY_NOT_ACTIVE')
 # A registered ARI application is required before any incoming route changes.
 if not re.search(r'\belevate-paris\b',cli('ari show apps')):raise ValueError('PBX_PARIS_APPLICATION_UNREGISTERED')
 repair_tls=not trusted_sip_tls()
 pair=certificate_pair() if repair_tls else None
 files=[ROOT/'elevate-twilio.conf',ROOT/'pjsip.conf',ROOT/'extensions.conf',ROOT/'elevate-paris-inbound.conf',ROOT/'elevate-twilio-identity.conf']
 if repair_tls:files += [ROOT/'tls/phone.crt',ROOT/'tls/phone.key']
 if any(p.is_symlink() for p in files):raise ValueError('PBX_INGRESS_SYMLINK_REJECTED')
 for p in files[3:5]:
  if p.exists() and not p.read_text().startswith(MARKER):raise ValueError('PBX_INGRESS_FILE_OWNERSHIP_UNVERIFIED')
 previous={p:p.read_text() if p.exists() else None for p in files}
 new_endpoint=update_endpoint(previous[files[0]] or '')
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
   run(['docker','restart','pbx_asterisk_1'])
   restarted=True
   for attempt in range(30):
    if trusted_sip_tls():break
    time.sleep(1)
   if not trusted_sip_tls():raise ValueError('PBX_TRUSTED_SIP_TLS_FAILED')
  for attempt in range(30):
   if re.search(r'\belevate-paris\b',cli('ari show apps')):break
   time.sleep(1)
  if not re.search(r'\belevate-paris\b',cli('ari show apps')):raise ValueError('PBX_PARIS_NOT_REGISTERED_AFTER_RELOAD')
  endpoint=cli('pjsip show endpoint twilio')
  plan=cli('dialplan show +14632401404@elevate-paris-inbound')
  identity=cli('pjsip show identify elevate-twilio-carrier-identity')
  if not re.search(r'context\s*:\s*elevate-paris-inbound\b',endpoint) or 'Stasis(elevate-paris)' not in plan or not verified_identity(identity):
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
 try:print(json.dumps(apply()))
 except Exception as error:print(json.dumps(failure_evidence(error)));raise SystemExit(1)
