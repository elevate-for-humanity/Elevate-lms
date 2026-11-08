#!/usr/bin/env python3
"""Read only health and aggregate resource metadata; never read user files."""
import json,os,subprocess,urllib.request,urllib.error
from pathlib import Path

report={'readOnly':True,'stateChanged':False,'loadAverage':list(os.getloadavg())}
def run(args):
 p=subprocess.run(args,capture_output=True,text=True,timeout=15)
 return p.returncode,p.stdout
try:
 status,sockets=run(['ss','-ltnH'])
 report['listeningPorts']={str(p):any(line.split()[3].rsplit(':',1)[-1]==str(p) for line in sockets.splitlines() if len(line.split())>3) for p in [80,443,3100,8080]}
 status,failed=run(['systemctl','--failed','--no-legend','--plain'])
 report['failedUnitCount']=len([x for x in failed.splitlines() if x.strip()]) if status==0 else None
 try:
  with urllib.request.urlopen('http://127.0.0.1:3100/health',timeout=10) as response:
   body=json.load(response)
   report['browser']={key:body.get(key) for key in ['service','ready','browserConnected','activeSessions','commit']}
   for key in ['terminalRecovery','workspaceRecovery','providerAuthStorage']:
    report['browser'][key]={k:body.get(key,{}).get(k) for k in ['ready','persistent','active']}
 except Exception:report['browser']={'verified':False,'reason':'loopback_browser_probe_unavailable'}
 try:
  with urllib.request.urlopen('http://127.0.0.1/',timeout=10) as response:report['defaultWebHttpStatus']=response.status
 except urllib.error.HTTPError as error:report['defaultWebHttpStatus']=error.code
 except Exception:report['defaultWebHttpStatus']=None
 root=Path('/var/lib/elevate-studio/workspace')
 if root.is_dir():
  count=0;size=0;limited=False
  for current,dirs,files in os.walk(root,followlinks=False):
   dirs[:]=[d for d in dirs if d not in ['node_modules','.next','.cache','.git']]
   for name in files:
    try:info=(Path(current)/name).lstat();count+=1;size+=info.st_size
    except OSError:continue
    if count>=100000:limited=True;break
   if limited:break
  report['retainedWorkspace']={'files':count,'bytes':size,'limited':limited,'fileContentsRead':False,'fileNamesEmitted':False}
 report['retirementApproved']=False
 report['reason']='Live bindings, background work and session recovery must be verified before stopping a VM'
 print(json.dumps(report))
except Exception:
 print(json.dumps({'readOnly':True,'stateChanged':False,'verified':False,'reason':'VM_HEALTH_METADATA_UNAVAILABLE'}))
 raise SystemExit(1)
