import crypto from 'node:crypto';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import {pipeline} from 'node:stream/promises';
import {Readable} from 'node:stream';
const ownerValid=value=>typeof value==='string'&&/^[a-zA-Z0-9_-]{1,128}$/.test(value);
const idValid=value=>typeof value==='string'&&/^[a-f0-9-]{36}$/.test(value);
export class BrowserFileStore {
 constructor({secret,directory}={}){this.directory=directory;this.key=secret?crypto.createHash('sha256').update(secret+'\0studio-browser-files-v1').digest():null;this.saved=new Map();}
 file(owner,id){if(!ownerValid(owner)||!idValid(id)||!this.directory||!this.key)throw Error('BROWSER_FILE_BOUNDARY_INVALID');return path.join(this.directory,crypto.createHash('sha256').update(owner).digest('hex'),id+'.enc');}
 async save(owner,item){
  const target=this.file(owner,item.id),stat=await fsp.stat(item.filePath);
  if(!stat.isFile()||stat.size>2*1024*1024*1024)throw Error('BROWSER_FILE_LIMIT_EXCEEDED');
  const fingerprint=[item.filePath,stat.size,stat.mtimeMs,stat.ctimeMs].join(':');
  if(this.saved.get(target)!==fingerprint){
   await fsp.mkdir(path.dirname(target),{recursive:true,mode:0o700});const temporary=target+'.'+crypto.randomUUID();
   const iv=crypto.randomBytes(12),cipher=crypto.createCipheriv('aes-256-gcm',this.key,iv);cipher.setAAD(Buffer.from(owner+'\0'+item.id));
   try{
    const encrypted=Readable.from((async function*(){yield iv;const input=fs.createReadStream(item.filePath);input.on('error',error=>cipher.destroy(error));input.pipe(cipher);try{for await(const chunk of cipher)yield chunk;yield cipher.getAuthTag();}finally{input.destroy();cipher.destroy();}})());
    await pipeline(encrypted,fs.createWriteStream(temporary,{flags:'wx',mode:0o600}));
    const after=await fsp.stat(item.filePath);if([after.size,after.mtimeMs,after.ctimeMs].join(':')!==[stat.size,stat.mtimeMs,stat.ctimeMs].join(':'))throw Error('BROWSER_FILE_CHANGED_DURING_SAVE');
    await fsp.rename(temporary,target);this.saved.set(target,fingerprint);
   }finally{await fsp.rm(temporary,{force:true});}
  }
  return {id:item.id,fileName:path.basename(item.fileName),size:stat.size,contentType:item.contentType||'application/octet-stream',createdAt:item.createdAt};
 }
 async restore(owner,items,directory){
  if(!Array.isArray(items)||items.length>200)throw Error('BROWSER_FILE_MANIFEST_INVALID');
  const restored=new Map();await fsp.mkdir(directory,{recursive:true,mode:0o700});
  try{for(const item of items){
   if(!idValid(item.id)||typeof item.fileName!=='string'||!item.fileName||item.fileName.length>255||path.basename(item.fileName)!==item.fileName||['.','..'].includes(item.fileName)||!Number.isSafeInteger(item.size)||item.size<0||item.size>2*1024*1024*1024||restored.has(item.id))throw Error('BROWSER_FILE_MANIFEST_INVALID');
   const source=this.file(owner,item.id),stat=await fsp.stat(source);if(stat.size!==item.size+28)throw Error('BROWSER_FILE_ARCHIVE_INVALID');
   const handle=await fsp.open(source,'r'),iv=Buffer.alloc(12),tag=Buffer.alloc(16);
   try{await handle.read(iv,0,12,0);await handle.read(tag,0,16,stat.size-16);}finally{await handle.close();}
   const decipher=crypto.createDecipheriv('aes-256-gcm',this.key,iv);decipher.setAAD(Buffer.from(owner+'\0'+item.id));decipher.setAuthTag(tag);
   const target=path.join(directory,item.id+'-'+item.fileName),temporary=target+'.'+crypto.randomUUID();
   try{if(item.size===0){decipher.final();await fsp.writeFile(temporary,'',{flag:'wx',mode:0o600});}else await pipeline(fs.createReadStream(source,{start:12,end:stat.size-17}),decipher,fs.createWriteStream(temporary,{flags:'wx',mode:0o600}));await fsp.rename(temporary,target);}
   finally{await fsp.rm(temporary,{force:true});}
   restored.set(item.id,{...item,filePath:target,status:'ready',uploadProgress:0});
  }return restored;}catch(cause){for(const item of restored.values())await fsp.rm(item.filePath,{force:true});throw Error('BROWSER_FILE_RESTORE_FAILED',{cause});}
 }
}
