import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {stripTypeScriptTypes} from 'node:module';
const uri=value=>`data:text/javascript;base64,${Buffer.from(value).toString('base64')}`;
const types=uri(stripTypeScriptTypes(await readFile(new URL('../lib/ultimate-course-builder/core/types.ts',import.meta.url),'utf8')));
const {ULTIMATE_BUILD_STEPS}=await import(types);
const source=stripTypeScriptTypes(await readFile(new URL('../lib/ultimate-course-builder/core/lesson-contract.ts',import.meta.url),'utf8'))
 .replace("'./types'",JSON.stringify(types))
 .replace("'../../video/render-checkpoint-contract.mjs'",JSON.stringify(new URL('../lib/video/render-checkpoint-contract.mjs',import.meta.url).href))
 .replace("'../instructional/approved-delivery.mjs'",JSON.stringify(new URL('../lib/ultimate-course-builder/instructional/approved-delivery.mjs',import.meta.url).href))
 .replace("'../media/playback-source.mjs'",JSON.stringify(new URL('../lib/ultimate-course-builder/media/playback-source.mjs',import.meta.url).href))
 .replace("'../../storage/course-video-policy.mjs'",JSON.stringify(new URL('../lib/storage/course-video-policy.mjs',import.meta.url).href));
const {stepInputHash,stepInputHashes,contractHash,artifactPayload,currentEvidence,ULTIMATE_LESSON_CONTRACT_VERSION}=await import(uri(source));
const profile={id:'course',competencies:[{id:'lesson'}]};
const prior={standards_lock:{requirements:{version:'registered-standard'}}};
const legacyHash=(step,dependencies)=>contractHash({version:ULTIMATE_LESSON_CONTRACT_VERSION,profile,step,dependencies});
test('resuming a paused build preserves exact instructional checkpoints',()=>{
 const paused={...profile,ownerPaused:true};
 const artifact={requirements:{version:'registered-standard'}};
 artifact.contractEvidence={version:ULTIMATE_LESSON_CONTRACT_VERSION,inputHash:stepInputHash('standards_lock',paused,{}),outputHash:contractHash(artifact),passed:true};
 const resumed={...profile,ownerPaused:false,pauseResumeAudit:{resumedBy:'authenticated-admin'}};
 assert.equal(currentEvidence(artifact,stepInputHashes('standards_lock',resumed,{})),true);
 assert.equal(currentEvidence(artifact,stepInputHashes('standards_lock',{...resumed,title:'Changed instruction'},{})),false);
 const tampered={...artifact,requirements:{version:'tampered'}};
 assert.equal(currentEvidence(tampered,stepInputHashes('standards_lock',resumed,{})),false);
});
test('unchanged standards remain reusable',()=>{
 assert.equal(stepInputHash('standards_lock',profile,{}),legacyHash('standards_lock',[]));
});
test('enabling parallel scheduling preserves every instructional checkpoint hash',()=>{
 for(const step of ULTIMATE_BUILD_STEPS)
  assert.equal(stepInputHash(step,{...profile,parallelAutopilot:'three-role-v1'},prior),stepInputHash(step,profile,prior));
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
test('prior visual assignments are rebuilt after stored-file identity is corrected',()=>{
 const dependencies=ULTIMATE_BUILD_STEPS.slice(0,ULTIMATE_BUILD_STEPS.indexOf('visual_assignment')).map(step=>[step,contractHash({})]);
 const old=legacyHash('visual_assignment',dependencies);
 assert.notEqual(stepInputHash('visual_assignment',profile,{}),old);
});
