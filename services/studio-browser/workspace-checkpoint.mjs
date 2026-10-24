import crypto from 'node:crypto';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import {Readable} from 'node:stream';
import {pipeline} from 'node:stream/promises';
import {StringDecoder} from 'node:string_decoder';
import {createGzip,createGunzip} from 'node:zlib';
const excluded=new Set(['node_modules','.next','.cache','.turbo','.pnpm-store','__pycache__']);
const fail=()=>{throw Error('WORKSPACE_CHECKPOINT_UNVERIFIED');};
const digest=value=>crypto.createHash('sha256').update(value).digest('hex');
function safeRelative(value){if(typeof value!=='string'||!value||value.length>4096||value.includes('\0')||value.includes('\\')||path.isAbsolute(value)||value.split('/').some(x=>!x||x==='.'||x==='..'))fail();return value;}
function linkTarget(name,target){if(typeof target!=='string'||target.includes('\0')||path.isAbsolute(target)||target.includes('\\'))fail();const resolved=path.posix.normalize(path.posix.join(path.posix.dirname(name),target));if(resolved==='..'||resolved.startsWith('../')||path.isAbsolute(resolved))fail();return target;}
export class WorkspaceCheckpoint {
 constructor({root,secret,objects,maxBytes=1024*1024*1024,maxEntries=50000}={}){
  this.root=path.resolve(root);this.key=secret?crypto.createHash('sha256').update(secret+'\0studio-workspace-files-v1').digest():null;this.objects=objects;this.maxBytes=maxBytes;this.maxEntries=maxEntries;this.initialized=false;this.generation='0';this.fingerprint=null;this.pending=null;
 }
 async scan(){
  const entries=[];let bytes=0;
  if((await fsp.lstat(this.root)).isSymbolicLink())fail();
  const walk=async directory=>{
   for(const item of (await fsp.readdir(path.join(this.root,directory),{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name))){
    if(excluded.has(item.name))continue;
    // Git transfer temporaries are not accepted objects or recoverable work.
    // A timed-out fetch can leave gigabytes here; preserve them locally without
    // letting an incomplete transfer invalidate every durable checkpoint.
    if(directory==='.git/objects/pack' && /^tmp_(?:pack|idx)_/.test(item.name))continue;
    const name=safeRelative(directory?directory+'/'+item.name:item.name),full=path.join(this.root,name),stat=await fsp.lstat(full);
    const entry={name,mode:stat.mode&0o777,mtimeMs:stat.mtimeMs,ctimeMs:stat.ctimeMs,size:stat.size};
    if(stat.isSymbolicLink()){
     const raw=await fsp.readlink(full),resolved=path.resolve(path.dirname(full),raw);
     if(resolved!==this.root&&!resolved.startsWith(this.root+path.sep))fail();
     entry.type='link';entry.target=linkTarget(name,path.relative(path.dirname(full),resolved)||'.');
    }else if(stat.isDirectory())entry.type='directory';
    else if(stat.isFile()){entry.type='file';bytes+=stat.size;if(bytes>this.maxBytes)fail();}
    else fail();
    entries.push(entry);if(entries.length>this.maxEntries)fail();
    if(entry.type==='directory')await walk(name);
   }
  };
  await walk('');return {entries,bytes,fingerprint:digest(JSON.stringify(entries))};
 }
 sign(payload){return crypto.createHmac('sha256',this.key).update('manifest\0'+JSON.stringify(payload)).digest('hex');}
 decodeManifest(buffer){
  if(buffer.length>65536)fail();
  const envelope=JSON.parse(buffer.toString('utf8')),p=envelope.payload;
  if(!p||p.version!==1||!/^snapshot-[a-f0-9-]{36}\.enc$/.test(p.archive)||!/^[a-f0-9]{64}$/.test(p.fingerprint)||!/^[a-f0-9]{64}$/.test(p.digest)||typeof envelope.mac!=='string')fail();
  const expected=Buffer.from(this.sign(p)),supplied=Buffer.from(envelope.mac);if(supplied.length!==expected.length||!crypto.timingSafeEqual(supplied,expected))fail();
  if(Buffer.from(p.iv,'base64').length!==12||Buffer.from(p.tag,'base64').length!==16)fail();return p;
 }
 async initialize(){
  if(this.initialized)return;
  if(!this.key||!this.objects)fail();
  await fsp.mkdir(this.root,{recursive:true,mode:0o700});
  const record=await this.objects.readManifest();
  if(record){
   if((await fsp.readdir(this.root)).length)throw Error('WORKSPACE_EXISTING_FILES_REQUIRE_RECONCILIATION');
   await this.restore(record);this.generation=String(record.generation);
  }
  this.fingerprint=(await this.scan()).fingerprint;this.initialized=true;
 }
 async checkpoint(){
  if(this.pending)return this.pending;
  this.pending=this.save().finally(()=>{this.pending=null;});return this.pending;
 }
 async save(){
  if(!this.initialized||this.blocked)fail();
  const snapshot=await this.scan();if(snapshot.fingerprint===this.fingerprint)return {changed:false,generation:this.generation};
  const current=await this.objects.readManifest();if(String(current?.generation||'0')!==this.generation)throw Error('WORKSPACE_CHECKPOINT_CONFLICT');
  const name='snapshot-'+crypto.randomUUID()+'.enc',iv=crypto.randomBytes(12),cipher=crypto.createCipheriv('aes-256-gcm',this.key,iv),hash=crypto.createHash('sha256');cipher.setAAD(Buffer.from('admin-repository-v1'));
  const root=this.root;
  async function* records(){
   const emit=value=>{const bytes=Buffer.from(JSON.stringify(value)+'\n');hash.update(bytes);return bytes;};
   for(const entry of snapshot.entries){
    yield emit(entry);
    if(entry.type==='file'){
     const full=path.join(root,entry.name),handle=await fsp.open(full,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW);
     try{
      const before=await handle.stat();if(!before.isFile()||before.size!==entry.size||before.mtimeMs!==entry.mtimeMs||before.ctimeMs!==entry.ctimeMs)fail();
      const fileHash=crypto.createHash('sha256');let total=0;
      for await(const chunk of handle.createReadStream({autoClose:false,highWaterMark:65536})){total+=chunk.length;fileHash.update(chunk);yield emit({type:'chunk',data:chunk.toString('base64')});}
      const after=await handle.stat();if(total!==entry.size||after.size!==before.size||after.mtimeMs!==before.mtimeMs||after.ctimeMs!==before.ctimeMs)fail();
      yield emit({type:'endfile',digest:fileHash.digest('hex')});
     }finally{await handle.close();}
    }
   }
   yield emit({type:'complete',entries:snapshot.entries.length,bytes:snapshot.bytes});
  }
  let uploaded=false,publicationAttempted=false;
  try{
   await pipeline(Readable.from(records()),createGzip({level:1}),cipher,this.objects.createArchiveWriteStream(name));uploaded=true;
   if((await this.scan()).fingerprint!==snapshot.fingerprint)throw Error('WORKSPACE_CHANGED_DURING_CHECKPOINT');
   const payload={version:1,archive:name,iv:iv.toString('base64'),tag:cipher.getAuthTag().toString('base64'),digest:hash.digest('hex'),fingerprint:snapshot.fingerprint,entries:snapshot.entries.length,bytes:snapshot.bytes,createdAt:new Date().toISOString()};
   const envelope=Buffer.from(JSON.stringify({payload,mac:this.sign(payload)}));let saved;
   publicationAttempted=true;
   try{saved=await this.objects.writeManifest(envelope,this.generation);}
   catch(error){
    // A network failure after a committed write is ambiguous. Resolve it by
    // exact readback; never delete an archive a committed manifest may reference.
    const readback=await this.objects.readManifest().catch(()=>null);
    if(readback?.data.equals(envelope))saved=readback;else throw error;
   }
   this.generation=String(saved.generation);this.fingerprint=snapshot.fingerprint;
   // Only unreferenced failed uploads are removed automatically. Retention of
   // accepted snapshots belongs to an explicit operator retention policy.
   return {changed:true,generation:this.generation,bytes:snapshot.bytes,entries:snapshot.entries.length};
  }catch(error){if(publicationAttempted)this.blocked=true;else if(uploaded)await this.objects.removeArchive(name).catch(()=>{});throw error;}
 }
 async restore(record){
  const manifest=this.decodeManifest(record.data);
  const staging=await fsp.mkdtemp(path.join(path.dirname(this.root),'.studio-restore-'));let active=null,complete=false,total=0,count=0;
  const links=[],directories=[],seen=new Set(),hash=crypto.createHash('sha256');
  const decipher=crypto.createDecipheriv('aes-256-gcm',this.key,Buffer.from(manifest.iv,'base64'));decipher.setAAD(Buffer.from('admin-repository-v1'));decipher.setAuthTag(Buffer.from(manifest.tag,'base64'));
  const source=this.objects.createArchiveReadStream(manifest.archive),gunzip=createGunzip();
  // pipeline forwards authentication, decompression and storage errors to the
  // parser, and no recovered tree is published until every layer verifies.
  const pumping=pipeline(source,decipher,gunzip);pumping.catch(()=>{});
  let buffer='';const decoder=new StringDecoder('utf8');
  try{
   const accept=async row=>{
    if(complete)fail();
    if(row.type==='chunk'){
     if(!active||typeof row.data!=='string'||row.data.length>90000||!/^[A-Za-z0-9+/]*={0,2}$/.test(row.data))fail();
     const data=Buffer.from(row.data,'base64');active.bytes+=data.length;total+=data.length;if(active.bytes>active.entry.size||total>this.maxBytes)fail();active.hash.update(data);await active.handle.writeFile(data);return;
    }
    if(row.type==='endfile'){
     if(!active||active.bytes!==active.entry.size||active.hash.digest('hex')!==row.digest)fail();
     await active.handle.sync();await active.handle.close();await fsp.chmod(active.full,active.entry.mode);await fsp.utimes(active.full,new Date(active.entry.mtimeMs),new Date(active.entry.mtimeMs));active=null;return;
    }
    if(active)fail();
    if(row.type==='complete'){if(row.entries!==count||row.bytes!==total||manifest.entries!==count||manifest.bytes!==total)fail();complete=true;return;}
    safeRelative(row.name);if(seen.has(row.name)||!Number.isInteger(row.mode)||row.mode<0||row.mode>0o777||!Number.isFinite(row.mtimeMs)||++count>this.maxEntries)fail();seen.add(row.name);
    const full=path.join(staging,row.name);await fsp.mkdir(path.dirname(full),{recursive:true,mode:0o700});
    if(row.type==='directory'){await fsp.mkdir(full,{recursive:true,mode:0o700});directories.push({full,...row});}
    else if(row.type==='link')links.push({full,...row,target:linkTarget(row.name,row.target)});
    else if(row.type==='file'){
     if(!Number.isSafeInteger(row.size)||row.size<0||row.size>this.maxBytes)fail();
     active={full,entry:row,bytes:0,hash:crypto.createHash('sha256'),handle:await fsp.open(full,'wx',0o600)};
    }else fail();
   };
   for await(const chunk of gunzip){hash.update(chunk);buffer+=decoder.write(chunk);let end;
    while((end=buffer.indexOf('\n'))>=0){const line=buffer.slice(0,end);buffer=buffer.slice(end+1);if(line.length>100000)fail();await accept(JSON.parse(line));}
    if(buffer.length>100000)fail();
   }
   await pumping;buffer+=decoder.end();if(buffer||active||!complete||hash.digest('hex')!==manifest.digest)fail();
   const linkNames=new Set(links.map(link=>link.name));
   for(const name of seen){const pieces=name.split('/');for(let i=1;i<pieces.length;i++)if(linkNames.has(pieces.slice(0,i).join('/')))fail();}
   for(const link of links)await fsp.symlink(link.target,link.full);
   for(const dir of directories.reverse()){await fsp.chmod(dir.full,dir.mode);await fsp.utimes(dir.full,new Date(dir.mtimeMs),new Date(dir.mtimeMs));}
   // Existing user files are never replaced by restoration. rename also refuses
   // a target that became nonempty after the initial check.
   if((await fsp.readdir(this.root)).length)fail();await fsp.rename(staging,this.root);
  }finally{source.destroy();decipher.destroy();gunzip.destroy();await pumping.catch(()=>{});await active?.handle.close().catch(()=>{});await fsp.rm(staging,{recursive:true,force:true}).catch(()=>{});}
 }
}
