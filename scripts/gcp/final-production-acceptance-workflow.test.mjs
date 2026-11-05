import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {load} from 'js-yaml';

const workflow=load(readFileSync(new URL('../../.github/workflows/final-production-acceptance.yml',import.meta.url),'utf8'));

test('automatic acceptance uses an authorized dispatch without expanding Google trust',()=>{
 const {dispatch,acceptance}=workflow.jobs;
 assert.equal(dispatch.if,"github.event_name == 'push' && github.ref == 'refs/heads/main'");
 assert.deepEqual(dispatch.permissions,{actions:'write'});
 assert.equal(dispatch.steps.some(step=>step.uses?.startsWith('google-github-actions/auth')),false);
 assert.equal(dispatch.steps.at(-1).run,'gh workflow run final-production-acceptance.yml --ref main');
 assert.equal(acceptance.if,"github.event_name == 'workflow_dispatch' && github.ref == 'refs/heads/main'");
 assert.equal(acceptance.environment,'production');
 assert.equal(acceptance.steps.find(step=>step.uses?.startsWith('google-github-actions/auth')).with.workload_identity_provider,
  'projects/484736877039/locations/global/workloadIdentityPools/elevate-github/providers/github-main');
});

test('production acceptance cannot silently overlap paginated release and course scans',()=>{
 const source=readFileSync(new URL('./final-production-acceptance.mjs',import.meta.url),'utf8');
 assert.match(source,/PRODUCTION_FILTER_CONTROL_NOT_ALLOWED/);
 assert.doesNotMatch(source,/status=eq\.(?:published|released)&limit=/);
 assert.match(source,/get\('courses'.*status=eq\.published/);
 assert.match(source,/get\('ultimate_release_versions'.*status=eq\.released/);
});

test('production acceptance requires a live unexpired lease as well as a fresh heartbeat',()=>{
 const source=readFileSync(new URL('./final-production-acceptance.mjs',import.meta.url),'utf8');
 assert.match(source,/Date\.parse\(j\.lease_expires_at\)<=Date\.now\(\)/);
 assert.match(source,/Date\.now\(\)-Date\.parse\(j\.heartbeat_at\)>300000/);
});

test('production release pagination selects stable IDs',()=>{
 const source=readFileSync(new URL('./final-production-acceptance.mjs',import.meta.url),'utf8');
 assert.ok(source.includes("get('ultimate_release_versions','id,course_id,status'"));
});

test('incremental releases require recorded source and media receipt instead of fabricated full version',()=>{
 const src=readFileSync(new URL('./final-production-acceptance.mjs',import.meta.url),'utf8');
 assert.ok(src.includes('incrementalWithoutFullVersion'));
 assert.ok(src.includes('attachment?.publicationPending===false'));
 assert.ok(src.includes("media_attachment:content_json->mediaAttachment"));
 assert.ok(src.includes("lesson.video_status==='complete'"));
});
