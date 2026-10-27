import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
const source=stripTypeScriptTypes(readFileSync(new URL('../../lib/ultimate-course-builder/core/production-handlers.ts',import.meta.url),'utf8'),{mode:'transform'}).replace(/^import[\s\S]*?from ['"][^'"]+['"];?\n/gm,'').replace('export function','function');
function handlers(verify,load){return new Function('verifyRegisteredProfile',source+'\nreturn createProductionHandlers;')(verify)({credential:{load},workforce:{load:async()=>({})}});}
test('course UUID containing a RAPIDS-like substring remains course-defined',async()=>{
 const h=handlers(()=>assert.fail('course UUID must not use registered contract'),()=>assert.fail('course-defined profile must not load a credential'));
 const result=await h.standards_lock({profile:{id:'course:a6b0b712-1cf0-475a-ba79-ee2023dea8ec',authority:'course-defined',competencies:[]}});
 assert.equal(result.artifacts.requirements.mode,'course-defined');
});
test('registered barber still validates its registered-program contract',async()=>{
 let verified=false;
 const h=handlers(()=>{verified=true;return {verified:true};},async()=>({}));
 const result=await h.standards_lock({profile:{id:'registered:barber:0030CB',competencies:[]}});
 assert.equal(result.artifacts.requirements.mode,'registered-standard');
 assert.equal(verified,true);
});
