#!/usr/bin/env python3
"""Read-only transport diagnosis. Never emit certificates, keys or raw logs."""
import json,re,socket,ssl,subprocess,hashlib,os,tempfile,shutil,time
from pathlib import Path

def run(args):
 r=subprocess.run(args,capture_output=True,text=True,timeout=20)
 return (r.stdout+(r.stderr if args[:2]==['docker','logs'] else '')) if r.returncode==0 else ''

def probe(host,port=5061,tls12=False):
 stage='tcp_connect'
 try:
  with socket.create_connection((host,port),timeout=5) as raw:
   stage='tls_handshake'
   context=ssl.create_default_context()
   if tls12:context.minimum_version=context.maximum_version=ssl.TLSVersion.TLSv1_2;context.set_ciphers('ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384')
   with context.wrap_socket(raw,server_hostname='phone.elevateforhumanity.org') as secure:
    return {'trusted':bool(secure.getpeercert()),'protocol':secure.version()}
 except ssl.SSLCertVerificationError as e:return {'stage':stage,'error':'certificate_verification','verifyCode':e.verify_code}
 except ssl.SSLError as e:return {'stage':stage,'error':'tls_handshake_failed','reason':e.reason if re.fullmatch(r'[A-Z0-9_]{1,100}',str(e.reason)) else 'unclassified'}
 except TimeoutError:return {'stage':stage,'error':'timeout'}
 except ConnectionRefusedError:return {'stage':stage,'error':'refused'}
 except OSError:return {'stage':stage,'error':'network_unavailable'}

def trusted_gateway_pair():
 with socket.create_connection(('127.0.0.1',443),timeout=5) as raw:
  with ssl.create_default_context().wrap_socket(raw,server_hostname='phone.elevateforhumanity.org') as secure:
   fingerprint=hashlib.sha256(secure.getpeercert(binary_form=True)).hexdigest()
 matches=[]
 for cert in Path('/var/lib/elevate-pbx-tls/data/caddy/certificates').glob('*/phone.elevateforhumanity.org/phone.elevateforhumanity.org.crt'):
  pem=re.search(r'-----BEGIN CERTIFICATE-----.*?-----END CERTIFICATE-----',cert.read_text(),re.S)
  key=cert.with_suffix('.key')
  if pem and key.is_file() and not cert.is_symlink() and not key.is_symlink() and hashlib.sha256(ssl.PEM_cert_to_DER_cert(pem[0])).hexdigest()==fingerprint:
   matches.append((cert,key))
 if len(matches)!=1:raise ValueError('trusted_pair_unverified')
 return matches[0]

def isolated_config(text):
 pattern=r'(?ms)(^\[elevate-twilio-tls\]\s*\n)(.*?)(?=^\[|\Z)'
 match=re.search(pattern,text)
 if not match:raise ValueError('transport_unverified')
 body=match[2]
 for key,value in [('cert_file','/etc/asterisk/tls/phone.crt'),('priv_key_file','/etc/asterisk/tls/phone.key')]:
  body=re.sub(r'^'+key+r'=.*\n?', '',body,flags=re.M).rstrip()+'\n'+key+'='+value+'\n'
 return text[:match.start(2)]+body+text[match.end(2):]

def copy_internal_config(source,target,root,ancestors=frozenset()):
 resolved=source.resolve(strict=True)
 if not resolved.is_relative_to(root):raise ValueError('external_config_symlink_rejected')
 info=resolved.stat()
 if resolved.is_dir():
  if resolved in ancestors:raise ValueError('config_symlink_cycle_rejected')
  target.mkdir(mode=info.st_mode & 0o777)
  for child in resolved.iterdir():copy_internal_config(child,target/child.name,root,ancestors|{resolved})
  shutil.copystat(resolved,target)
 elif resolved.is_file():shutil.copy2(resolved,target)
 else:raise ValueError('config_special_file_rejected')
 os.chown(target,info.st_uid,info.st_gid)

def isolated_diagnosis():
 name='elevate-sip-tls-readonly-probe';network=name+'-internal'
 root=Path('/opt/elevate-pbx/repo/infra/pbx/asterisk')
 inspect=subprocess.run(['docker','inspect','pbx_asterisk_1'],capture_output=True,text=True,timeout=10)
 live=json.loads(inspect.stdout)[0]
 mounts=[m for m in live.get('Mounts',[]) if m.get('Destination')=='/etc/asterisk']
 if not live.get('State',{}).get('Running') or len(mounts)!=1 or mounts[0].get('Source')!=str(root) or mounts[0].get('Type')!='bind':raise ValueError('mount_unverified')
 for kind,target in [('container',name),('network',network)]:
  if subprocess.run(['docker',kind,'inspect',target],capture_output=True,timeout=10).returncode==0:raise ValueError('prior_probe_requires_review')
 pair=trusted_gateway_pair()
 with tempfile.TemporaryDirectory(prefix='elevate-isolated-sip-',dir='/var/tmp') as directory:
  staging=Path(directory)/'asterisk';copy_internal_config(root,staging,root.resolve(strict=True))
  fragment=staging/'elevate-twilio.conf';fragment.write_text(isolated_config(fragment.read_text()))
  gid=int(subprocess.run(['docker','exec','pbx_asterisk_1','id','-g','asterisk'],capture_output=True,text=True,check=True,timeout=10).stdout.strip())
  (staging/'tls').mkdir(exist_ok=True)
  os.chown(staging/'tls',0,gid);os.chmod(staging/'tls',0o750)
  for source,filename in zip(pair,['phone.crt','phone.key']):
   target=staging/'tls'/filename;shutil.copy2(source,target);os.chown(target,0,gid);os.chmod(target,0o640)
  created=False;network_created=False
  def required(args):
   result=subprocess.run(args,capture_output=True,text=True,timeout=25)
   if result.returncode:raise ValueError('isolated_command_failed')
   return result.stdout
  try:
   required(['docker','network','create','--internal','--driver=bridge',network]);network_created=True
   required(['docker','run','-d','--name',name,'--network='+network,'--restart=no','--add-host','elevate-4632401404.pstn.twilio.com:127.0.0.1','-v',str(staging)+':/etc/asterisk:ro','--entrypoint','asterisk',live['Image'],'-f','-C','/etc/asterisk/asterisk.conf']);created=True
   ready=False
   for _ in range(15):
    result=subprocess.run(['docker','exec',name,'asterisk','-rx','pjsip show transport elevate-twilio-tls'],capture_output=True,text=True,timeout=5)
    if result.returncode==0 and re.search(r'protocol\s*:\s*tls\b',result.stdout):ready=True;break
    time.sleep(1)
   instance=json.loads(required(['docker','inspect',name]))[0]
   ip=instance['NetworkSettings']['Networks'][network]['IPAddress']
   import ipaddress
   if not ipaddress.ip_address(ip).is_private:raise ValueError('probe_network_unverified')
   result={'sameRunningImage':instance['Image']==live['Image'],'internalNetworkOnly':True,'publishedPorts':bool(instance.get('HostConfig',{}).get('PortBindings')),'transportLoaded':ready,'handshake':probe(ip) if ready else {'error':'transport_not_loaded'}}
   result['uptimeAvailable']='System uptime:' in required(['docker','exec',name,'asterisk','-rx','core show uptime'])
   def inside_probe():
    try:
     check=subprocess.run(['docker','exec',name,'openssl','s_client','-connect','127.0.0.1:5061','-servername','phone.elevateforhumanity.org','-verify_hostname','phone.elevateforhumanity.org','-verify_return_error','-CAfile','/etc/ssl/certs/ca-certificates.crt','-state'],input='',capture_output=True,text=True,timeout=8)
     output=check.stdout+check.stderr
     return {'trusted':check.returncode==0 and bool(re.search(r'Verification: OK|Verify return code: 0 \(ok\)',output)), 'completed':True, 'handshakeFailure':bool(re.search(r'handshake failure|no shared cipher',output,re.I))}
    except subprocess.TimeoutExpired as e:
     partial=(e.stderr or b'').decode(errors='replace') if isinstance(e.stderr,bytes) else (e.stderr or '')
     states=re.findall(r'SSL_connect:([A-Za-z0-9 /_.-]{1,100})',partial)
     return {'trusted':False,'error':'timeout','lastState':states[-1] if states else 'not_observed'}
   result['insideHandshake']=inside_probe()
   started=subprocess.run(['docker','exec','-d',name,'openssl','s_server','-accept','5062','-cert','/etc/asterisk/tls/phone.crt','-key','/etc/asterisk/tls/phone.key','-cert_chain','/etc/asterisk/tls/phone.crt','-quiet'],capture_output=True,timeout=5)
   if started.returncode==0:
    time.sleep(1);result['opensslServerHandshake']=probe(ip,5062);result['opensslServerTls12Handshake']=probe(ip,5062,True)
   logs=subprocess.run(['docker','logs','--tail','300',name],capture_output=True,text=True,timeout=10)
   message_log=subprocess.run(['docker','exec',name,'tail','-n','300','/var/log/asterisk/messages'],capture_output=True,text=True,timeout=5)

   result['logSignals']={key:bool(re.search(pattern,logs.stdout+logs.stderr+message_log.stdout,re.I)) for key,pattern in {'noSharedCipher':'no shared cipher','certificateLoadError':'Unable to load.*(?:cert|key)','permissionDenied':'Permission denied','configLoadError':'Could not create an object|Error parsing'}.items()}
   # Restart only the private probe with a transport-only PJSIP configuration.
   # The live process, configuration and call routes remain untouched.
   transport=re.search(r'(?ms)^\[elevate-twilio-tls\]\s*\n.*?(?=^\[|\Z)',fragment.read_text())
   if not transport:raise ValueError('transport_unverified')
   (staging/'pjsip.conf').write_text(transport[0])
   required(['docker','restart',name])
   minimal_ready=False
   for _ in range(15):
    check=subprocess.run(['docker','exec',name,'asterisk','-rx','pjsip show transport elevate-twilio-tls'],capture_output=True,text=True,timeout=5)
    if check.returncode==0 and re.search(r'protocol\s*:\s*tls\b',check.stdout):minimal_ready=True;break
    time.sleep(1)
   result['transportOnlyHandshake']=probe(ip) if minimal_ready else {'error':'transport_not_loaded'}
   result['transportOnlyInsideHandshake']=inside_probe() if minimal_ready else {'error':'transport_not_loaded'}
   result['credentialVariants']={}
   for variant in ['hashedCaDirectory','noExplicitCaFile','leafOnlyCertificate']:
    config=transport[0]
    if variant in ['hashedCaDirectory','noExplicitCaFile']:
     config=re.sub(r'^ca_list_file=.*\n?', '',config,flags=re.M)
    if variant=='hashedCaDirectory':config=config.rstrip()+'\nca_list_path=/etc/ssl/certs\n'
    if variant=='leafOnlyCertificate':
     pem=re.search(r'-----BEGIN CERTIFICATE-----.*?-----END CERTIFICATE-----',pair[0].read_text(),re.S)
     if not pem:raise ValueError('trusted_pair_unverified')
     (staging/'tls/phone.crt').write_text(pem[0]+'\n')
    (staging/'pjsip.conf').write_text(config)
    (staging/'logger.conf').write_text('[general]\n[logfiles]\nconsole=>debug,verbose,notice,warning,error\nmessages=>debug,verbose,notice,warning,error\n')
    required(['docker','restart',name])
    variant_ready=False
    for _ in range(15):
     check=subprocess.run(['docker','exec',name,'asterisk','-rx','pjsip show transport elevate-twilio-tls'],capture_output=True,text=True,timeout=5)
     if check.returncode==0 and re.search(r'protocol\s*:\s*tls\b',check.stdout):variant_ready=True;break
     time.sleep(1)
    if variant_ready:
     for command in ['pjproject set log level 6','core set debug 5']:required(['docker','exec',name,'asterisk','-rx',command])
    result['credentialVariants'][variant]=probe(ip,tls12=True) if variant_ready else {'error':'transport_not_loaded'}
    logs=subprocess.run(['docker','logs','--tail','400',name],capture_output=True,text=True,timeout=10)
    log=logs.stdout+logs.stderr
    result['credentialVariants'][variant]['debugSignals']={label:bool(re.search(pattern,log,re.I)) for label,pattern in {
     'ecdhInitialized':'SSL ECDH initialized','caLoaded':'CA certificates loaded','caReadError':'Error reading CA certificates','certificateReadError':'Error.*(?:certificate|private key)',
     'handshakeError':'SSL_ERROR|handshake.*fail','connectionAccepted':'Accepted.*(?:TLS|connection)|new TCP connection','tlsLogPresent':'TLS|SSL'}.items()}
    process=json.loads(required(['docker','inspect',name]))[0]['State']['Pid']
    waits={}
    for task in Path('/proc/'+str(process)+'/task').iterdir():
     try:wait=(task/'wchan').read_text().strip()
     except OSError:continue
     if re.fullmatch(r'[a-zA-Z0-9_]{1,80}',wait):waits[wait]=waits.get(wait,0)+1
    result['credentialVariants'][variant]['threadWaitCounts']=waits
   result['straceAvailable']=bool(shutil.which('strace'))
   return result
  finally:
   if created:required(['docker','rm','-f',name])
   if network_created:required(['docker','network','rm',network])

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
 try:isolated=isolated_diagnosis()
 except Exception as error:isolated={'error':str(error) if isinstance(error,ValueError) and re.fullmatch('[a-z_]+',str(error)) else 'isolated_diagnosis_unavailable'}
 print(json.dumps({'isolatedTls':isolated,'readOnly':True,'configurationChanged':False,'transportSettings':settings,
  'tlsFileChecks':file_checks,'tcpListeners':binds,'loopback':probe('127.0.0.1'),
  'logSignals':{key:bool(re.search(pattern,logs,re.I)) for key,pattern in patterns.items()}}))
if __name__=='__main__':main()
