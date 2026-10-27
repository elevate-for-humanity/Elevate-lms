import crypto from 'node:crypto';
import {Storage} from '@google-cloud/storage';
const archiveName=name=>{if(!/^snapshot-[a-f0-9-]{36}\.enc$/.test(name))throw Error('WORKSPACE_ARCHIVE_NAME_INVALID');return name;};
export class GcsWorkspaceObjects {
 constructor({bucket='elegant-racer-299721-studio-browser-auth',prefix='workspaces/admin-repository-v1',storage=new Storage()}={}){
  if(bucket!=='elegant-racer-299721-studio-browser-auth'||!/^workspaces\/(?:admin-repository-v1|acceptance-[a-f0-9-]{36})$/.test(prefix))throw Error('WORKSPACE_STORAGE_BOUNDARY_INVALID');
  this.bucket=storage.bucket(bucket);this.prefix=prefix;
 }
 file(name){return this.bucket.file(this.prefix+'/'+name);}
 async readManifest(){
  for(let attempt=0;attempt<3;attempt++){
   let metadata;try{[metadata]=await this.file('manifest.json').getMetadata();}catch(error){if(error.code===404)return null;throw error;}
   if(!/^\d+$/.test(String(metadata.generation))||Number(metadata.size)>65536)throw Error('WORKSPACE_MANIFEST_METADATA_INVALID');
   try{const [data]=await this.bucket.file(this.prefix+'/manifest.json',{generation:metadata.generation}).download({validation:'crc32c'});if(data.length>65536)throw Error('WORKSPACE_MANIFEST_TOO_LARGE');return {data,generation:String(metadata.generation)};}
   catch(error){if(error.code!==404)throw error;}
  }
  throw Error('WORKSPACE_MANIFEST_CHANGED_DURING_READ');
 }
 async writeManifest(data,expected){
  if(!/^\d+$/.test(String(expected))||data.length>65536)throw Error('WORKSPACE_MANIFEST_INVALID');
  const file=this.file('manifest.json');await file.save(data,{resumable:false,validation:'crc32c',metadata:{contentType:'application/json',cacheControl:'no-store'},preconditionOpts:{ifGenerationMatch:String(expected)}});
  const generation=String(file.metadata?.generation||'');if(!/^\d+$/.test(generation))throw Error('WORKSPACE_MANIFEST_RECEIPT_UNVERIFIED');return {generation};
 }
 createArchiveWriteStream(name){return this.file(archiveName(name)).createWriteStream({resumable:true,chunkSize:8*1024*1024,validation:'crc32c',metadata:{contentType:'application/octet-stream',cacheControl:'no-store'},preconditionOpts:{ifGenerationMatch:0}});}
 createArchiveReadStream(name){return this.file(archiveName(name)).createReadStream({validation:'crc32c'});}
 async removeArchive(name){await this.file(archiveName(name)).delete({ignoreNotFound:true});}
 async checkReadiness(){
  const file=this.file('probe-'+crypto.randomUUID());
  try{await file.save('studio-workspace-storage-probe',{resumable:false,validation:'crc32c',preconditionOpts:{ifGenerationMatch:0}});await file.delete();return {ready:true,persistent:true,generationProtected:true};}
  catch{return {ready:false,persistent:true,generationProtected:true,error:'workspace_storage_unavailable'};}
 }
}
