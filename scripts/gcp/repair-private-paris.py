#!/usr/bin/env python3
"""Repair only the existing private Paris gateway, preserving local rollback copies."""
import base64
import configparser
import hashlib
import io
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import time
import urllib.request

EXPECTED_OLD='c2427ab1ff6e204c6699a9ab115a28266de11da937469c8c7f3f6b06338b59df'
DESIRED='0ecf9d0c8e9f0e3d79b95ec10513150714e1ca1efd036c2a16e020c52f76cfd3'
TARGET=Path('/opt/elevate-pbx/paris/ari-media.mjs')
CONFIG=Path('/opt/elevate-pbx/repo/infra/pbx/asterisk/ari.conf')
def run(args):
    result=subprocess.run(args,capture_output=True,text=True,timeout=30)
    if result.returncode: raise ValueError('private_gateway_command_failed')
    return result.stdout
def request(url,headers):
    with urllib.request.urlopen(urllib.request.Request(url,headers=headers),timeout=10) as response:
        return json.loads(response.read(1048576))
def env():
    values={}
    for line in Path('/etc/elevate-pbx/paris.conf').read_text().splitlines():
        match=re.fullmatch(r'([A-Z_0-9]+)=(.*)',line.strip())
        if match: values[match[1]]=match[2].strip().strip('"').strip("'")
    return values
def digest(path): return hashlib.sha256(path.read_bytes()).hexdigest()
def repair(source,revision):
    if not re.fullmatch('[a-f0-9]{40}',revision) or source!=Path('/tmp/elevate-paris-gateway-'+revision+'.mjs'):
        raise ValueError('gateway_bundle_path_invalid')
    if digest(source)!=DESIRED or digest(TARGET) not in [EXPECTED_OLD,DESIRED]:
        raise ValueError('gateway_source_requires_review')
    for path in [TARGET,CONFIG]:
        if path.is_symlink() or not path.is_file() or path.stat().st_uid!=0 or path.stat().st_mode & 0o022:
            raise ValueError('private_gateway_file_ownership_unverified')
    if not re.search(r'^0 active calls?,run(['docker','exec','pbx_asterisk_1','asterisk','-rx','core show channels count']),re.M):
        raise ValueError('active_call_or_unverified_state')
    values=env()
    user=values.get('PARIS_ARI_USER','')
    reference=values.get('PARIS_ARI_PASSWORD_SECRET','')
    if not re.fullmatch('[A-Za-z0-9_-]{1,64}',user) or not re.fullmatch(r'projects/(elegant-racer-299721|484736877039)/secrets/[A-Za-z0-9_-]+/versions/([0-9]+|latest)',reference):
        raise ValueError('gateway_identity_reference_invalid')
    metadata=request('http://169.254.169.254/computeMetadata/v1/instance/service-accounts/default/token',{'Metadata-Flavor':'Google'})
    secret=request('https://secretmanager.googleapis.com/v1/'+reference+':access',{'Authorization':'Bearer '+metadata['access_token']})
    password=base64.b64decode(secret['payload']['data']).decode().strip()
    if not 32<=len(password)<=1024 or any(character in password for character in [chr(0),chr(10),chr(13)]):
        raise ValueError('private_ari_credential_invalid')
    parser=configparser.ConfigParser(interpolation=None)
    parser.read_string(CONFIG.read_text())
    if not parser.has_section('general') or parser.get('general','enabled',fallback='')!='yes':
        raise ValueError('existing_ari_configuration_unverified')
    if not parser.has_section(user): parser.add_section(user)
    for key,value in {'type':'user','read_only':'no','password_format':'plain','password':password}.items(): parser.set(user,key,value)
    output=io.StringIO();parser.write(output)
    original_config_stat=CONFIG.stat()
    asterisk_gid=run(['docker','exec','pbx_asterisk_1','id','-g','asterisk']).strip()
    if not asterisk_gid.isdigit(): raise ValueError('asterisk_config_group_unverified')
    backup=Path('/var/lib/elevate-pbx/rollback')/revision
    backup.mkdir(parents=True,mode=0o700,exist_ok=False)
    shutil.copy2(TARGET,backup/'ari-media.mjs')
    shutil.copy2(CONFIG,backup/'ari.conf')
    os.chmod(backup/'ari.conf',0o600)
    header='Basic '+base64.b64encode((user+':'+password).encode()).decode()
    try:
        run(['systemctl','stop','elevate-paris-gateway.service'])
        CONFIG.write_text(output.getvalue());os.chmod(CONFIG,0o640);os.chown(CONFIG,0,int(asterisk_gid))
        shutil.copyfile(source,TARGET);os.chmod(TARGET,0o644)
        run(['/usr/bin/node','--check',str(TARGET)])
        run(['docker','exec','pbx_asterisk_1','asterisk','-rx','module reload res_ari.so'])
        # Prove the newly configured credential is accepted before resuming the gateway.
        request('http://127.0.0.1:8088/ari/applications',{'Authorization':header})
        run(['systemctl','start','elevate-paris-gateway.service'])
        for attempt in range(20):
            applications=request('http://127.0.0.1:8088/ari/applications',{'Authorization':header})
            if any(app.get('name')=='elevate-paris' for app in applications):
                return {'result':'PASS','scope':'private_ari_gateway_only','sourceSha256':DESIRED,'ariApplicationRegistered':True,'carrierRoutingChanged':False,'callAcceptance':'NOT TESTED'}
            time.sleep(1)
        raise ValueError('paris_ari_application_not_registered')
    except Exception:
        run(['systemctl','stop','elevate-paris-gateway.service'])
        shutil.copy2(backup/'ari-media.mjs',TARGET)
        shutil.copy2(backup/'ari.conf',CONFIG)
        os.chmod(CONFIG,original_config_stat.st_mode & 0o777)
        os.chown(CONFIG,original_config_stat.st_uid,original_config_stat.st_gid)
        run(['docker','exec','pbx_asterisk_1','asterisk','-rx','module reload res_ari.so'])
        run(['systemctl','start','elevate-paris-gateway.service'])
        raise
if __name__=='__main__':
    try: result=repair(Path(sys.argv[1]),sys.argv[2])
    except Exception as error:
        result={'result':'BLOCKED','code':str(error) if isinstance(error,ValueError) and re.fullmatch('[a-z_]+',str(error)) else 'private_gateway_repair_unavailable','carrierRoutingChanged':False}
    print(json.dumps(result))
    raise SystemExit(0 if result['result']=='PASS' else 1)
,run(['docker','exec','pbx_asterisk_1','asterisk','-rx','core show channels count']),re.M):
        raise ValueError('active_call_or_unverified_state')
    values=env()
    user=values.get('PARIS_ARI_USER','')
    reference=values.get('PARIS_ARI_PASSWORD_SECRET','')
    if not re.fullmatch('[A-Za-z0-9_-]{1,64}',user) or not re.fullmatch(r'projects/(elegant-racer-299721|484736877039)/secrets/[A-Za-z0-9_-]+/versions/([0-9]+|latest)',reference):
        raise ValueError('gateway_identity_reference_invalid')
    metadata=request('http://169.254.169.254/computeMetadata/v1/instance/service-accounts/default/token',{'Metadata-Flavor':'Google'})
    secret=request('https://secretmanager.googleapis.com/v1/'+reference+':access',{'Authorization':'Bearer '+metadata['access_token']})
    password=base64.b64decode(secret['payload']['data']).decode().strip()
    if not 32<=len(password)<=1024 or re.search(r'[\\r\\n\\x00]',password):
        raise ValueError('private_ari_credential_invalid')
    parser=configparser.ConfigParser(interpolation=None)
    parser.read_string(CONFIG.read_text())
    if not parser.has_section('general') or parser.get('general','enabled',fallback='')!='yes':
        raise ValueError('existing_ari_configuration_unverified')
    if not parser.has_section(user): parser.add_section(user)
    for key,value in {'type':'user','read_only':'no','password_format':'plain','password':password}.items(): parser.set(user,key,value)
    output=io.StringIO();parser.write(output)
    backup=Path('/var/lib/elevate-pbx/rollback')/revision
    backup.mkdir(parents=True,mode=0o700,exist_ok=False)
    shutil.copy2(TARGET,backup/'ari-media.mjs')
    shutil.copy2(CONFIG,backup/'ari.conf')
    os.chmod(backup/'ari.conf',0o600)
    header='Basic '+base64.b64encode((user+':'+password).encode()).decode()
    try:
        run(['systemctl','stop','elevate-paris-gateway.service'])
        CONFIG.write_text(output.getvalue());os.chmod(CONFIG,0o640)
        shutil.copyfile(source,TARGET);os.chmod(TARGET,0o644)
        run(['/usr/bin/node','--check',str(TARGET)])
        run(['docker','exec','pbx_asterisk_1','asterisk','-rx','module reload res_ari.so'])
        # Prove the newly configured credential is accepted before resuming the gateway.
        request('http://127.0.0.1:8088/ari/applications',{'Authorization':header})
        run(['systemctl','start','elevate-paris-gateway.service'])
        for attempt in range(20):
            applications=request('http://127.0.0.1:8088/ari/applications',{'Authorization':header})
            if any(app.get('name')=='elevate-paris' for app in applications):
                return {'result':'PASS','scope':'private_ari_gateway_only','sourceSha256':DESIRED,'ariApplicationRegistered':True,'carrierRoutingChanged':False,'callAcceptance':'NOT TESTED'}
            time.sleep(1)
        raise ValueError('paris_ari_application_not_registered')
    except Exception:
        run(['systemctl','stop','elevate-paris-gateway.service'])
        shutil.copy2(backup/'ari-media.mjs',TARGET)
        shutil.copy2(backup/'ari.conf',CONFIG)
        run(['docker','exec','pbx_asterisk_1','asterisk','-rx','module reload res_ari.so'])
        run(['systemctl','start','elevate-paris-gateway.service'])
        raise
if __name__=='__main__':
    try: result=repair(Path(sys.argv[1]),sys.argv[2])
    except Exception as error:
        result={'result':'BLOCKED','code':str(error) if isinstance(error,ValueError) and re.fullmatch('[a-z_]+',str(error)) else 'private_gateway_repair_unavailable','carrierRoutingChanged':False}
    print(json.dumps(result))
    raise SystemExit(0 if result['result']=='PASS' else 1)
