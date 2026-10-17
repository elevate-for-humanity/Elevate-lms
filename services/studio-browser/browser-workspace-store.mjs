import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import {ProviderSessionStore} from './provider-session-store.mjs';
const validOwner=owner=>typeof owner==='string'&&/^[a-zA-Z0-9_-]{1,128}$/.test(owner);
const elevate=host=>host==='elevateforhumanity.org'||host.endsWith('.elevateforhumanity.org');
const forwardedToken=name=>/^sb-.+-auth-token(?:\.\d+)?$/.test(name);
// Reopening one-time authorization, logout, payment or mutation URLs can repeat
// side effects. Retain their tab slot without replaying that navigation.
export function restorableTabUrl(value){
 if(value==='about:blank')return value;
 const url=new URL(value);
 if(!['http:','https:'].includes(url.protocol)||url.username||url.password)return 'about:blank';
 if(/(?:^|\/)(?:callback|oauth|logout|signout|sign-out|checkout|payments?|webhooks?)(?:\/|$)/i.test(url.pathname)||[...url.searchParams.keys()].some(key=>/^(?:code|state|token|access_token|id_token|oauth_token|verification_token|ticket)$/i.test(key)))return 'about:blank';
 return url.href;
}
function validate(checkpoint,owner){
 if(checkpoint?.version!==1||checkpoint.owner!==owner||!Array.isArray(checkpoint.tabs)||checkpoint.tabs.length>20||!checkpoint.tabs.length||!Number.isInteger(checkpoint.activeTabIndex)||checkpoint.activeTabIndex<0||checkpoint.activeTabIndex>=checkpoint.tabs.length)throw Error('BROWSER_CHECKPOINT_INVALID');
 if(!Number.isInteger(checkpoint.viewport?.width)||!Number.isInteger(checkpoint.viewport?.height)||checkpoint.viewport.width<320||checkpoint.viewport.width>1920||checkpoint.viewport.height<480||checkpoint.viewport.height>1080)throw Error('BROWSER_CHECKPOINT_INVALID');
 for(const url of checkpoint.tabs)if(typeof url!=='string'||url.length>16384||restorableTabUrl(url)!==url)throw Error('BROWSER_CHECKPOINT_INVALID');
 if(!Array.isArray(checkpoint.storageState?.cookies)||!Array.isArray(checkpoint.storageState?.origins)||checkpoint.storageState.cookies.length>10000||checkpoint.storageState.origins.length>200)throw Error('BROWSER_CHECKPOINT_INVALID');
 for(const origin of checkpoint.storageState.origins){const url=new URL(origin.origin);if(!['http:','https:'].includes(url.protocol)||url.origin!==origin.origin||!Array.isArray(origin.localStorage))throw Error('BROWSER_CHECKPOINT_INVALID');}
 return checkpoint;
}
export class BrowserWorkspaceStore extends ProviderSessionStore {
 constructor({secret,directory}={}){super({secret:secret?secret+'\0studio-browser-workspace-v1':undefined,directory});this.writes=new Map();this.memory=new Map();}
 file(owner){if(!validOwner(owner)||!this.key||!this.directory)throw Error('BROWSER_CHECKPOINT_UNAVAILABLE');return path.join(this.directory,crypto.createHash('sha256').update(owner).digest('hex')+'.json');}
 async load(owner){
  if(!validOwner(owner))return null;
  if(!this.directory)return this.memory.get(owner)||null;
  try{
   const filename=this.file(owner);if((await fs.stat(filename)).size>24*1024*1024)throw Error('oversized');
   const envelope=JSON.parse(await fs.readFile(filename,'utf8'));
   const decipher=crypto.createDecipheriv('aes-256-gcm',this.key,Buffer.from(envelope.iv,'base64'));
   decipher.setAAD(Buffer.from(owner));decipher.setAuthTag(Buffer.from(envelope.tag,'base64'));
   return validate(JSON.parse(Buffer.concat([decipher.update(Buffer.from(envelope.data,'base64')),decipher.final()]).toString('utf8')),owner);
  }catch(error){if(error.code==='ENOENT')return null;throw Error('BROWSER_CHECKPOINT_RESTORE_FAILED');}
 }
 async save(session){
  const owner=session.ownerId;if(!validOwner(owner))return;
  const save=async()=>{
   const source=await session.context.storageState({indexedDB:true});
   const entries=[...(session.pages||new Map()).entries()];
   const checkpoint=validate({version:1,owner,viewport:session.viewport,tabs:entries.length?entries.map(([,page])=>restorableTabUrl(page.url())):['about:blank'],activeTabIndex:Math.max(0,entries.findIndex(([id])=>id===session.activeTabId)),storageState:{
    cookies:source.cookies.filter(cookie=>!(elevate(String(cookie.domain).replace(/^\./,''))&&forwardedToken(cookie.name))),
    origins:source.origins.map(origin=>elevate(new URL(origin.origin).hostname)?{...origin,localStorage:origin.localStorage.filter(item=>!forwardedToken(item.name)),indexedDB:[]}:origin),
   }},owner);
   const plaintext=JSON.stringify(checkpoint);if(Buffer.byteLength(plaintext)>16*1024*1024)throw Error('BROWSER_CHECKPOINT_TOO_LARGE');
   if(!this.directory){this.memory.set(owner,checkpoint);return;}
   const target=this.file(owner),temporary=target+'.'+crypto.randomUUID();
   const iv=crypto.randomBytes(12),cipher=crypto.createCipheriv('aes-256-gcm',this.key,iv);cipher.setAAD(Buffer.from(owner));
   const data=Buffer.concat([cipher.update(plaintext),cipher.final()]);
   try{await fs.mkdir(this.directory,{recursive:true,mode:0o700});await fs.writeFile(temporary,JSON.stringify({iv:iv.toString('base64'),tag:cipher.getAuthTag().toString('base64'),data:data.toString('base64')}),{flag:'wx',mode:0o600});await fs.rename(temporary,target);}
   finally{await fs.unlink(temporary).catch(()=>{});}
  };
  const pending=(this.writes.get(owner)||Promise.resolve()).catch(()=>{}).then(save);this.writes.set(owner,pending);
  try{await pending;}finally{if(this.writes.get(owner)===pending)this.writes.delete(owner);}
 }
}
