import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const bootstrap=fileURLToPath(new URL('./terminal-init.sh',import.meta.url));

export class TerminalSessionError extends Error {
  constructor(code,status=503){super(code);this.code=code;this.status=status;}
}
const validOwner=value=>typeof value==='string'&&/^[a-zA-Z0-9_-]{1,128}$/.test(value);
const validId=value=>typeof value==='string'&&/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(value);

// Checkpoints contain output and working-directory metadata, never commands to
// replay. A restored process is explicitly interrupted until its owner resumes.
export class TerminalSessions {
  constructor({secret,directory,cwd,spawnShell=spawn,maxActive=4,maxOutputBytes=262144,maxCached=64}={}){
    this.key=secret?crypto.createHash('sha256').update(secret+'\0studio-terminal-v1').digest():null;
    this.directory=directory;this.cwd=path.resolve(cwd);this.spawnShell=spawnShell;
    this.maxCached=Math.max(maxActive,maxCached);this.maxActive=maxActive;this.maxOutputBytes=maxOutputBytes;this.sessions=new Map();
  }
  async readiness(){
    if(!this.directory)return {ready:true,persistent:false,active:this.activeCount(),ownerScoped:true,restoreMode:'explicit-resume'};
    let probe;
    try{
      if(!this.key)throw Error('key_missing');
      await fs.mkdir(this.directory,{recursive:true,mode:0o700});
      probe=path.join(this.directory,'.readiness-'+crypto.randomUUID());
      await fs.writeFile(probe,'studio-terminal-storage-probe',{mode:0o600,flag:'wx'});
      await fs.unlink(probe);probe=null;
      return {ready:true,persistent:true,active:this.activeCount(),ownerScoped:true,restoreMode:'explicit-resume'};
    }catch{return {ready:false,persistent:true,active:this.activeCount(),ownerScoped:true,restoreMode:'explicit-resume',error:'terminal_checkpoint_unavailable'};}
    finally{if(probe)await fs.unlink(probe).catch(()=>{});}
  }
  validate(owner,id){if(!validOwner(owner)||!validId(id))throw new TerminalSessionError('terminal_session_not_found',404);}
  filename(owner,id){this.validate(owner,id);if(!this.key||!this.directory)throw new TerminalSessionError('terminal_checkpoint_unavailable');return path.join(this.directory,crypto.createHmac('sha256',this.key).update(owner+'\0'+id).digest('hex')+'.json');}
  activeCount(){return [...this.sessions.values()].filter(s=>['starting','running'].includes(s.state)).length;}
  pruneCache(){
    if(!this.directory)return; // Volatile sessions cannot be evicted safely.
    for(const [id,s] of this.sessions){
      if(this.sessions.size<this.maxCached)break;
      if(!s.shell&&!s.startingPromise&&s.savedVersion===s.version){clearTimeout(s.timer);this.sessions.delete(id);}
    }
  }
  record(s,stream,data){
    const bytes=Buffer.from(String(data));const clipped=bytes.subarray(Math.max(0,bytes.length-Math.min(65536,this.maxOutputBytes))).toString('utf8');
    s.output.push({seq:++s.cursor,stream,data:clipped,at:new Date().toISOString(),...(bytes.length>Math.min(65536,this.maxOutputBytes)?{truncated:true}:{})});
    s.bytes+=Buffer.byteLength(clipped);s.version++;
    while(s.output.length>2000||s.bytes>this.maxOutputBytes){s.bytes-=Buffer.byteLength(s.output.shift().data);}
    if(!s.timer)s.timer=setTimeout(()=>{s.timer=null;void this.flush(s).catch(()=>{s.checkpointFailed=true;});},1000).unref();
  }
  async flush(s){
    const write=async()=>{
      if(s.shell?.pid){try{const cwd=await fs.readlink('/proc/'+s.shell.pid+'/cwd');if((cwd===this.cwd||cwd.startsWith(this.cwd+path.sep))&&cwd!==s.cwd){s.cwd=cwd;s.version++;}}catch{/* Exited processes retain their last verified directory. */}}
      if(s.savedVersion===s.version)return;
      if(!this.directory){s.savedVersion=s.version;return;}
      const target=this.filename(s.owner,s.id);
      const version=s.version;
      const snapshot={version:1,id:s.id,owner:s.owner,cwd:s.cwd,output:s.output,cursor:s.cursor,exitCode:s.exitCode,state:s.state};
      const iv=crypto.randomBytes(12),cipher=crypto.createCipheriv('aes-256-gcm',this.key,iv);
      cipher.setAAD(Buffer.from(s.owner+'\0'+s.id));
      const encrypted=Buffer.concat([cipher.update(JSON.stringify(snapshot)),cipher.final()]);
      const temporary=target+'.'+crypto.randomUUID();
      try{
        await fs.mkdir(this.directory,{recursive:true,mode:0o700});
        await fs.writeFile(temporary,JSON.stringify({iv:iv.toString('base64'),tag:cipher.getAuthTag().toString('base64'),data:encrypted.toString('base64')}),{mode:0o600,flag:'wx'});
        await fs.rename(temporary,target);
        s.savedVersion=version;s.checkpointFailed=false;
      }catch{throw new TerminalSessionError('terminal_checkpoint_failed');}
      finally{await fs.unlink(temporary).catch(()=>{});}
    };
    s.pending=(s.pending||Promise.resolve()).catch(()=>{}).then(write);return s.pending;
  }
  async get(owner,id){
    this.validate(owner,id);
    const current=this.sessions.get(id);
    if(current){if(current.owner!==owner)throw new TerminalSessionError('terminal_session_not_found',404);return current;}
    if(!this.directory)throw new TerminalSessionError('terminal_session_not_found',404);
    let saved;
    try{
      const file=this.filename(owner,id);const stat=await fs.stat(file);
      if(stat.size>4*1024*1024)throw Error('oversized');
      const envelope=JSON.parse(await fs.readFile(file,'utf8'));
      const decipher=crypto.createDecipheriv('aes-256-gcm',this.key,Buffer.from(envelope.iv,'base64'));
      decipher.setAAD(Buffer.from(owner+'\0'+id));decipher.setAuthTag(Buffer.from(envelope.tag,'base64'));
      saved=JSON.parse(Buffer.concat([decipher.update(Buffer.from(envelope.data,'base64')),decipher.final()]).toString('utf8'));
      if(saved.version!==1||saved.owner!==owner||saved.id!==id||!Array.isArray(saved.output)||!Number.isSafeInteger(saved.cursor)||saved.output.length>2000||typeof saved.cwd!=='string'||!(saved.cwd===this.cwd||saved.cwd.startsWith(this.cwd+path.sep)))throw Error('invalid_checkpoint');
      if(saved.cursor<0||!['starting','running','interrupted','exited','closed'].includes(saved.state)||!(saved.exitCode===null||Number.isInteger(saved.exitCode))||path.resolve(saved.cwd)!==saved.cwd)throw Error('invalid_checkpoint');
      let previous=0,totalBytes=0;
      for(const entry of saved.output){
        if(!Number.isSafeInteger(entry.seq)||entry.seq<=previous||entry.seq>saved.cursor||!['stdout','stderr','system'].includes(entry.stream)||typeof entry.data!=='string'||typeof entry.at!=='string')throw Error('invalid_checkpoint');
        previous=entry.seq;totalBytes+=Buffer.byteLength(entry.data);
      }
      if(totalBytes>this.maxOutputBytes)throw Error('invalid_checkpoint');
    }catch(error){if(error.code==='ENOENT')throw new TerminalSessionError('terminal_session_not_found',404);throw new TerminalSessionError('terminal_restore_failed');}
    // Another request may have restored or started this same terminal while the
    // encrypted read was in flight. Never replace its live process or checkpoint.
    if(this.sessions.has(id))return this.get(owner,id);
    const s={...saved,output:saved.output.map(entry=>({...entry})),shell:null,restored:true,version:1,savedVersion:0,bytes:saved.output.reduce((n,x)=>n+Buffer.byteLength(x.data),0)};
    if(['starting','running'].includes(s.state)){s.state='interrupted';s.exitCode=null;}
    this.pruneCache();this.sessions.set(id,s);await this.flush(s);return s;
  }
  async start(s){
    if(s.state==='closed')throw new TerminalSessionError('terminal_session_closed',409);
    if(s.startingPromise)return s.startingPromise;
    if(s.state==='running'&&s.shell)return s;
    if(this.activeCount()>=this.maxActive)throw new TerminalSessionError('terminal_capacity_reached',429);
    s.state='starting';s.exitCode=null;s.version++;
    s.startingPromise=(async()=>{
      await this.flush(s);
      const cwd=await fs.realpath(s.cwd).catch(()=>{throw new TerminalSessionError('terminal_directory_unavailable');});
      if(cwd!==this.cwd&&!cwd.startsWith(this.cwd+path.sep))throw new TerminalSessionError('terminal_directory_unavailable');
      // Stop/shutdown can run while persistence or directory resolution awaits.
      // Recheck immediately before spawning so a closed terminal stays closed.
      if(s.state!=='starting')throw new TerminalSessionError(s.state==='closed'?'terminal_session_closed':'terminal_resume_required',409);
      const shell=this.spawnShell('/bin/bash',['--noprofile','--norc'],{cwd,env:{...process.env,HOME:'/home/studio',TERM:'xterm-256color',BASH_ENV:bootstrap},stdio:['pipe','pipe','pipe','pipe']});
      s.shell=shell;s.state='running';s.version++;
      let directoryBytes='';
      shell.stdio?.[3]?.on('data',chunk=>{
        directoryBytes+=chunk.toString('utf8');
        if(directoryBytes.length>8192){directoryBytes='';return;}
        let end;
        while((end=directoryBytes.indexOf('\0'))>=0){
          const next=directoryBytes.slice(0,end);directoryBytes=directoryBytes.slice(end+1);
          if(path.resolve(next)===next&&(next===this.cwd||next.startsWith(this.cwd+path.sep))&&next!==s.cwd){s.cwd=next;s.version++;}
        }
      });
      shell.stdout.on('data',chunk=>this.record(s,'stdout',chunk.toString('utf8')));
      shell.stderr.on('data',chunk=>this.record(s,'stderr',chunk.toString('utf8')));
      shell.on('error',()=>{if(s.shell!==shell)return;s.shell=null;s.state='exited';s.exitCode=127;this.record(s,'system','[Terminal process could not start.]\n');});
      shell.on('close',code=>{if(s.shell!==shell)return;s.shell=null;if(!['closed','interrupted'].includes(s.state)){s.state='exited';s.exitCode=code??0;}this.record(s,'system',s.state==='interrupted'?'[Terminal process interrupted; commands were not replayed.]\n':`[Process exited ${s.exitCode??0}.]\n`);});
      await this.flush(s);return s;
    })().finally(()=>{s.startingPromise=null;});
    try{return await s.startingPromise;}catch(error){if(s.state!=='closed'){s.state='interrupted';s.version++;s.shell?.kill('SIGTERM');}throw error;}
  }
  async create(owner){
    if(!validOwner(owner))throw new TerminalSessionError('terminal_owner_required',400);
    const s={id:crypto.randomUUID(),owner,cwd:this.cwd,output:[],cursor:0,bytes:0,exitCode:null,state:'new',version:0,savedVersion:-1};
    this.pruneCache();this.sessions.set(s.id,s);
    try{await this.start(s);return {id:s.id,cwd:s.cwd,state:s.state,persistent:Boolean(this.directory)};}catch(error){if(!s.shell)this.sessions.delete(s.id);throw error;}
  }
  async output(owner,id,after=0){
    const s=await this.get(owner,id);await this.flush(s);
    return {id:s.id,output:s.output.filter(x=>x.seq>after),cursor:s.cursor,exitCode:s.exitCode,state:s.state,recovery:{persistent:Boolean(this.directory),restored:Boolean(s.restored),commandsReplayed:false,truncated:after<(s.output[0]?.seq??s.cursor+1)-1}};
  }
  async input(owner,id,data){const s=await this.get(owner,id);if(s.state!=='running'||!s.shell)throw new TerminalSessionError('terminal_resume_required',409);await this.flush(s);s.shell.stdin.write(String(data).slice(0,16000));return {ok:true};}
  async resume(owner,id){const s=await this.get(owner,id);if(s.state==='closed')throw new TerminalSessionError('terminal_session_closed',409);await this.start(s);return {id:s.id,cwd:s.cwd,state:s.state,persistent:Boolean(this.directory),commandsReplayed:false};}
  async stop(owner,id){const s=await this.get(owner,id);s.state='closed';s.exitCode=s.exitCode??0;s.version++;s.shell?.kill('SIGTERM');await this.flush(s);return {ok:true};}
  async shutdown(){
    for(const s of this.sessions.values()){clearTimeout(s.timer);s.timer=null;if(s.shell||s.state==='starting'){s.state='interrupted';s.exitCode=null;s.version++;s.shell?.kill('SIGTERM');}}
    await Promise.all([...this.sessions.values()].map(s=>this.flush(s)));
  }
}
