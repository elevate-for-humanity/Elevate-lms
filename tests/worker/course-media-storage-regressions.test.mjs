import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {uploadSupabaseResumableFile} from '../../lib/video/supabase-resumable-upload.mjs';
test('disk upload resumes partial acceptance and limits reads to six MiB',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'course-upload-test-'));
 try {
  const input=Buffer.alloc(7*1024*1024,73),filePath=join(dir,'film.mp4');await writeFile(filePath,input);
  let offset=0,patches=0;const output=[];
  await uploadSupabaseResumableFile({filePath,endpoint:'https://storage.example/upload',headers:{},metadata:'',delay:async()=>{},request:async(url,options)=>{
   if(options.method==='POST')return new Response(null,{status:201,headers:{location:'/upload/one','upload-offset':'0'}});
   if(options.method==='HEAD')return new Response(null,{headers:{'upload-offset':String(offset)}});
   assert.ok(options.body.length<=6*1024*1024);
   assert.equal(Number(options.headers['Upload-Offset']),offset);
   patches++;
   if(patches===1){const part=options.body.subarray(0,1024);output.push(Buffer.from(part));offset+=part.length;throw Error('Connection interrupted');}
   output.push(Buffer.from(options.body));offset+=options.body.length;
   return new Response(null,{status:204,headers:{'upload-offset':String(offset)}});
  }});
  assert.deepEqual(Buffer.concat(output),input);assert.ok(patches>=3);
 }finally{await rm(dir,{recursive:true,force:true});}
});
test('disk upload rejects cross-origin locations before sending file content',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'course-upload-test-'));
 try{const filePath=join(dir,'film');await writeFile(filePath,'bytes');
 await assert.rejects(uploadSupabaseResumableFile({filePath,endpoint:'https://storage.example/upload',headers:{},metadata:'',request:async()=>new Response(null,{status:201,headers:{location:'https://other.example/upload'}})}),/changed origin/);
 }finally{await rm(dir,{recursive:true,force:true});}
});
