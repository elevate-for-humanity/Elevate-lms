import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {coursePhotoPicker,rememberCoursePhoto} from './course-photo-library.mjs';
const bytes=Buffer.from('real-course-image'),sha256=createHash('sha256').update(bytes).digest('hex');
const photo={sha256,storagePath:'approved-teaching-photos/'+sha256+'.jpg',provider:'google'};
function bucket(){const files=new Map([[photo.storagePath,bytes]]);return {files,
 async upload(path,data){files.set(path,data);return {};},
 async download(path){return files.has(path)?{data:new Blob([files.get(path)])}:{error:{status:404}};},
 async list(prefix,{offset,limit}){return {data:[...files.keys()].filter(k=>k.startsWith(prefix+'/')).map(k=>({name:k.slice(prefix.length+1)})).slice(offset,offset+limit)};},
 async createSignedUrl(path){return {data:{signedUrl:'https://media.example/'+path}};}};}
const input={courseId:'bookkeeping',courseTitle:'Bookkeeping',artifacts:{}};
test('uses a saved related course photo without exact narration equality',async()=>{
 const b=bucket();await rememberCoursePhoto(input,b,photo,'Bookkeeping workspace with calculator');
 const pick=await coursePhotoPicker(input,b),p=await pick({},0,{narrationQuote:'Post an accrued expense'});
 assert.equal(p.sha256,sha256);assert.equal(p.selectionMethod,'course-context');assert.equal(p.narrationQuote,'Post an accrued expense');
});
test('pictures from a different course cannot leak into this course gallery',async()=>{
 const b=bucket();await rememberCoursePhoto({...input,courseId:'barber'},b,photo,'Barber tools');
 const pick=await coursePhotoPicker(input,b);assert.equal(await pick({},0,{narrationQuote:'Ledger'}),null);
});
test('actual file corruption is still rejected',async()=>{
 const b=bucket();await rememberCoursePhoto(input,b,photo);b.files.set(photo.storagePath,Buffer.from('changed'));
 const pick=await coursePhotoPicker(input,b);await assert.rejects(pick({},0,{narrationQuote:'Ledger'}),/HASH_MISMATCH/);
});
test('related photos may be reused across scenes without new paid generation',async()=>{
 const b=bucket();await rememberCoursePhoto(input,b,photo);
 const pick=await coursePhotoPicker(input,b);
 assert.equal((await pick({id:'one'},0,{narrationQuote:'Assets'})).sha256,(await pick({id:'two'},0,{narrationQuote:'Equity'})).sha256);
});
