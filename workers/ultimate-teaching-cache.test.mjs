import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {stripTypeScriptTypes} from 'node:module';
const uri=value=>`data:text/javascript;base64,${Buffer.from(value).toString('base64')}`;
const types=uri(stripTypeScriptTypes(await readFile(new URL('../lib/ultimate-course-builder/core/types.ts',import.meta.url),'utf8')));
const source=stripTypeScriptTypes(await readFile(new URL('../lib/ultimate-course-builder/core/lesson-contract.ts',import.meta.url),'utf8')).replace("'./types'",JSON.stringify(types));
const {stepInputHash,contractHash,artifactPayload,currentEvidence,ULTIMATE_LESSON_CONTRACT_VERSION}=await import(uri(source));
const profile={id:'course',competencies:[{id:'lesson'}]};
const prior={standards_lock:{requirements:{version:'registered-standard'}}};
const legacyHash=(step,dependencies)=>contractHash({version:ULTIMATE_LESSON_CONTRACT_VERSION,profile,step,dependencies});
test('unchanged standards remain reusable',()=>{
 assert.equal(stepInputHash('standards_lock',profile,{}),legacyHash('standards_lock',[]));
});
test('legacy teaching hash is invalidated without changing the release contract version',()=>{
 const old=legacyHash('learning_objectives',[['standards_lock',contractHash(artifactPayload(prior.standards_lock))]]);
 const current=stepInputHash('learning_objectives',profile,prior);
 assert.notEqual(current,old);
 const artifact={objectives:[{id:'objective'}]};
 artifact.contractEvidence={version:ULTIMATE_LESSON_CONTRACT_VERSION,inputHash:old,outputHash:contractHash(artifact),passed:true};
 assert.equal(currentEvidence(artifact,current),false);
 artifact.contractEvidence.inputHash=current;
 assert.equal(currentEvidence(artifact,current),true);
});
test('dependent stages invalidate when corrected teaching changes',()=>{
 const first={...prior,learning_objectives:{blueprint:{segments:[{text:'old clipped excerpt'}]}}};
 const corrected={...prior,learning_objectives:{blueprint:{segments:[{text:'complete authored procedure'}]}}};
 assert.notEqual(stepInputHash('instructor_script',profile,first),stepInputHash('instructor_script',profile,corrected));
});
