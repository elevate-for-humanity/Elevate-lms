import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import vm from 'node:vm';

const workflow=readFileSync(new URL('../../.github/workflows/recover-obsolete-cpu-execution.yml',import.meta.url),'utf8');
const body=workflow.match(/node --input-type=module <<'NODE'\n([\s\S]*?)\n          NODE/)?.[1]?.replace(/^          /gm,'');
test('the actual inline recovery program parses without running Google commands',()=>{
 assert.ok(body,'Recovery JavaScript must be present');
 const result=spawnSync(process.execPath,['--check','--input-type=module'],{input:body,encoding:'utf8'});
 assert.equal(result.status,0,result.stderr);
});
test('recovery still accepts only the approved repository with an immutable digest',()=>{
 const expression=body.match(/if\(!([^\n]+)\.test\(templateImage/)?.[1];
 assert.ok(expression);
 const pattern=vm.runInNewContext(expression);
 const image='us-central1-docker.pkg.dev/elegant-racer-299721/elevate/ultimate-worker';
 assert.equal(pattern.test(image+'@sha256:'+'a'.repeat(64)),true);
 for(const value of [image+':latest',image+'@sha256:abc',image.replace('elegant-racer-299721','other-project')+'@sha256:'+'a'.repeat(64)])assert.equal(pattern.test(value),false);
});
