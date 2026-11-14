import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../../apps/lms/app/lms/(app)/dashboard/page.tsx',import.meta.url),'utf8');
const start=source.indexOf('  const assignedHome = await resolveAssignedLearnerHome');
const end=source.indexOf('  const workspace = await loadLearnerWorkspace',start);
assert.ok(start>=0 && end>start,'redirects must precede learner workspace loading');
const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;
const redirects=new AsyncFunction('resolveAssignedLearnerHome','isApprenticeWorkspaceRole','PortalRouter','redirect','subjectProfile','db','subjectId',source.slice(start,end));
test('dashboard redirects apprentices to their assigned home before role fallback, regardless of formatting',async()=>{
 for(const [home,role,expected] of [
  ['/apprentice/cosmetology','student','/apprentice/cosmetology'],
  [null,'apprentice','/apprentice'],
  ['/lms/dashboard','apprentice',null],
  [null,'student',null],
 ]) {
  const seen=[];
  try {
   await redirects(async()=>home,value=>value==='apprentice',{get:()=>'/apprentice'},path=>{seen.push(path);throw Error('redirect');},{role},null,'fixture');
  } catch(error) {assert.equal(error.message,'redirect');}
  assert.deepEqual(seen,expected?[expected]:[]);
 }
});
