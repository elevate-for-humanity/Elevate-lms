import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const code=readFileSync(new URL('../../lib/ai/runtime/code-repair.ts',import.meta.url),'utf8');
test('newer main requires completed exact-SHA deployment workflow evidence',()=>{
 assert.match(code,/candidatePassed=ancestry&&independentlyValidated&&repairDeploymentState\(candidateChecks,currentSha,deployments\)==='passed'/);
 assert.match(code,/run.name==='CI'/);
 assert.match(code,/run.name==='Integrity Gate'/);
 assert.match(code,/state:candidatePassed\?'validated-newer-target'/);
});
test('verification uses selected target but original immutable release receipt remains',()=>{
 assert.match(code,/const targetSha=repair.verification\?\.releaseReconciliation/);
 assert.match(code,/releaseSha:targetSha/);
 assert.match(code,/immutableReleaseSha:repair.release_sha/);
 assert.match(code,/if\(!runtimeEvidence.passed\)/);
});
