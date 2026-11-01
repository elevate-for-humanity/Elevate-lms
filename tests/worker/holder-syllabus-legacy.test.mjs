import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
import {test} from 'node:test';
import assert from 'node:assert/strict';
const source=readFileSync(new URL('../../apps/lms/app/api/program-holder/syllabus/route.ts',import.meta.url),'utf8');
function handler(ctx, builds, extract=async()=> 'Authorized syllabus source. '.repeat(10)) {
  const code=stripTypeScriptTypes(source.replace(/^import .*;\r?\n/gm,''),{mode:'transform'})
    .replaceAll('export async function','async function').replaceAll('export const','const');
  return new Function('NextResponse','requireProgramHolder','applyRateLimit','startHolderSyllabus','extractHolderSyllabus',code+';return POST;')(
    {json:(body,options={})=>Response.json(body,options)},async()=>ctx,async()=>null,
    async(_db,input)=>{builds.push(input);return Response.json({ok:true},{status:202});},extract);
}
function fakeDb(responses) {
  const calls=[];
  return {calls,storage:{from(bucket){return {download:async path=>({data:new Blob(['stored syllabus'],{type:'application/pdf'})})};}},
    from(table){const call={table,operations:[]};calls.push(call);const result=responses.shift();
      const query=new Proxy({},{get(_,key){if(key==='then')return(resolve,reject)=>Promise.resolve(result).then(resolve,reject);
        return(...args)=>{call.operations.push([key,...args]);return query;};}});return query;}};
}
const request=body=>new Request('https://app.elevateforhumanity.org/api/program-holder/syllabus',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
const doc={id:'doc-a',file_name:'Existing syllabus.pdf',file_url:'private/source.pdf',document_type:'training_plan',status:'pending',description:'Historical upload'};
test('admin previews cannot submit as a Program Holder',async()=>{
 const builds=[];const response=await handler({mode:'admin'},builds)(request({documentId:'doc-a'}));
 assert.equal(response.status,403);assert.equal(builds.length,0);
});
test('historical syllabus requires a currently assigned program',async()=>{
 const db=fakeDb([{data:doc}]),builds=[];
 const response=await handler({mode:'holder',db,user:{id:'owner'},holderId:'holder',programIds:['program-a']},builds)(
 request({documentId:'doc-a',programId:'other-program'}));
 assert.equal(response.status,400);assert.equal(builds.length,0);assert.equal(db.calls.length,1);
 assert.ok(db.calls[0].operations.some(op=>op[0]==='eq'&&op[1]==='user_id'&&op[2]==='owner'));
});
test('rejected syllabi cannot start generation',async()=>{
 const db=fakeDb([{data:{...doc,status:'rejected'}}]),builds=[];
 const response=await handler({mode:'holder',db,user:{id:'owner'},holderId:'holder',programIds:['program-a']},builds)(request({documentId:'doc-a'}));
 assert.equal(response.status,409);assert.equal(builds.length,0);
});
test('saved legacy syllabus is read, associated and built without changing review approval',async()=>{
 const db=fakeDb([{data:doc},{data:{id:'doc-a'}}]),builds=[];
 const response=await handler({mode:'holder',db,user:{id:'owner'},holderId:'holder',programIds:['program-a']},builds)(request({documentId:'doc-a'}));
 assert.equal(response.status,202);assert.equal(builds.length,1);assert.equal(builds[0].documentId,'doc-a');
 assert.equal(builds[0].programId,'program-a');assert.equal(builds[0].storagePath,'private/source.pdf');
 const update=db.calls[1].operations.find(op=>op[0]==='update')[1];
 assert.ok(update.ocr_text.length>=100);assert.equal(JSON.parse(update.description).program_holder_id,'holder');
 assert.equal('approved' in update,false);assert.equal('status' in update,false);
});
