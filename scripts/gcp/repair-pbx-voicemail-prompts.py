#!/usr/bin/env python3
"""Restore missing official core prompts, preserving custom sounds and all recordings."""
import hashlib,io,json,os,re,subprocess,tarfile,tempfile,urllib.request
from pathlib import Path,PurePosixPath
URL='https://downloads.asterisk.org/pub/telephony/sounds/releases/asterisk-core-sounds-en-ulaw-1.6.1.tar.gz'
SHA256='83ec602fb1f2cb06a5194a95f855b84bae35d49d5bdb6fbd9274d5d1a5d16b0e'
PHASE="initial"
REQUIRED=['beep.ulaw','vm-intro.ulaw','vm-theperson.ulaw','vm-isunavail.ulaw','vm-goodbye.ulaw','digits/0.ulaw']
def run(args):
 p=subprocess.run(args,capture_output=True,text=True,timeout=30)
 if p.returncode:raise ValueError('PBX_PROMPT_COMMAND_FAILED')
 return p.stdout

def idle():
 if not re.search(r'^0 active calls?$',run(['docker','exec','pbx_asterisk_1','asterisk','-rx','core show channels count']),re.M):raise ValueError('PBX_PROMPT_ACTIVE_CALL_OR_UNKNOWN_STATE')

def members(data):
 if hashlib.sha256(data).hexdigest()!=SHA256:raise ValueError('PBX_PROMPT_CHECKSUM_MISMATCH')
 result={}
 with tarfile.open(fileobj=io.BytesIO(data),mode='r:gz') as archive:
  for item in archive:
   name=PurePosixPath(item.name)
   if item.isdir():continue
   if not item.isfile() or name.is_absolute() or '..' in name.parts or not re.fullmatch(r'[A-Za-z0-9_./-]+',item.name) or item.size>2_000_000:raise ValueError('PBX_PROMPT_UNSAFE_ARCHIVE')
   if not (item.name.endswith('.ulaw') or item.name.startswith(('LICENSE','CHANGES','CREDITS')) or item.name=='.asterisk-core-sounds-en-ulaw-1.6.1'):continue
   result[item.name]=archive.extractfile(item).read(2_000_001)
 if not all(name in result for name in REQUIRED) or sum(map(len,result.values()))>30_000_000:raise ValueError('PBX_PROMPT_ARCHIVE_INCOMPLETE')
 return result

def install_files(root,files):
 # Never replace a pre-existing sound, follow a symlink, or touch the voicemail spool.
 created=[];directories=[]
 try:
  for name,data in files.items():
   target=root/name
   for directory in reversed(target.parents):
    if directory==root or root in directory.parents:
     if directory.is_symlink():raise ValueError('PBX_PROMPT_SYMLINK_REJECTED')
     if not directory.exists():directory.mkdir(mode=0o755);directories.append(directory)
   if target.is_symlink():raise ValueError('PBX_PROMPT_SYMLINK_REJECTED')
   if target.exists():continue
   fd=os.open(target,os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o644);created.append(target)
   with os.fdopen(fd,'wb') as stream:stream.write(data);stream.flush();os.fsync(stream.fileno())
  return created,directories
 except Exception:
  rollback(created,directories);raise

def rollback(files,directories):
 for path in reversed(files):path.unlink(missing_ok=True)
 for path in reversed(directories):
  try:path.rmdir()
  except OSError:pass

def main():
 global PHASE
 PHASE="idle_check"
 idle()
 PHASE="container_identity"
 info=json.loads(run(['docker','inspect','pbx_asterisk_1']))[0]
 if info['Config']['Image']!='mlan/asterisk:xtra-1.1.13' or info['HostConfig']['NetworkMode']!='host':raise ValueError('PBX_PROMPT_CONTAINER_UNVERIFIED')
 mounts=[m for m in info['Mounts'] if m['Destination']=='/var/lib/asterisk' and m.get('RW')]
 if len(mounts)!=1:raise ValueError('PBX_PROMPT_PERSISTENCE_UNVERIFIED')
 root=Path(mounts[0]['Source'])
 if not root.is_absolute() or root.is_symlink() or not root.is_dir():raise ValueError('PBX_PROMPT_VOLUME_UNVERIFIED')
 # Verify the actual runtime data directory, not only the repository default.
 PHASE="runtime_directory"
 settings=run(['docker','exec','pbx_asterisk_1','asterisk','-rx','core show settings'])
 if not re.search(r'Data directory:\s*/var/lib/asterisk\s*$',settings,re.M):raise ValueError('PBX_PROMPT_RUNTIME_DIRECTORY_UNVERIFIED')
 PHASE="official_archive_download"
 with urllib.request.urlopen(URL,timeout=40) as response:data=response.read(12_000_001)
 PHASE="archive_validation"
 files=members(data);idle();created=[];directories=[]
 try:
  PHASE="install_missing_files"
  created,directories=install_files(root,{'sounds/en/'+name:data for name,data in files.items()})
  PHASE="runtime_read_verification"
  for name in REQUIRED:
   run(['docker','exec','--user','asterisk','pbx_asterisk_1','test','-r','/var/lib/asterisk/sounds/en/'+name])
 except Exception:
  rollback(created,directories);raise
 print(json.dumps({'result':'PASS','scope':'missing_official_english_core_prompts','archiveSha256':SHA256,'filesAdded':len(created),'requiredPromptsReadable':True,'configurationChanged':False,'servicesRestarted':False,'callsPlaced':0,'recordingsChanged':False}))
if __name__=='__main__':
 try:main()
 except Exception as e:
  print(json.dumps({'result':'FAIL','code':str(e) if isinstance(e,ValueError) and re.fullmatch('PBX_PROMPT_[A-Z_]+',str(e)) else 'PBX_PROMPT_REPAIR_UNAVAILABLE','phase':PHASE,'exceptionClass':type(e).__name__,'httpStatus':getattr(e,'code',None) if isinstance(getattr(e,'code',None),int) else None}));raise SystemExit(1)
