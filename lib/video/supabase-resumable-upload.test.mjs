import test from 'node:test';
import assert from 'node:assert/strict';
import {uploadSupabaseResumable} from './supabase-resumable-upload.mjs';
const endpoint='https://project.storage.supabase.co/storage/v1/upload/resumable';
const options={endpoint,headers:{Authorization:'Bearer fixture'},metadata:'fixture',delay:async()=>{}};
test('partial disconnect resumes exact bytes from server offset',async()=>{
 const buffer=Buffer.alloc(7*1024*1024); for(let i=0;i<buffer.length;i++)buffer[i]=i%251;
 let offset=0,first=true;const accepted=[];
 await uploadSupabaseResumable({...options,buffer,request:async(url,o)=>{
  assert.ok(o.signal);
  if(o.method==='POST')return new Response(null,{status:201,headers:{location:endpoint+'/id','upload-offset':'0'}});
  if(o.method==='HEAD')return new Response(null,{status:200,headers:{'upload-offset':String(offset)}});
  assert.equal(Number(o.headers['Upload-Offset']),offset);
  if(first){first=false;accepted.push(Buffer.from(o.body).subarray(0,12345));offset+=12345;throw new TypeError('connection lost');}
  accepted.push(Buffer.from(o.body));offset+=o.body.length;
  return new Response(null,{status:204,headers:{'upload-offset':String(offset)}});
 }});
 assert.equal(Buffer.concat(accepted).equals(buffer),true);
});
test('413 is permanent and not retried as a connection outage',async()=>{
 let calls=0;
 await assert.rejects(uploadSupabaseResumable({...options,buffer:Buffer.alloc(1),request:async()=>{calls++;return new Response('Maximum size exceeded',{status:413});}}),/413.*Maximum size exceeded/);
 assert.equal(calls,1);
});
test('transient session creation failure retries then uploads',async()=>{
 let calls=0;
 await uploadSupabaseResumable({...options,buffer:Buffer.alloc(3),request:async(url,o)=>{
  if(o.method==='POST'){calls++;if(calls===1)return new Response('unavailable',{status:503});return new Response(null,{status:201,headers:{location:endpoint+'/id'}});}
  return new Response(null,{status:204,headers:{'upload-offset':'3'}});
 }});
 assert.equal(calls,2);
});
test('cross-origin session location never receives credentials',async()=>{
 let calls=0;await assert.rejects(uploadSupabaseResumable({...options,buffer:Buffer.alloc(1),request:async()=>{calls++;return new Response(null,{status:201,headers:{location:'https://other.example/id'}});}}),/changed origin/);assert.equal(calls,1);
});
