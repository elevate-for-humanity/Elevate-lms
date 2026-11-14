#!/usr/bin/env python3
"""Add only authenticated device control routes to the existing TLS gateway."""
import http.client
import json
from pathlib import Path
import re
import subprocess

FILE=Path('/opt/elevate-pbx/tls-proxy/Caddyfile')
BLOCK='''  @provisioning {
    path /internal/pbx/devices /internal/pbx/devices/status /internal/pbx/devices/revoke
    method POST
  }
  handle @provisioning {
    request_body {
      max_size 8KB
    }
    reverse_proxy 127.0.0.1:8090
  }
'''
def run(args):
    result=subprocess.run(args,capture_output=True,text=True,timeout=30)
    if result.returncode: raise ValueError('existing_tls_gateway_command_failed')
    return result.stdout
def status():
    connection=http.client.HTTPSConnection('phone.elevateforhumanity.org',443,timeout=10)
    try:
        connection.request('POST','/internal/pbx/devices',body='{}',headers={'Content-Type':'application/json'})
        return connection.getresponse().status
    finally: connection.close()
def repair():
    if FILE.is_symlink() or FILE.stat().st_uid!=0 or FILE.stat().st_mode & 0o022:
        raise ValueError('tls_gateway_config_ownership_unverified')
    running=run(['docker','inspect','elevate-pbx-wss-proxy','--format','{{.State.Running}}']).strip()
    if running!='true': raise ValueError('existing_tls_gateway_not_running')
    if not re.search(r'^0 active calls?$',run(['docker','exec','pbx_asterisk_1','asterisk','-rx','core show channels count']),re.M):
        raise ValueError('active_call_or_unverified_state')
    connection=http.client.HTTPConnection('127.0.0.1',8090,timeout=5)
    connection.request('POST','/internal/pbx/devices',body='{}',headers={'Content-Type':'application/json'})
    private_status=connection.getresponse().status
    connection.close()
    if private_status!=401: raise ValueError('private_provisioner_auth_not_verified')
    original=FILE.read_text()
    if BLOCK in original:
        if status()!=401: raise ValueError('existing_provisioning_proxy_not_healthy')
        return {'result':'PASS','changed':False,'scope':'authenticated_device_proxy_only'}
    if '@provisioning' in original or '  respond /healthz "ok" 200' not in original or 'phone.elevateforhumanity.org {' not in original:
        raise ValueError('existing_tls_routes_require_review')
    updated=original.replace('  respond /healthz "ok" 200',BLOCK+'  respond /healthz "ok" 200')
    backup=Path('/var/lib/elevate-pbx/rollback/provisioner-Caddyfile.original')
    backup.parent.mkdir(mode=0o700,parents=True,exist_ok=True)
    if backup.exists() and backup.read_text()!=original:
        raise ValueError('existing_proxy_backup_requires_review')
    if not backup.exists():
        backup.write_text(original);backup.chmod(0o600)
    try:
        # Keep the inode: the established container bind-mounts this exact file.
        FILE.write_text(updated)
        run(['docker','exec','elevate-pbx-wss-proxy','caddy','validate','--config','/etc/caddy/Caddyfile','--adapter','caddyfile'])
        run(['docker','exec','elevate-pbx-wss-proxy','caddy','reload','--config','/etc/caddy/Caddyfile','--adapter','caddyfile'])
        if status()!=401: raise ValueError('provisioner_proxy_auth_not_verified')
        return {'result':'PASS','changed':True,'scope':'authenticated_device_proxy_only','publicAriExposed':False,'carrierRoutingChanged':False}
    except Exception:
        FILE.write_text(original)
        run(['docker','exec','elevate-pbx-wss-proxy','caddy','reload','--config','/etc/caddy/Caddyfile','--adapter','caddyfile'])
        raise
if __name__=='__main__':
    try: report=repair()
    except Exception as error:
        report={'result':'BLOCKED','code':str(error) if isinstance(error,ValueError) and re.fullmatch('[a-z_]+',str(error)) else 'device_proxy_repair_unavailable'}
    print(json.dumps(report))
    raise SystemExit(0 if report['result']=='PASS' else 1)
