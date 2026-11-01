#!/usr/bin/env python3
"""Restore only the authenticated loopback PARIS HTTPS route, with rollback."""
import http.client,json,re,shutil,socket,ssl,subprocess,tempfile
from pathlib import Path
FILE=Path('/opt/elevate-pbx/tls-proxy/Caddyfile')
BACKUPS=Path('/var/lib/elevate-pbx/rollback')
HOST='phone.elevateforhumanity.org'
ANCHOR='  respond /healthz "ok" 200'
BLOCK='''  # Managed PARIS turn service: loopback HTTPS plus application bearer auth.
  @parisTurn {
    path /internal/paris/turn
    method POST
    remote_ip 127.0.0.1 ::1
  }
  handle @parisTurn {
    request_body {
      max_size 220KB
    }
    reverse_proxy 127.0.0.1:8091 {
      transport http {
        response_header_timeout 30s
      }
    }
  }
  @parisTurnPublic path /internal/paris/turn
  handle @parisTurnPublic {
    respond 403
  }
'''

def run(args):
 p=subprocess.run(args,capture_output=True,text=True,timeout=30)
 if p.returncode:raise ValueError('PARIS_PROXY_COMMAND_FAILED')
 return p.stdout

def private_status():
 connection=http.client.HTTPSConnection(HOST,context=ssl.create_default_context(),timeout=10)
 try:
  connection.sock=ssl.create_default_context().wrap_socket(socket.create_connection(('127.0.0.1',443),timeout=10),server_hostname=HOST)
  connection.request('POST','/internal/paris/turn',body='{}',headers={'Content-Type':'application/json'})
  return connection.getresponse().status
 finally:connection.close()

def render(original):
 if BLOCK in original:return original
 if original.count(HOST+' {')!=1 or original.count(ANCHOR)!=1:raise ValueError('PARIS_PROXY_HOST_SCOPE_UNVERIFIED')
 if '/internal/paris/turn' in original or '@parisTurn' in original:raise ValueError('PARIS_PROXY_EXISTING_ROUTE_REQUIRES_REVIEW')
 return original.replace(ANCHOR,BLOCK+ANCHOR,1)

def require_mount(container):
 if not container.get('State',{}).get('Running') or not any(m.get('Type')=='bind' and m.get('Source')==str(FILE) and m.get('Destination')=='/etc/caddy/Caddyfile' for m in container.get('Mounts',[])):raise ValueError('PARIS_PROXY_MOUNT_UNVERIFIED')

def require_file_ownership(filename):
 if filename.is_symlink() or not filename.is_file() or filename.stat().st_uid!=0 or filename.stat().st_mode & 0o022:raise ValueError('PARIS_PROXY_FILE_OWNERSHIP_UNVERIFIED')

def repair():
 require_file_ownership(FILE)
 require_mount(json.loads(run(['docker','inspect','elevate-pbx-wss-proxy']))[0])
 state=run(['docker','exec','pbx_asterisk_1','asterisk','-rx','core show channels count'])
 if not all(re.search(r'^0 active '+kind+r's?\s*$',state,re.M) for kind in ['call','channel']):raise ValueError('PARIS_PROXY_ACTIVE_CALLS_OR_UNKNOWN')
 original=FILE.read_text();before=private_status()
 print(json.dumps({'privateTurnUnauthorizedStatusBefore':before,'existingTurnRouteMentions':original.count('/internal/paris/turn')}),flush=True)
 updated=render(original)
 if updated==original:
  if before!=401:raise ValueError('PARIS_PROXY_EXISTING_ROUTE_UNHEALTHY')
  return {'result':'PASS','changed':False,'privateUnauthorizedStatus':before}
 backup_root=BACKUPS;backup_root.mkdir(mode=0o700,parents=True,exist_ok=True)
 backup=Path(tempfile.mkdtemp(prefix='paris-turn-proxy-',dir=backup_root));shutil.copy2(FILE,backup/'Caddyfile')
 reload=['docker','exec','elevate-pbx-wss-proxy','caddy','reload','--config','/etc/caddy/Caddyfile','--adapter','caddyfile']
 try:
  FILE.write_text(updated) # Preserve the inode used by the established bind mount.
  run(['docker','exec','elevate-pbx-wss-proxy','caddy','validate','--config','/etc/caddy/Caddyfile','--adapter','caddyfile'])
  run(reload)
  if private_status()!=401:raise ValueError('PARIS_PROXY_AUTH_READBACK_FAILED')
 except Exception:
  FILE.write_text(original);run(reload);raise
 return {'result':'PASS','changed':True,'privateUnauthorizedStatus':401,'loopbackOnlyTurnRoute':True,'applicationBearerAuthenticationRequired':True,'carrierRoutingChanged':False}
if __name__=='__main__':
 try:print(json.dumps(repair()))
 except Exception as e:print(json.dumps({'result':'FAIL','code':str(e) if isinstance(e,ValueError) and re.fullmatch('PARIS_PROXY_[A-Z_]+',str(e)) else 'PARIS_PROXY_REPAIR_FAILED'}));raise SystemExit(1)
