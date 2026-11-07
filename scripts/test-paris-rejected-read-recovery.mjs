import test from 'node:test';
import {rankSourcePaths,rememberSourcePaths} from '../lib/devstudio/paris-source-discovery.mjs';
import {recoverRepeatedInspection} from '../lib/devstudio/paris-inspection-budget.mjs';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {stripTypeScriptTypes} from 'node:module';

const source=stripTypeScriptTypes(await readFile(new URL('../lib/devstudio/paris-code-engineer.ts',import.meta.url),'utf8'));
const start=source.indexOf('async function rejectedReadFeedback(');
assert.ok(start>=0);
const helper=source.slice(start,source.indexOf('async function writeFile(',start));
function fixture({protectedPath=false,results=[]}={}) {
 const calls=[];
 const feedback=new Function('blockedPath','listDirectory','rejectedSourceRead',helper+';return rejectedReadFeedback;')(
  ()=>protectedPath,
  async(path,branch)=>{calls.push({path,branch});const result=results.shift();if(result instanceof Error)throw result;return result??[];},
  error=>/not a directory|Repository path is not allowed|GitHub API 404 for \/contents/.test(error.message),
 );
 return {feedback,calls};
}
test('missing source read supplies actual parent entries on the same task branch',async()=>{
 const f=fixture({results:[[{path:'lib/ai/ai-service.ts',type:'file'}]]});
 const result=await f.feedback('lib/ai/chat','studio/task');
 assert.deepEqual(f.calls,[{path:'lib/ai',branch:'studio/task'}]);
 assert.match(result,/LIST lib\/ai:/);assert.match(result,/ai-service\.ts/);
});
test('protected paths do not disclose parent directory contents',async()=>{
 const f=fixture({protectedPath:true});
 assert.match(await f.feedback('lib/secrets.ts','studio/task'),/READ_REJECTED/);
 assert.deepEqual(f.calls,[]);
});
test('missing parents recover through bounded ancestor discovery',async()=>{
 const missing=()=>Error('GitHub API 404 for /contents/missing');
 const f=fixture({results:[missing(),[{path:'lib/ai',type:'dir'}]]});
 assert.match(await f.feedback('lib/missing/deep/chat.ts','studio/task'),/LIST lib:/);
 assert.deepEqual(f.calls,[{path:'lib/missing/deep',branch:'studio/task'},{path:'lib',branch:'studio/task'}]);
 const exhausted=fixture({results:[missing(),missing(),missing()]});
 assert.match(await exhausted.feedback('lib/a/b/c/d.ts','studio/task'),/READ_REJECTED/);
 assert.equal(exhausted.calls.length,3);
});
test('deep task paths reach repository root within the original three-read bound',async()=>{
 const missing=()=>Error('GitHub API 404 for /contents/missing');
 const f=fixture({results:[missing(),missing(),[{path:'lib',type:'dir'}]]});
 const result=await f.feedback('apps/course-builder/studio/task/visual.ts','studio/task');
 assert.match(result,/LIST \/:/);
 assert.match(result,/"path":"lib"/);
 assert.deepEqual(f.calls.map(call=>call.path),['apps/course-builder/studio/task','apps','']);
 assert.ok(f.calls.every(call=>call.branch==='studio/task'));
});
test('authorization and network failures are propagated without discovery retries',async()=>{
 for(const message of ['GitHub API 401 for /contents/lib: Bad credentials','GitHub API 403 for /contents/lib: Forbidden','request timed out']){
  const f=fixture({results:[Error(message)]});
  await assert.rejects(f.feedback('lib/ai/chat','studio/task'),{message});
  assert.equal(f.calls.length,1);
 }
});
test('planner records recovered directory evidence in durable observations',()=>{
 assert.ok(source.includes('observations.push(await rejectedReadFeedback(action.path, branch))'));
});

test('empty content searches can suggest real task-branch paths without exposing protected files',()=>{
 const pathGuard=source.slice(source.indexOf('function normalizePath('),source.indexOf('async function githubHeaders('));
 const selector=source.slice(source.indexOf('function suggestedSourcePaths('),source.indexOf('function parseAction('));
 const suggest=new Function('rankSourcePaths',pathGuard+selector+';return suggestedSourcePaths;')(rankSourcePaths);
 const tree=['lib/ai/chat.ts','lib/ai/providers/elevate.ts','lib/ai/auth/chat.ts','.env','lib/ai/github-token.ts'].map(path=>({type:'blob',path}));
 assert.deepEqual(suggest('ai.chat unknown failure',tree),['lib/ai/chat.ts','lib/ai/providers/elevate.ts']);
 assert.deepEqual(suggest('doesnotexist',tree),[]);
});

test('real fallback keeps a refined diagnostic query ahead of broad task words and stale inventory',async()=>{
 const pathGuard=source.slice(source.indexOf('function normalizePath('),source.indexOf('async function githubHeaders('));
 const selector=source.slice(source.indexOf('function suggestedSourcePaths('),source.indexOf('function parseAction('));
 const start=source.indexOf("      if (action.type === 'search') {",source.indexOf('export async function stageParisCodeRepair'));
 const end=source.indexOf("      if (action.type === 'read' || action.type === 'list')",start);
 assert.ok(start>0&&end>start);
 const producers=['lib/ultimate-course-builder/core/production-handlers.ts','lib/ultimate-course-builder/core/build-runner.ts','lib/ultimate-course-builder/core/repair-router.ts'];
 const aligned='lib/ultimate-course-builder/instructional/picture-timeline.mjs';
 const noise='lib/ultimate-course-builder/quality/lesson-quality.ts';
 const tree=[...producers,noise,aligned,'lib/auth/picture-alignment.ts'].map(path=>({type:'blob',path}));
 const query='PICTURE_CUE_NOT_ALIGNED_TO_SPEECH';
 const action={type:'search',query};
 const run=new Function('rankSourcePaths','rememberSourcePaths','action','task','githubJson','searchCode','previous',
  'return (async()=>{'+pathGuard+selector+
  ';const sourceEvidence={};const headSha="verified-head";const observations=[];let discoveredFiles=previous;for(let once=0;once<1;once++){'+
  source.slice(start,end)+'}return {discoveredFiles,observations};})()');
 const result=await run(rankSourcePaths,rememberSourcePaths,action,
  'Repair Course Builder lesson quality and approved content. REPAIR_PRODUCER_UNCHANGED:synchronization. Add tests.',
  async()=>({tree}),async()=>[],[noise]);
 const history=[...producers.map(path=>'read:'+path),'search:'+query.toLowerCase()];
 assert.deepEqual(recoverRepeatedInspection(history,action,[],result.discoveredFiles),{type:'read',path:aligned});
 assert.ok(!result.discoveredFiles.includes('lib/auth/picture-alignment.ts'));
});
