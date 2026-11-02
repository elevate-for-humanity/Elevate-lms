#!/usr/bin/env python3
"""Read voicemail prerequisites and fixed error classes; never emit PINs, callers or audio."""
import csv,io,json,re,subprocess

def run(args):
 p=subprocess.run(args,capture_output=True,text=True,timeout=15)
 return p.returncode,p.stdout+p.stderr

def main():
 cli=lambda command:run(['docker','exec','pbx_asterisk_1','asterisk','-rx',command])[1]
 modules={name:bool(re.search(re.escape(name)+r'\s+.*\bRunning\b',cli('module show like '+name)) and 'Not Running' not in cli('module show like '+name)) for name in ['app_voicemail.so','format_wav.so','codec_ulaw.so']}
 uid=run(['docker','exec','pbx_asterisk_1','id','-u','asterisk'])[1].strip();gid=run(['docker','exec','pbx_asterisk_1','id','-g','asterisk'])[1].strip()
 if not uid.isdigit() or not gid.isdigit():raise ValueError()
 permissions={}
 for label,path in [('spool','/var/spool/asterisk'),('voicemail','/var/spool/asterisk/voicemail'),('context','/var/spool/asterisk/voicemail/elevate'),('operator','/var/spool/asterisk/voicemail/elevate/0'),('inbox','/var/spool/asterisk/voicemail/elevate/0/INBOX')]:
  code,details=run(['docker','exec','pbx_asterisk_1','stat','-c','%u %g %a',path])
  fields=details.strip().split()
  entry={'exists':code==0}
  if code==0 and len(fields)==3 and all(v.isdigit() for v in fields):entry.update({'uid':int(fields[0]),'gid':int(fields[1]),'mode':fields[2]})
  entry['asteriskWritable']=run(['docker','exec','--user',uid+':'+gid,'pbx_asterisk_1','test','-w',path])[0]==0
  permissions[label]=entry
 sounds={}
 for name in ['beep','vm-intro','vm-theperson','vm-isunavail','vm-goodbye']:
  found=False
  for folder in ['/var/lib/asterisk/sounds','/var/lib/asterisk/sounds/en','/var/lib/asterisk/sounds/en_US']:
   for suffix in ['ulaw','alaw','gsm','wav','sln']:
    if run(['docker','exec','pbx_asterisk_1','test','-r',folder+'/'+name+'.'+suffix])[0]==0:found=True;break
   if found:break
  sounds[name]=found
 _,config=run(['docker','exec','pbx_asterisk_1','cat','/etc/asterisk/voicemail.conf'])
 general={};section=''
 for line in config.splitlines():
  if re.fullmatch(r'\[[A-Za-z0-9_-]+\]',line.strip()):section=line.strip()[1:-1]
  match=re.fullmatch(r'\s*(format|maxsecs|minsecs|maxmsg|maxsilence|operator)\s*=\s*([A-Za-z0-9_|]+)\s*',line)
  if section=='general' and match:general[match[1]]=match[2]
 logs=run(['docker','logs','--since','15m','--tail','1500','pbx_asterisk_1'])[1]
 for path in ['/var/log/asterisk/messages','/var/log/asterisk/messages.log','/var/log/asterisk/full','/var/log/asterisk/full.log']:
  logs+=run(['docker','exec','pbx_asterisk_1','tail','-n','1500',path])[1]
 logs=re.sub(r'\x1b\[[0-9;]*[A-Za-z]','',logs)
 reasons={label:len(re.findall(pattern,logs,re.I)) for label,pattern in {
  'permissionDenied':r'Permission denied',
  'directoryCreateFailed':r'(?:Unable|Failed|Cannot|Could not) to create.{0,100}(?:director|mailbox)',
  'mailboxMissing':r'No entry in voicemail config|No such mailbox|Mailbox.{0,50}(?:not found|does not exist)|Cannot find mailbox',
  'voicemailConfigFailed':r'No voicemail configuration|Failed to load.*voicemail|Unable to load.*voicemail',
  'soundFileMissing':r'File (?:beep|vm-[A-Za-z-]+) does not exist|Unable to open (?:beep|vm-[A-Za-z-]+)',
  'recordingFormatMissing':r'No format for saving voicemail|No such format|Unable to open.*(?:wav|sln|gsm)',
  'recordingOpenFailed':r'Unable to open file|Unable to lock|Could not lock|Unable to create message',
  'invalidExitExtension':r'Invalid extension|sent to invalid extension|No such extension',
  'voicemailModuleWarning':r'WARNING[^\n]{0,120}app_voicemail[.]c',
 }.items()}
 executions=[{'extension':m[1],'context':m[2],'priority':int(m[3]),'application':m[4]} for m in re.finditer(r'Executing \[(0|s)@(internal|elevate-operator|elevate-pwa-extensions):([0-9]+)\]\s+([A-Za-z]+)',logs)][-40:]
 cdr=[]
 code,history=run(['docker','exec','pbx_asterisk_1','tail','-n','100','/var/log/asterisk/cdr-csv/Master.csv'])
 if code==0:
  for row in csv.reader(io.StringIO(history)):
   if len(row)>16 and row[1] in ['+14632401404','14632401404','4632401404'] and row[9]>='2026-11-02 14:20:00':
    cdr.append({'lastApplication':row[7] if re.fullmatch('[A-Za-z]+',row[7]) else 'other','context':row[3] if re.fullmatch('[A-Za-z0-9_-]+',row[3]) else 'other','disposition':row[14] if re.fullmatch('[A-Z ]+',row[14]) else 'other','started':row[9]})
 gateway=run(['journalctl','-u','elevate-paris-gateway.service','--since','15 minutes ago','--no-pager','-o','cat'])[1]
 gatewayClasses={key:gateway.count(key) for key in ['PARIS_GREETING_SENT','PARIS_TURN_SENT','PARIS_KEYPAD_HANDOFF_FAILED','PARIS_CALL_RELEASE_FAILED','PARIS_TURN_FAILED','PARIS_BRIDGE_FAILED']}
 priorTrace=[]
 _,names=run(['docker','exec','pbx_asterisk_1','find','-L','/var/log/asterisk','-maxdepth','1','-type','f','-name','efhvm_*'])
 for path in names.splitlines():
  if not re.fullmatch(r'/var/log/asterisk/efhvm_[0-9a-f]{10}',path):continue
  _,raw=run(['docker','exec','pbx_asterisk_1','tail','-n','1000',path])
  raw=re.sub(r'\x1b\[[0-9;]*[A-Za-z]','',raw)
  # Existing private test traces only: export fixed locations and dialplan
  # priority numbers, never recording content, caller identifiers or credentials.
  spawned=[{'context':m[1],'priority':int(m[3])} for m in re.finditer(r'Spawn extension \(([A-Za-z0-9_-]+),\s*([^,]*),\s*(-?[0-9]+)\) exited non-zero',raw)]
  warnings=[{'file':m[1],'line':int(m[2]),'function':m[3]} for line in raw.splitlines() if re.search(r'\b(?:WARNING|ERROR|NOTICE)\b',line) for m in [re.search(r'([A-Za-z0-9_]+[.]c):([0-9]+)\s+([A-Za-z0-9_]+):',line)] if m]
  vocabulary=set("asterisk verbose warning error notice channel spawn extension exited non zero on left joined simple_bridge basic-bridge playing language unable to open file failed fail rtp write read hangup soft hangingup stasis voicemail gosub return gotoif noop set executing remote unix connection disconnected started stopped cannot no such directory permission denied invalid format wav ulaw slin audio unsupported stream sound sounds eof received sent sending data packet frames frame socket bridge internal elevate-operator elevate-paris-inbound done voicemail vm-theperson.ulaw vm-intro.ulaw vm-isunavail.ulaw vm-goodbye.ulaw beep.ulaw digits/0.ulaw is does not exist in any res resume dialplan priority all digital recording record version module busy broken pipe cause reason requested requestedby for from with of and at duration stored an into the ast_channel channel_read channel_write format_wav.c file.c pbx.c app_voicemail.c control.c res_stasis.c".split())
  templates=[re.sub(r'[A-Za-z0-9_./:+-]+',lambda m:m[0] if m[0].lower() in vocabulary else '<value>',line)[-380:] for line in raw.splitlines()[-25:]]
  if 'exited non-zero' in raw or warnings:priorTrace.append({'staticMessageTemplates':templates,'spawnedExitPoints':spawned[-10:],'warningSourceLocations':warnings[-10:],'lineCount':len(raw.splitlines())})
 settings=cli('core show settings')
 verbosity={key:int(m[1]) for key,pattern in [('root',r'Root console verbosity:\s*([0-9]+)'),('current',r'Current console verbosity:\s*([0-9]+)')] for m in [re.search(pattern,settings)] if m}
 routes={label:cli(command) for label,command in [('operatorEntry','dialplan show 0@internal'),('operatorFallback','dialplan show s@elevate-operator'),('operatorDeviceReturn','dialplan show 0@elevate-pwa-extensions')]}
 logger=cli('logger show channels')
 # These three dialplans contain only application names and internal endpoint IDs.
 # No credentials or unrelated call logs are returned.
 print(json.dumps({'ownedOperatorDialplans':routes,'recentOperatorExecution':executions,'ownedTestCdr':cdr[-5:],'priorOwnedTrace':priorTrace,'verbosity':verbosity,'gatewayClasses':gatewayClasses,'loggerDestinations':logger,'voicemailDiagnostics':True,'callsPlaced':0,'configurationChanged':False,'modules':modules,'permissions':permissions,'promptAvailability':sounds,'safeGeneralSettings':general,'recentWarningClasses':reasons}))
if __name__=='__main__':
 try:main()
 except Exception:print(json.dumps({'voicemailDiagnostics':True,'error':'PHONE_VOICEMAIL_DIAGNOSTICS_UNAVAILABLE','callsPlaced':0}));raise SystemExit(1)
